import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function Admin() {
  const { user } = useAppContext();

  return (
    <div className="min-h-screen bg-forest text-white p-12">
      <h1 className="text-5xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-xl">Welcome, {user?.name || 'Admin'}! You have full administrative access.</p>
      {/* Add admin-specific UI components here */}
    </div>
  );
}
