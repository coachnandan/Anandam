import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-offwhite">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 mb-6">
          You do not have permission to view this page. Please contact your administrator if you think this is an error.
        </p>
        <button
          onClick={goHome}
          className="px-6 py-2 bg-forest text-white rounded hover:bg-gray-900/50 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
