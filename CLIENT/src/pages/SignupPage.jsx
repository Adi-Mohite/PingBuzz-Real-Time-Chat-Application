import React, { useState } from "react";
import Lottie from "lottie-react";
import AnimationData from "../assets/lottieAnimations/Smartphone message.json";
import { useAuthStore } from "../store/useAuthStore";
import { generateEncryptedKeyPair } from "../utils/cryptoUtils.js";
import { Eye, EyeOff, Loader2, Lock, User, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full Name is requred");
    if (!formData.email.trim()) return toast.error("Email is requred");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid Email format");
    if (!formData.password.trim()) return toast.error("Password is requred");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success !== true) return;

    try {
      const { publicKey, encryptedPrivateKey } = await generateEncryptedKeyPair(
        formData.password
      );
      await signup({ ...formData, publicKey, encryptedPrivateKey });
    } catch (error) {
      console.error("Key generation or signup failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 pt-14">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <div className="w-full bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md space-y-6 sm:space-y-8">
          <div className="text-center mb-2">
            <div className="flex flex-col items-center group space-y-0.5">
              <div className="rounded-2xl bg-transparent flex items-center justify-center animate-bounce">
                <img
                  src="/PingBuzzLogo2.png"
                  className="w-36 h-40 sm:w-36 sm:h-28 md:w-44 md:h-32 object-contain"
                  alt="Logo"
                />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl text-black font-bold">
                Create Account
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Get Started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-800 font-medium">
                  Full Name
                </span>
              </label>
              <label className="input bg-gray-200 input-bordered flex items-center w-full gap-2 pl-3">
                <User className="size-5 text-black" />
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  value={formData.fullName}
                  className="w-full text-black bg-transparent outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </label>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-800 font-medium">
                  Email
                </span>
              </label>
              <label className="input bg-gray-200 input-bordered flex items-center w-full gap-2 pl-3">
                <Mail className="size-5 text-black" />
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  className="w-full text-black bg-transparent outline-none"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </label>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-800 font-medium">
                  Password
                </span>
              </label>
              <div className="relative w-full">
                <div className="input input-bordered bg-gray-200 flex items-center gap-2 pl-3 pr-10 w-full">
                  <Lock className="size-5 text-black" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    className="w-full text-black bg-transparent outline-none"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-black" />
                  ) : (
                    <Eye className="size-5 text-black" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-slate-600 text-sm sm:text-base">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Lottie for Desktop */}
      <div className="hidden lg:flex items-center justify-center p-6">
        <Lottie
          animationData={AnimationData}
          loop
          autoplay
          className="w-full max-w-lg h-auto"
        />
      </div>

      {/* Bottom Lottie for Mobile & Tablet */}
      <div className="flex lg:hidden items-center justify-center p-6">
        <Lottie
          animationData={AnimationData}
          loop
          autoplay
          className="w-full max-w-xs sm:max-w-sm h-auto"
        />
      </div>
    </div>
  );
};

export default SignupPage;
