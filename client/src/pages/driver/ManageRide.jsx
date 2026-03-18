import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

export default function ManageRide() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rideRes, bookingsRes] = await Promise.all([
        api.get(`/rides/${id}`),
        api.get(`/bookings/ride/${id}`)
      ]);
      setRide(rideRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      setError('Failed to load ride');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept');
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Reject this booking?')) return;
    try {
      await api.patch(`/bookings/${bookingId}/reject`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleLockUnlock = async (seatNumber, currentStatus) => {
    const action = currentStatus === 'locked' ? 'unlock' : 'lock';
    try {
      await api.patch(`/rides/${id}/seats`, { seatNumber, action });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update seat');
    }
  };

  const handleCancelRide = async () => {
    if (!window.confirm('Cancel this entire ride? All passengers will be notified.')) return;
    try {
      await api.patch(`/rides/${id}/cancel`);
      navigate('/driver');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel ride');
    }
  };

  const getSeatColor = (seat) => {
    switch (seat.status) {
      case 'available': return 'bg-white text-gray-700 border-gray-200';
      case 'held':      return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'booked':    return 'bg-green-100 text-green-600 border-green-200';
      case 'locked':    return 'bg-red-100 text-red-400 border-red-200';
      default:          return 'bg-gray-100 border-gray-200';
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

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');

  const openInMaps = (lat, lng, landmark) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Ride not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/driver')} className="text-gray-400 hover:text-gray-600">←</button>
        <div>
          <h1 className="text-base font-semibold text-gray-800">
            {ride.startStop} → {ride.endStop}
          </h1>
          <p className="text-xs text-gray-400">{ride.date} at {ride.departureTime}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Seat grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Seats</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { color: 'bg-white border-gray-200', label: 'Available' },
              { color: 'bg-yellow-100', label: 'Held' },
              { color: 'bg-green-100', label: 'Booked' },
              { color: 'bg-red-100', label: 'Locked' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded border ${color}`} />
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Driver row */}
          <div className="w-full flex justify-start mb-2">
            <div className="bg-gray-100 rounded-lg px-3 py-1 text-xs text-gray-500">
              🚗 Driver
            </div>
          </div>

          {/* Seats */}
          <div className="flex flex-col items-center gap-2">
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row} className="flex gap-3 w-full justify-center">
                {ride.seats.slice(row * 2, row * 2 + 2).map(seat => (
                  <button
                    key={seat.number}
                    onClick={() => {
                      if (seat.status === 'available' || seat.status === 'locked') {
                        handleLockUnlock(seat.number, seat.status);
                      }
                    }}
                    className={`w-16 h-14 rounded-xl border-2 text-sm font-medium transition ${getSeatColor(seat)} ${
                      seat.status === 'available' || seat.status === 'locked'
                        ? 'cursor-pointer hover:opacity-80'
                        : 'cursor-default'
                    }`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            Tap available seat to lock · Tap locked seat to unlock
          </p>
        </div>

        {/* Pending requests */}
        {pendingBookings.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Pending Requests ({pendingBookings.length})
            </p>
            <div className="space-y-3">
              {pendingBookings.map(booking => (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl border border-yellow-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800">
                      {booking.passengerId.name}, {booking.passengerId.age}
                    </p>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      Seat {booking.seatNumber}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {booking.pickupLandmark}, {booking.pickupStop}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    🏁 Dropoff: {booking.dropoffStop}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(booking._id)}
                      className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(booking._id)}
                      className="flex-1 border border-red-200 text-red-500 rounded-xl py-2 text-sm font-medium hover:bg-red-50 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmed passengers */}
        {acceptedBookings.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Confirmed Passengers ({acceptedBookings.length})
            </p>
            <div className="space-y-3">
              {acceptedBookings.map(booking => (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800">
                      {booking.passengerId.name}, {booking.passengerId.age}
                    </p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Seat {booking.seatNumber}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {booking.pickupLandmark}, {booking.pickupStop}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    🏁 Dropoff: {booking.dropoffStop}
                  </p>
                  {booking.pickupCoordinates?.lat && (
                    <button
                      onClick={() => openInMaps(
                        booking.pickupCoordinates.lat,
                        booking.pickupCoordinates.lng,
                        booking.pickupLandmark
                      )}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      → Open in Google Maps
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No bookings */}
        {bookings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No booking requests yet</p>
          </div>
        )}

        {/* Cancel ride */}
        {ride.status === 'scheduled' && (
          <button
            onClick={handleCancelRide}
            className="w-full border border-red-200 text-red-500 rounded-2xl py-3 text-sm font-medium hover:bg-red-50 transition mt-4"
          >
            Cancel Ride
          </button>
        )}

      </div>
    </div>
  );
}