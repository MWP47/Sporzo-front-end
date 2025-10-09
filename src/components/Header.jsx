import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaFutbol, FaHome, FaSearch, FaCloudSun, FaUser, FaBars, FaTimes, FaHistory } from "react-icons/fa";

const Header = ({ onLogout }) => {
  const [time, setTime] = useState(new Date());
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user from localStorage and check login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (token && user?.name) {
        setIsLoggedIn(true);
        setUserName(user.name);
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    };
    
    checkLoginStatus();
    
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-11 h-11 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/50">
              <FaFutbol className="text-black text-xl animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Sporzo
              </h1>
              <p className="text-xs text-gray-400">Your Game, Your Turf</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/') 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <FaHome /> Home
            </button>
            <button
              onClick={() => navigate('/browse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/browse') 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              <FaSearch /> Browse Turfs
            </button>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/booking-history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/booking-history') 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'text-gray-300 hover:text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                <FaHistory /> History
              </button>
            )}
            <a
              href="#weather"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
            >
              <FaCloudSun /> Weather
            </a>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm font-mono">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {isLoggedIn ? (
              <>
                {/* User Info - Logged In */}
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden md:flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <FaUser className="text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">
                    {userName}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="hidden md:flex bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Button - Not Logged In */}
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Login
                </button>

                {/* Register Button - Not Logged In */}
                <button
                  onClick={() => navigate('/register')}
                  className="hidden md:flex bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30"
                >
                  Register
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-800 pt-4 space-y-2">
            <button
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/') 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <FaHome /> Home
            </button>
            <button
              onClick={() => {
                navigate('/browse');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/browse') 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <FaSearch /> Browse Turfs
            </button>
            {isLoggedIn && (
              <button
                onClick={() => {
                  navigate('/booking-history');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/booking-history') 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <FaHistory /> Booking History
              </button>
            )}
            <a
              href="#weather"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-all"
            >
              <FaCloudSun /> Weather
            </a>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FaUser />
                    <span className="font-semibold">{userName} - View Profile</span>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors border border-gray-700"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Register
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
