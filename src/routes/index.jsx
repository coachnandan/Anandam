import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Loader from '../components/Loader';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Customers = React.lazy(() => import('../pages/Customers'));
const Attendance = React.lazy(() => import('../pages/Attendance'));
const Memberships = React.lazy(() => import('../pages/Memberships'));
const Visitor = React.lazy(() => import('../pages/Visitor'));
const Closing = React.lazy(() => import('../pages/Closing'));
const Notifications = React.lazy(() => import('../pages/Notifications'));
const Analytics = React.lazy(() => import('../pages/Analytics'));
const Settings = React.lazy(() => import('../pages/Settings'));
const Profile = React.lazy(() => import('../pages/Profile'));
const OtherClubMembers = React.lazy(() => import('../pages/OtherClubMembers'));
const Login = React.lazy(() => import('../pages/Login'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Customers />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="memberships" element={<Memberships />} />
            <Route path="visitor" element={<Visitor />} />
            <Route path="other-club-members" element={<OtherClubMembers />} />
            <Route path="closing" element={<Closing />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all: redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
