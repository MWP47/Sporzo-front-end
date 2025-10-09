import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Onboarding from "./pages/Onboarding";
import TurfBrowse from "./pages/BrowsingPage";
import FootballTurfBooking from "./pages/FootballTurfBooking";
import TurfDetails from "./pages/TurfDetails";
import UserProfile from "./pages/UserProfile";
import BookingHistory from "./pages/BookingHistory";
import ErrorBoundary from "./components/ErrorBoundary";

// Turf Owner Components
import TurfOwnerLogin from "./pages/TurfOwnerLogin";
import TurfOwnerRegister from "./pages/TurfOwnerRegister";
import TurfOwnerDashboard from "./pages/TurfOwnerDashboard";
import TurfManagement from "./pages/TurfManagement";
import TurfBookingManagement from "./pages/TurfBookingManagement";
import OwnerAnalytics from "./pages/OwnerAnalytics";

function App() {
  return <MainApp />;
}

function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to onboarding if not onboarded
  useEffect(() => {
    const onboarded = localStorage.getItem("onboarded");
    if (!onboarded) {
      navigate("/onboarding");
    }
  }, [navigate]);

  // Show Navbar only on pages except onboarding and owner pages
  const showNavbar = location.pathname !== "/onboarding" && !location.pathname.startsWith("/owner");

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        {/* Customer Routes */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/browse" element={<TurfBrowse/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<FootballTurfBooking />} />
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/booking/:id" element={<ErrorBoundary><TurfDetails /></ErrorBoundary>} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        
        {/* Turf Owner Routes */}
        <Route path="/owner/login" element={<TurfOwnerLogin />} />
        <Route path="/owner/register" element={<TurfOwnerRegister />} />
        <Route path="/owner/dashboard" element={<TurfOwnerDashboard />} />
        <Route path="/owner/turf-management" element={<ErrorBoundary><TurfManagement /></ErrorBoundary>} />
        <Route path="/owner/turf-management/edit/:id" element={<ErrorBoundary><TurfManagement /></ErrorBoundary>} />
        <Route path="/owner/bookings" element={<TurfBookingManagement />} />
        <Route path="/owner/analytics" element={<OwnerAnalytics />} />
      </Routes>
    </>
  );
}

export default App;
