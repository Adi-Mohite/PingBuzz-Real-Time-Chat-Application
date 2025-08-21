import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { decryptMessage, encryptMessage } from "../utils/cryptoUtils";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { useState } from "react";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isAITyping: false,
  setAiTyping: (typing) => set({ isAITyping: typing }),

  // Sidebar users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Load and decrypt past messages
  getMessages: async (userId) => {
    const { selectedUser} = get();
    if (selectedUser._id === "ai-bot"){
      set({ messages: [] });
      return;
     }
    set({ isMessagesLoading: true });
    try {
      const { authUser, privateKey } = useAuthStore.getState();
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;

      const decryptedMessages = messages.map((msg) => {
        // Decrypt my own sent messages using stored receiverPublicKey
        if (msg.senderId === authUser._id) {
          try {
            const decryptedText = decryptMessage(
              msg.ciphertext,
              msg.nonce,
              decodeBase64(msg.receiverPublicKey), // ✅ stored in DB
              privateKey
            );
            return { ...msg, text: decryptedText };
          } catch (err) {
            console.error("Failed to decrypt my own message:", err);
            return { ...msg, text: "🔐 Unable to decrypt" };
          }
        }

        // Decrypt received messages
        if (!msg.senderPublicKey) {
          console.warn("⚠ Missing senderPublicKey for message", msg);
          return { ...msg, text: "🔐 Unable to decrypt (no key)" };
        }

        try {
          const decryptedText = decryptMessage(
            msg.ciphertext,
            msg.nonce,
            decodeBase64(msg.senderPublicKey), // Uint8Array(32)
            privateKey
          );
          return { ...msg, text: decryptedText };
        } catch (err) {
          console.error("Failed to decrypt message:", err, msg);
          return { ...msg, text: "🔐 Unable to decrypt" };
        }
      });

      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send encrypted message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser, privateKey, publicKey } = useAuthStore.getState();

    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected");
      return;
    }

     // 1️⃣ AI Chat Flow (skip encryption + DB)
  if (selectedUser._id === "ai-bot") {
    // Show my message immediately in UI
    get().setAiTyping(true);
    const userMsg = {
      _id: Date.now().toString(),
      senderId: authUser._id,
      receiverId: "ai-bot",
      text: messageData.text,
      image: messageData.image || null,
      createdAt: new Date().toISOString(),
    };
    set({ messages: [...messages, userMsg] });

    try {
      // Call AI backend
      const res = await axiosInstance.post("/ai/ask", { prompt: messageData.text });
      const aiReply = {
        _id: Date.now().toString() + "-ai",
        senderId: "ai-bot",
        receiverId: authUser._id,
        text: res.data.response,
        createdAt: new Date().toISOString(),
      };
      set({ messages: [...get().messages, aiReply] });
    } catch (error) {
      console.error("AI request failed:", error);
      toast.error("AI bot error");
    } finally {
        // Hide "typing"
       get().setAiTyping(false);
      }
    return; // 🚪 Exit — do NOT run the normal encryption flow
  }


    try {
      // Get recipient public key
      const receiverKeyRes = await axiosInstance.get(
        `/auth/public-key/${selectedUser._id}`
      );
      if (!receiverKeyRes.data?.publicKey) {
        throw new Error("Recipient public key not found");
      }

      const receiverPublicKeyBase64 = receiverKeyRes.data.publicKey;
      const receiverPublicKeyUint8 = decodeBase64(receiverPublicKeyBase64);

      if (privateKey.length !== 32 || receiverPublicKeyUint8.length !== 32) {
        toast.error("Invalid key length for encryption");
        return;
      }

      const { ciphertext, nonce } = encryptMessage(
        messageData.text,
        privateKey,
        receiverPublicKeyUint8
      );

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        {
          ciphertext,
          nonce,
          senderPublicKey: encodeBase64(publicKey),
          receiverPublicKey: receiverPublicKeyBase64, // ✅ store for reload decryption
          image: messageData.image || null,
        }
      );

      // Optimistically add my message
      const newMessage = {
        _id: res.data._id || Date.now().toString(),
        senderId: authUser._id,
        receiverId: selectedUser._id,
        receiverPublicKey: receiverPublicKeyBase64, // ✅ keep in store too
        text: messageData.text,
        image: messageData.image || null,
        createdAt: new Date().toISOString(),
      };

      set({ messages: [...messages, newMessage] });
    } catch (error) {
      console.error("sendMessage error:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Real‑time listener for current chat
  subscribeToMessages: (privateKey) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {


      // Only for messages from the currently selected user
      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      if (!newMessage.senderPublicKey) {
        console.error("❌ Missing senderPublicKey in newMessage", newMessage);
        return;
      }

      try {
        const decryptedText = decryptMessage(
          newMessage.ciphertext,
          newMessage.nonce,
          decodeBase64(newMessage.senderPublicKey),
          privateKey,
        );

        set({
          messages: [...get().messages, { ...newMessage, text: decryptedText }],
        });
      } catch (err) {
        console.error("Failed to decrypt incoming message:", err);
      }
    });
  },

  unsubscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
