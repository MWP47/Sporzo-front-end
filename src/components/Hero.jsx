import React from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/f2.jpg"; // ✅ Import the image

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative min-h-screen flex items-center px-4 overflow-hidden text-white"
      style={{
        backgroundImage: `url(${bgImage})`, // ✅ Use imported image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay to darken the background */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold mb-4">
          Premium{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Football Turf
          </span>{" "}
          Booking
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Experience the ultimate football booking platform with real-time
          weather intelligence, premium venues, and smart pricing.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate("/browse")}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
          >
            Book Now
          </button>
          <button
            onClick={() => navigate("/browse")}
            className="border border-emerald-400/30 text-emerald-400 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400/10 transition-all"
          >
            View Venues
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
  