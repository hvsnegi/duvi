import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/useAuth';

export default function DriverHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const res = await api.get('/rides/driver');
      setRides(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bookedSeats = (ride) =>
    ride.seats.filter(s => s.status === 'booked').length;

  const availableSeats = (ride) =>
    ride.seats.filter(s => s.status === 'available').length;

  const statusStyle = (status) => {
    switch (status) {
      case 'scheduled':  return 'bg-blue-100 text-blue-700';
      case 'completed':  return 'bg-green-100 text-green-700';
      case 'cancelled':  return 'bg-red-100 text-red-600';
      default:           return 'bg-gray-100 text-gray-500';
    }
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const todayRides = rides.filter(r => isToday(r.date) && r.status === 'scheduled');
  const upcomingRides = rides.filter(r => !isToday(r.date) && r.status === 'scheduled');
  const pastRides = rides.filter(r => r.status !== 'scheduled');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const RideCard = ({ ride }) => (
    <div
      onClick={() => navigate(`/driver/rides/${ride._id}`)}
      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-blue-200 transition"
    >
      {/* Date + status */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-800">
          {ride.date} at {ride.departureTime}
        </p>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle(ride.status)}`}>
          {ride.status}
        </span>
      </div>

      {/* Route */}
      <p className="text-sm text-gray-500 mb-3">
        {ride.startStop} → {ride.endStop}
      </p>

      {/* Seat fill bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{bookedSeats(ride)} booked</span>
          <span>{availableSeats(ride)} available</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(bookedSeats(ride) / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Fare */}
      <p className="text-xs text-gray-400">₹{ride.fare} per seat</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Duvi</h1>
          <p className="text-xs text-gray-400">Driver Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Today's rides */}
        {todayRides.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Today
            </p>
            <div className="space-y-3">
              {todayRides.map(ride => (
                <RideCard key={ride._id} ride={ride} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming rides */}
        {upcomingRides.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Upcoming
            </p>
            <div className="space-y-3">
              {upcomingRides.map(ride => (
                <RideCard key={ride._id} ride={ride} />
              ))}
            </div>
          </div>
        )}

        {/* No rides */}
        {todayRides.length === 0 && upcomingRides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No upcoming rides</p>
            <p className="text-gray-400 text-xs mt-1">Schedule your first ride below</p>
          </div>
        )}

        {/* Past rides */}
        {pastRides.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Past rides
            </p>
            <div className="space-y-3">
              {pastRides.map(ride => (
                <RideCard key={ride._id} ride={ride} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Schedule button */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <button
          onClick={() => navigate('/driver/schedule')}
          className="w-full bg-blue-600 text-white rounded-2xl py-4 text-sm font-medium hover:bg-blue-700 shadow-lg transition"
        >
          + Schedule New Ride
        </button>
      </div>

    </div>
  );
}