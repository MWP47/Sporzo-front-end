import React, { useState, useEffect } from 'react';
import turfOwnerService from '../services/turfOwnerService';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState('');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setStatus('checking');
    try {
      const result = await turfOwnerService.testConnection();
      if (result.success) {
        setStatus('online');
        setDetails('Backend is running');
      } else {
        setStatus('offline');
        setDetails(result.message || 'Backend not responding');
      }
    } catch (error) {
      setStatus('offline');
      setDetails(`Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
        status === 'online' ? 'bg-green-600' :
        status === 'offline' ? 'bg-red-600' :
        'bg-yellow-600'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          status === 'online' ? 'bg-white animate-pulse' :
          status === 'offline' ? 'bg-white' :
          'bg-white animate-spin'
        }`}></div>
        <span className="text-white text-sm font-semibold">
          {status === 'online' ? '✓ Backend Online' :
           status === 'offline' ? '✗ Backend Offline' :
           '⟳ Checking...'}
        </span>
        {status === 'offline' && (
          <button
            onClick={checkBackend}
            className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
          >
            Retry
          </button>
        )}
      </div>
      {details && status === 'offline' && (
        <div className="mt-2 px-4 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
          {details}
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
