import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaBuilding, FaUser } from "react-icons/fa";
import Notification from "../components/Notification";
import turfOwnerService from "../services/turfOwnerService";

const TurfOwnerLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      showNotification("error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email: formData.email });
      showNotification("info", "Connecting to server...");

      const result = await turfOwnerService.login({
        email: formData.email,
        password: formData.password
      });

      console.log("Login result:", result);

      if (result.success) {
        showNotification("success", "Login successful! Redirecting to dashboard...");
        
        setTimeout(() => {
          navigate("/owner/dashboard");
        }, 2000);
      } else {
        showNotification("error", result.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("warning", "Backend connection failed. Trying offline mode...");
      
      // Fallback to demo credentials and registered users for development
      const demoAccounts = [
        { email: "owner@sporzo.com", password: "owner123", name: "John Doe", businessName: "Elite Sports Arena" },
        { email: "admin@sporzo.com", password: "admin123", name: "Admin User", businessName: "Sporzo Management" }
      ];

      // Check registered users in localStorage
      const registeredOwners = JSON.parse(localStorage.getItem("turfOwners")) || [];
      
      // First check demo accounts
      let account = demoAccounts.find(acc => 
        acc.email === formData.email && acc.password === formData.password
      );

      // If not found in demo accounts, check registered users
      if (!account) {
        account = registeredOwners.find(owner => 
          owner.email === formData.email
        );
        
        // For registered users, we can't verify password in localStorage (it should be hashed)
        // So we'll allow login if email matches (for development purposes)
        if (account) {
          showNotification("info", "Note: Password verification skipped in offline mode");
        }
      }

      if (account) {
        // Store owner data locally as fallback
        const ownerData = {
          id: account.id || "owner1",
          name: account.name,
          email: account.email,
          businessName: account.businessName,
          role: "turf_owner"
        };

        localStorage.setItem("turfOwner", JSON.stringify(ownerData));
        localStorage.setItem("turfOwnerToken", "demo_token_" + Date.now());

        showNotification("success", "Login successful! (Offline mode)");
        
        setTimeout(() => {
          navigate("/owner/dashboard");
        }, 2000);
      } else {
        showNotification("error", "Login failed. Please check your credentials or register first.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center px-4">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBuilding className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Turf Owner Portal
          </h1>
          <p className="text-gray-400 mt-2">Manage your turfs and bookings</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Demo Credentials</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div><strong>Email:</strong> owner@sporzo.com</div>
                <div><strong>Password:</strong> owner123</div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing In...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/owner/register"
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Don't have an account? Register as Turf Owner
            </Link>
            <div className="text-gray-500 text-sm">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                Customer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfOwnerLogin;
