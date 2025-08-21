import React, { useEffect } from "react";
import Navbar from "./component/Navbar";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";

import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import nacl from "tweetnacl";


const App = () => {
  const { authUser, checkAuth, isCheckingAuth, setDecryptedKeyPair } = useAuthStore();

  useEffect(() => {
    const rehydrateKeyPair = () => {
      const storedPrivateKey = sessionStorage.getItem("privateKey");
      if (!storedPrivateKey) return;

      try {
        const privateKeyBytes = new Uint8Array(JSON.parse(storedPrivateKey));
        const keyPair = nacl.box.keyPair.fromSecretKey(privateKeyBytes);

        setDecryptedKeyPair({
          privateKey: privateKeyBytes,
          publicKey: keyPair.publicKey,
        });
      } catch (err) {
        console.error("🔐 Failed to rehydrate key pair:", err);
      }
    };

    rehydrateKeyPair();
    checkAuth?.();
  }, []);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin size-10" />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
