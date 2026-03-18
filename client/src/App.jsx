import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Verify from './pages/Verify';

import PassengerHome from './pages/passenger/Home';
import Rides from './pages/passenger/Rides';
import RideDetail from './pages/passenger/RideDetail';
import MyBookings from './pages/passenger/MyBookings';

import DriverHome from './pages/driver/Home';
import Schedule from './pages/driver/Schedule';
import ManageRide from './pages/driver/ManageRide';

import AdminDashboard from './pages/admin/Dashboard';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'driver') return <Navigate to="/driver" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/home" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Passenger */}
      <Route path="/home" element={
        <ProtectedRoute role="passenger">
          <PassengerHome />
        </ProtectedRoute>
      } />
      <Route path="/rides" element={
        <ProtectedRoute role="passenger">
          <Rides />
        </ProtectedRoute>
      } />
      <Route path="/rides/:id" element={
        <ProtectedRoute role="passenger">
          <RideDetail />
        </ProtectedRoute>
      } />
      <Route path="/my-bookings" element={
        <ProtectedRoute role="passenger">
          <MyBookings />
        </ProtectedRoute>
      } />

      {/* Driver */}
      <Route path="/driver" element={
        <ProtectedRoute role="driver">
          <DriverHome />
        </ProtectedRoute>
      } />
      <Route path="/driver/schedule" element={
        <ProtectedRoute role="driver">
          <Schedule />
        </ProtectedRoute>
      } />
      <Route path="/driver/rides/:id" element={
        <ProtectedRoute role="driver">
          <ManageRide />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}