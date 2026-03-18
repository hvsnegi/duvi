import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/useAuth';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, ridesRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/rides'),
        api.get('/admin/logs')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRides(ridesRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDriver = async (userId) => {
    if (!window.confirm('Promote this user to verified driver?')) return;
    try {
      await api.patch(`/admin/users/${userId}/make-driver`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleSuspend = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleUnsuspend = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/unsuspend`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await api.patch(`/admin/rides/${rideId}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const roleStyle = (role) => {
    switch (role) {
      case 'driver':    return 'bg-blue-100 text-blue-700';
      case 'admin':     return 'bg-purple-100 text-purple-700';
      default:          return 'bg-gray-100 text-gray-600';
    }
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default:          return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Duvi Admin</h1>
          <p className="text-xs text-gray-400">{user?.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:text-red-600"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-4">
        {['overview', 'users', 'rides', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-medium capitalize border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">

        {/* Overview tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: stats.users.total },
                { label: 'Drivers', value: stats.users.drivers },
                { label: 'Passengers', value: stats.users.passengers },
                { label: 'Pending Verify', value: stats.users.pendingVerification },
                { label: 'Total Rides', value: stats.rides.total },
                { label: 'Scheduled', value: stats.rides.scheduled },
                { label: 'Total Bookings', value: stats.bookings.total },
                { label: 'Pending Bookings', value: stats.bookings.pending },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-2xl font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">+91 {u.phone} · Age {u.age}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleStyle(u.role)}`}>
                      {u.role}
                    </span>
                    {u.isSuspended && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                        suspended
                      </span>
                    )}
                    {u.role === 'driver' && u.isVerified && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                        verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {u.role === 'passenger' && (
                    <button
                      onClick={() => handleMakeDriver(u._id)}
                      className="text-xs border border-blue-200 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50"
                    >
                      Make Driver
                    </button>
                  )}
                  {u.role !== 'admin' && !u.isSuspended && (
                    <button
                      onClick={() => handleSuspend(u._id)}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1 rounded-lg hover:bg-red-50"
                    >
                      Suspend
                    </button>
                  )}
                  {u.isSuspended && (
                    <button
                      onClick={() => handleUnsuspend(u._id)}
                      className="text-xs border border-green-200 text-green-600 px-3 py-1 rounded-lg hover:bg-green-50"
                    >
                      Unsuspend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rides tab */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            {rides.map(ride => (
              <div key={ride._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {ride.startStop} → {ride.endStop}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ride.date} at {ride.departureTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      Driver: {ride.driverId?.name} · ₹{ride.fare}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle(ride.status)}`}>
                    {ride.status}
                  </span>
                </div>

                {ride.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancelRide(ride._id)}
                    className="text-xs border border-red-200 text-red-500 px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Logs tab */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log._id} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 font-medium">{log.action}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  By: {log.userId?.name} ({log.role})
                </p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No logs yet</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}