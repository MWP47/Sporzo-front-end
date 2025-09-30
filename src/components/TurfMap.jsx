import React from "react";
import { FaMapMarkerAlt, FaDirections } from "react-icons/fa";

const TurfMap = ({ turfName, location, turfId }) => {
  // Generate coordinates based on turf ID (for demo purposes)
  // In production, you'd have actual coordinates from your database
  const getCoordinates = (id) => {
    const baseCoordinates = [
      { lat: 9.9312, lng: 76.2673, name: "Kochi" },
      { lat: 10.0261, lng: 76.3125, name: "Ernakulam" },
      { lat: 9.9816, lng: 76.2999, name: "Downtown" },
      { lat: 10.0150, lng: 76.3450, name: "Uptown" },
      { lat: 9.9650, lng: 76.2450, name: "Midtown" },
      { lat: 10.5276, lng: 76.2144, name: "Thrissur" },
      { lat: 9.9252, lng: 76.2711, name: "Alangad" },
      { lat: 10.1081, lng: 76.3520, name: "Aluva" },
    ];
    
    const index = (id - 1) % baseCoordinates.length;
    return baseCoordinates[index];
  };

  const coords = getCoordinates(turfId);
  
  // Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coords.lat},${coords.lng}&zoom=15`;
  
  // Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  return (
    <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <FaMapMarkerAlt className="text-emerald-400" />
          Location
        </h3>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors"
        >
          <FaDirections /> Get Directions
        </a>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-2">
          <span className="font-semibold">{turfName}</span>
        </p>
        <p className="text-gray-400">{location}</p>
        <p className="text-sm text-gray-500 mt-1">
          Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </p>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-96 rounded-xl overflow-hidden border-2 border-gray-700">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${turfName}`}
        ></iframe>
      </div>

      {/* Map Info */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Area</p>
          <p className="font-semibold text-emerald-400">{coords.name}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Latitude</p>
          <p className="font-semibold text-cyan-400">{coords.lat.toFixed(4)}°</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Longitude</p>
          <p className="font-semibold text-cyan-400">{coords.lng.toFixed(4)}°</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg text-center font-semibold hover:bg-blue-500/30 transition-colors text-sm"
        >
          Open in Google Maps
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
            alert('Coordinates copied to clipboard!');
          }}
          className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-lg text-center font-semibold hover:bg-purple-500/30 transition-colors text-sm"
        >
          Copy Coordinates
        </button>
      </div>
    </div>
  );
};

export default TurfMap;
