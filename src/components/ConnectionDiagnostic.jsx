import React, { useState } from 'react';
import { FaWifi, FaExclamationTriangle, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import turfOwnerService from '../services/turfOwnerService';

const ConnectionDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic connectivity
    addResult('Basic Connectivity', 'running', 'Testing basic server connection...');
    try {
      const response = await fetch('http://localhost:5000/', { method: 'GET' });
      if (response.ok) {
        const text = await response.text();
        addResult('Basic Connectivity', 'success', 'Server is reachable', { status: response.status, response: text });
      } else {
        addResult('Basic Connectivity', 'error', `Server responded with ${response.status}`, { status: response.status });
      }
    } catch (error) {
      addResult('Basic Connectivity', 'error', 'Cannot reach server', { error: error.message });
    }

    // Test 2: Authentication
    addResult('Authentication', 'running', 'Checking authentication status...');
    const token = turfOwnerService.getAuthToken();
    const owner = turfOwnerService.getCurrentOwner();
    
    if (!token) {
      addResult('Authentication', 'error', 'No authentication token found', { token: 'missing' });
    } else if (!owner) {
      addResult('Authentication', 'error', 'No owner data found', { token: 'present', owner: 'missing' });
    } else {
      addResult('Authentication', 'success', `Authenticated as ${owner.name}`, { 
        token: 'present', 
      });
    }

    // Test 3: API Endpoint Access
    if (token) {
      addResult('API Access', 'running', 'Testing authentication endpoint...');
      try {
        const testResponse = await fetch('http://localhost:5000/api/turf-owners/test-auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (testResponse.ok) {
          const authData = await testResponse.json();
          addResult('API Access', 'success', 'Authentication successful', { 
            status: testResponse.status,
            owner: authData.owner
          });
        } else {
          const errorData = await testResponse.json();
          addResult('API Access', 'error', `Authentication failed: ${testResponse.status}`, { 
            status: testResponse.status, 
            error: errorData 
          });
        }
      } catch (error) {
        addResult('API Access', 'error', 'API request failed', { error: error.message });
      }
    } else {
      addResult('API Access', 'skipped', 'Skipped - no authentication token');
    }

    // Test 4: CORS
    addResult('CORS', 'running', 'Testing CORS configuration...');
    try {
      const response = await fetch('http://localhost:5000/api/turf-owners/register', {
        method: 'OPTIONS'
      });
      addResult('CORS', 'success', 'CORS preflight successful', { status: response.status });
    } catch (error) {
      if (error.message.includes('CORS')) {
        addResult('CORS', 'error', 'CORS configuration issue', { error: error.message });
      } else {
        addResult('CORS', 'warning', 'CORS test inconclusive', { error: error.message });
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="text-green-400" />;
      case 'error': return <FaExclamationTriangle className="text-red-400" />;
      case 'running': return <FaSpinner className="text-blue-400 animate-spin" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-400" />;
      default: return <FaWifi className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-500/50 bg-green-500/10';
      case 'error': return 'border-red-500/50 bg-red-500/10';
      case 'running': return 'border-blue-500/50 bg-blue-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg max-w-md z-50 shadow-2xl border border-gray-600">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-emerald-400">Connection Diagnostic</h3>
        <button 
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Test'}
        </button>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-gray-400 text-sm">Click "Run Test" to diagnose connection issues</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className={`p-2 rounded border text-xs ${getStatusColor(result.status)}`}>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(result.status)}
                <span className="font-semibold">{result.test}</span>
                <span className="text-gray-400 text-xs">{result.timestamp}</span>
              </div>
              <p className="text-gray-300">{result.message}</p>
              {result.details && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-400 hover:text-white">Details</summary>
                  <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConnectionDiagnostic;
