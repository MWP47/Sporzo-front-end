import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

const Notification = ({ type = "success", message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <FaCheckCircle className="text-green-400 text-xl" />,
    error: <FaExclamationCircle className="text-red-400 text-xl" />,
    info: <FaInfoCircle className="text-blue-400 text-xl" />,
  };

  const bgColors = {
    success: "bg-green-500/20 border-green-500/50",
    error: "bg-red-500/20 border-red-500/50",
    info: "bg-blue-500/20 border-blue-500/50",
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 flex items-center gap-3 ${bgColors[type]} border backdrop-blur-lg rounded-lg px-4 py-3 shadow-lg animate-slide-in-right max-w-md`}
    >
      {icons[type]}
      <p className="text-white flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification;
