import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";
import {
  decryptPrivateKey,
  generateEncryptedKeyPair,
} from "../utils/cryptoUtils";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:5001"; // no /api here for socket

const storePrivateKeyInSession = (key) => {
  sessionStorage.setItem("privateKey", JSON.stringify(Array.from(key)));
};

const clearPrivateKeyFromSession = () => {
  sessionStorage.removeItem("privateKey");
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  privateKey: null,
  publicKey: null,
  isCheckingAuth: false,
  socket: null,
  isUpdatingProfile: false,
  onlineUsers: [],

  setAuthUser: (user) => set({ authUser: user }),

  setDecryptedKeyPair: ({ privateKey, publicKey }) =>
    set({
      privateKey,
      publicKey,
    }),

  login: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const user = res.data;

      if (!user?.encryptedPrivateKey || !user?.publicKey) {
        throw new Error("Login failed: Missing key data");
      }

      const decryptedKeyPair = await decryptPrivateKey(
        user.encryptedPrivateKey,
        data.password
      );

      storePrivateKeyInSession(decryptedKeyPair.privateKey);

      set({
        authUser: user,
        privateKey: decryptedKeyPair.privateKey,
        publicKey: decryptedKeyPair.publicKey,
      });

      if (!sessionStorage.getItem("pageReloaded")) {
        sessionStorage.setItem("pageReloaded", "true");
        window.location.reload();
      }

      get().connectSocket();
      return user;
    } catch (err) {
      console.error("❌ Login error", err);
      return {
        success: false,
        error: err.response?.data?.error || err.message || "Login failed",
      };
    }
  },

  signup: async (data) => {
    try {
      const keyPair = await generateEncryptedKeyPair(data.password);

      const res = await axiosInstance.post("/auth/signup", {
        ...data,
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: keyPair.encryptedPrivateKey,
      });

      const user = res.data;

      const decrypted = await decryptPrivateKey(
        keyPair.encryptedPrivateKey,
        data.password
      );

      storePrivateKeyInSession(decrypted.privateKey);

      set({
        authUser: user,
        privateKey: decrypted.privateKey,
        publicKey: decrypted.publicKey,
      });
      if (!sessionStorage.getItem("pageReloaded")) {
        sessionStorage.setItem("pageReloaded", "true");
        window.location.reload();
      }

      get().connectSocket();
      return { success: true };
    } catch (err) {
      console.error("❌ Signup error", err);
      return { success: false, error: err.message || "Signup failed" };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout");
      clearPrivateKeyFromSession();
      sessionStorage.removeItem("pageReloaded");
      set({ authUser: null, privateKey: null, publicKey: null });

      get().disconnectSocket();
    } catch (err) {
      console.error("⚠️ Logout request failed", err);
    }

    clearPrivateKeyFromSession();
    set({ authUser: null, privateKey: null, publicKey: null });
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });

      // Restore private key from session
      // ✅ Restore private key from session before connecting socket
      get().rehydrateKeyPair();

      // Wait until privateKey is set before connecting socket
      if (get().privateKey) {
        get().connectSocket();
      } else {
        console.warn(
          "⚠️ Private key not found in session, skipping socket connect"
        );
      }
    } catch (err) {
      console.warn("Auth check failed:", err);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // checkAuth: async () => {
  //   set({ isCheckingAuth: true });
  //   try {
  //     const res = await axiosInstance.get("/auth/check");
  //     set({ authUser: res.data });
  //     get().connectSocket();
  //   } catch (err) {
  //     console.warn("Auth check failed:", err);
  //     set({ authUser: null });
  //   } finally {
  //     set({ isCheckingAuth: false });
  //   }
  // },

  rehydrateKeyPair: () => {
    const storedKey = sessionStorage.getItem("privateKey");
    if (storedKey) {
      set({ privateKey: Uint8Array.from(JSON.parse(storedKey)) });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
