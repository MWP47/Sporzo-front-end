import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaFutbol, FaHome, FaSearch, FaUser, FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isAuthPage 
        ? 'bg-black/50 backdrop-blur-xl border-b border-gray-800 py-3' 
        : isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-md py-2' 
          : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${isScrolled ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'} group-hover:scale-110`}>
              <FaFutbol className="text-2xl text-black" />
            </div>
            <div>
              <span className={`font-bold text-2xl transition-all duration-300 ${
                isAuthPage || !isScrolled 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent'
              }`}>
                Sporzo
              </span>
              <p className={`text-xs -mt-1 ${isAuthPage || !isScrolled ? 'text-white/70' : 'text-gray-500'}`}>Smart Booking</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isAuthPage || !isScrolled
                  ? (isActiveLink('/') ? 'text-white bg-white/20' : 'text-white/80 hover:text-white hover:bg-white/10')
                  : (isActiveLink('/') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50')
              }`}
            >
              <FaHome /> Home
            </Link>
            <Link 
              to="/browse" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isAuthPage || !isScrolled
                  ? (isActiveLink('/browse') ? 'text-white bg-white/20' : 'text-white/80 hover:text-white hover:bg-white/10')
                  : (isActiveLink('/browse') ? 'text-cyan-600 bg-cyan-50' : 'text-gray-700 hover:text-cyan-600 hover:bg-cyan-50')
              }`}
            >
              <FaSearch /> Browse Turfs
            </Link>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              to="/login" 
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isAuthPage || !isScrolled
                  ? 'text-white hover:bg-white/10'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg ${
                isAuthPage || !isScrolled
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-xl transform hover:-translate-y-0.5'
                  : isScrolled
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-white text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden flex flex-col space-y-1.5 p-2 rounded-lg transition-all duration-300 ${isScrolled ? 'bg-gray-100' : 'bg-white/10'}`}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 rounded-full transition-all duration-300 ${isScrolled ? 'bg-gray-800' : 'bg-white'} ${isMenuOpen ? 'transform rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 rounded-full transition-all duration-300 ${isScrolled ? 'bg-gray-800' : 'bg-white'} ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`w-6 h-0.5 rounded-full transition-all duration-300 ${isScrolled ? 'bg-gray-800' : 'bg-white'} ${isMenuOpen ? 'transform -rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'}`}>
          <div className={`py-4 space-y-3 rounded-2xl ${isScrolled ? 'bg-white shadow-lg' : 'bg-white/10 backdrop-blur-md'}`}>
            <Link 
              to="/" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-300 ${isScrolled 
                ? (isActiveLink('/') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-100') 
                : (isActiveLink('/') ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaHome /> Home
            </Link>
            <Link 
              to="/browse" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-300 ${isScrolled 
                ? (isActiveLink('/browse') ? 'bg-cyan-50 text-cyan-600' : 'text-gray-700 hover:bg-gray-100') 
                : (isActiveLink('/browse') ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaSearch /> Browse Turfs
            </Link>
            <div className="border-t mx-4 my-2 border-gray-200"></div>
            <Link 
              to="/login" 
              className={`block px-4 py-3 rounded-lg mx-2 transition-all duration-300 ${isScrolled 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={`block px-4 py-3 mx-2 rounded-lg transition-all duration-300 ${isScrolled 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                : 'bg-white text-emerald-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;