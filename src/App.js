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

  // Show Navbar only on pages except onboarding
  const showNavbar = location.pathname !== "/onboarding";

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/browse" element={<TurfBrowse/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<FootballTurfBooking />} />
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/booking/:id" element={<TurfDetails />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </>
  );
}

export default App;
