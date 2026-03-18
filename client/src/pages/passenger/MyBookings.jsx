import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'accepted':  return 'bg-green-100 text-green-700';
      case 'rejected':  return 'bg-red-100 text-red-600';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default:          return 'bg-gray-100 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-base font-semibold text-gray-800">My Bookings</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No bookings yet</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 text-blue-600 text-sm"
            >
              Search for rides →
            </button>
          </div>
        ) : (
          bookings.map(booking => (
            <div
              key={booking._id}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              {/* Route + date */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {booking.rideId?.startStop} → {booking.rideId?.endStop}
                  </p>
                  <p className="text-xs text-gray-400">
                    {booking.rideId?.date} at {booking.rideId?.departureTime}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 mb-3">
                <p className="text-sm text-gray-600">
                  Seat <span className="font-medium">{booking.seatNumber}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Pickup: <span className="font-medium">{booking.pickupLandmark}, {booking.pickupStop}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Dropoff: <span className="font-medium">{booking.dropoffStop}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Fare: <span className="font-medium text-green-600">₹{booking.rideId?.fare}</span>
                </p>
              </div>

              {/* Cancel button */}
              {(booking.status === 'pending' || booking.status === 'accepted') && (
                <button
                  onClick={() => handleCancel(booking._id)}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  Cancel booking
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}