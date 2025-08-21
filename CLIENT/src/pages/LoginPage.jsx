import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import Lottie from "lottie-react";
import AnimationData from "../assets/lottieAnimations/AI robot assistant.json";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(formData);
      if (!user || !user.encryptedPrivateKey) {
        throw new Error("Login failed: No encrypted private key returned.");
      }
    } catch (err) {
      console.error("❌ Login or key decryption failed:", err.message);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 pt-14">
      {/* Left side (Form) */}
      <div className="flex flex-col justify-center items-center px-4 sm:px-8 py-6">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white space-y-0.5">
          {/* Logo + Title */}
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 group">
              <div className="rounded-xl bg-transparent flex items-center justify-center animate-bounce space-y-0.5">
                <img
                  src="/PingBuzzLogo2.png"
                  className="w-36 h-40 sm:w-36 sm:h-28 md:w-44 md:h-32 object-contain"
                  alt="Logo"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl text-black font-bold mt-2">
                Welcome Back
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Sign in to your account
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-slate-800 font-medium">
                  Email
                </span>
              </label>
              <div className="relative">
                <label className="input bg-gray-200 text-black input-bordered flex items-center w-full gap-2 pl-3">
                  <Mail className="size-5 text-black" />
                  <input
                    type="email"
                    placeholder="Enter Your Email"
                    className="w-full bg-transparent outline-none"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </label>
              </div>
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
                    placeholder="********"
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

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Link to Signup */}
          <div className="text-center">
            <p className="text-slate-600 text-sm sm:text-base">
              Don't have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Mobile Animation (below form) */}
        <div className="w-full max-w-md mt-10 lg:hidden">
          <Lottie
            animationData={AnimationData}
            loop
            autoplay
            className="w-full max-h-72 sm:max-h-80"
          />
        </div>
      </div>

      {/* Right side Animation (only for large screens) */}
      <div className="hidden lg:flex items-center justify-center">
        <Lottie
          animationData={AnimationData}
          loop
          autoplay
          className="w-full max-w-lg"
        />
      </div>
    </div>
  );
};

export default LoginPage;
