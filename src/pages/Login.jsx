import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaFutbol, FaEnvelope, FaLock, FaGoogle, FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Call your login API
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { identifier, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // Save token & user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess("✅ Login successful! Redirecting...");

      // Redirect after short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || "❌ Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Background Circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-lg animate-pulse"></div>

      {/* Main Login Card */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30 p-8 w-full max-w-md relative z-10 hover:border-emerald-500/30 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
            <FaFutbol className="text-4xl text-black" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Sporzo
          </h1>
          <p className="text-gray-400 text-sm">Smart Football Turf Booking</p>
          <p className="text-gray-500 text-xs mt-1">Welcome back! Sign in to continue</p>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <p className="bg-red-500/20 text-red-400 px-4 py-2 rounded mb-4 text-center border border-red-500/30">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-500/20 text-green-400 px-4 py-2 rounded mb-4 text-center border border-green-500/30">
            {success}
          </p>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Email/Phone */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              <FaEnvelope className="inline mr-2" />Email or Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone"
              required
              className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              <FaLock className="inline mr-2" />Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 pr-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black py-3 rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 text-lg"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-700/30"></div>
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-700/30"></div>
        </div>

        {/* Social Login Options */}
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-800/30 border border-gray-700/30 py-3 rounded-xl hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2">
            <FaGoogle className="text-red-400" /> Google
          </button>
          <button className="flex-1 bg-gray-800/30 border border-gray-700/30 py-3 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2">
            <FaFacebook className="text-blue-400" /> Facebook
          </button>
        </div>

        {/* Register Link */}
        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{" "}
          <span
            className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors font-medium"
            onClick={() => navigate("/register")}
          >
            Create Account
          </span>
        </p>

        {/* Owner Portal Link */}
        <div className="mt-4 text-center">
          <span
            className="text-purple-400 hover:text-purple-300 cursor-pointer transition-colors font-medium text-sm"
            onClick={() => navigate("/owner/login")}
          >
            🏢 Turf Owner? Login Here
          </span>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="fixed bottom-6 left-6 z-20 text-sm text-gray-500">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-800/30">
          © 2025 Sporzo - Smart Football Turf Booking
        </div>
      </div>
    </div>
  );
};

export default Login;
