// src/pages/Dashboard.jsx
import React from "react";
import TurfCard from "../components/TurfCard"; // your existing component
import { FaFootballBall, FaUsers, FaCalendarAlt } from "react-icons/fa";

const turfs = [
  { id: 1, name: "Green Field Turf", location: "Downtown", price: "$50/hr" },
  { id: 2, name: "Sunrise Turf", location: "Uptown", price: "$40/hr" },
  { id: 3, name: "Stadium Turf", location: "City Center", price: "$60/hr" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Stats Section */}
      <div className="bg-white shadow-md rounded-lg p-6 m-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center p-4 bg-blue-500 text-white rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <FaFootballBall className="text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Total Turfs</h2>
            <p className="text-2xl">12</p>
          </div>
        </div>
        <div className="flex items-center p-4 bg-green-500 text-white rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <FaUsers className="text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Total Users</h2>
            <p className="text-2xl">240</p>
          </div>
        </div>
        <div className="flex items-center p-4 bg-yellow-500 text-white rounded-lg shadow hover:scale-105 transition-transform duration-300">
          <FaCalendarAlt className="text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Bookings Today</h2>
            <p className="text-2xl">18</p>
          </div>
        </div>
      </div>

      {/* Turf Cards Section */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {turfs.map((turf) => (
          <TurfCard
            key={turf.id}
            name={turf.name}
            location={turf.location}
            price={turf.price}
          />
        ))}
      </div>
    </div>
  );
}
