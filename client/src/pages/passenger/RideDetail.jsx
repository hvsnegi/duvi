import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/useAuth';

const ROUTE = [
  'Dehradun', 'Rishikesh', 'Shivpuri', 'Byasi',
  'Devprayag', 'Srinagar (Garhwal)', 'Rudraprayag',
  'Augustmuni', 'Karnprayag', 'Garud'
];

export default function RideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [pickupStop, setPickupStop] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropoffStop, setDropoffStop] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRide();
  }, []);

  const fetchRide = async () => {
    try {
      const res = await api.get(`/rides/${id}`);
      setRide(res.data);
      setPickupStop(res.data.startStop);
      setDropoffStop(res.data.endStop);
    } catch (err) {
      setError('Failed to load ride');
    } finally {
      setLoading(false);
    }
  };

  const getSeatColor = (seat) => {
    if (seat.number === selectedSeat) return 'bg-blue-600 text-white border-blue-600';
    switch (seat.status) {
      case 'available': return 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 cursor-pointer';
      case 'held':      return 'bg-yellow-100 text-yellow-600 border-yellow-200 cursor-not-allowed';
      case 'booked':    return 'bg-green-100 text-green-600 border-green-200 cursor-not-allowed';
      case 'locked':    return 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed';
      default:          return 'bg-gray-100 border-gray-200';
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeat(seat.number === selectedSeat ? null : seat.number);
    setError('');
  };

  // Get valid dropoff stops (must come after pickup)
  const validDropoffs = ride?.stops.filter(stop => {
    const pickupIndex = ROUTE.indexOf(pickupStop);
    const stopIndex = ROUTE.indexOf(stop.location);
    return stopIndex > pickupIndex;
  }) || [];

  // Get valid pickup stops (must be on this ride, not the last stop)
  const validPickups = ride?.stops.filter(stop =>
    stop.location !== ride.endStop
  ) || [];

  const handleBook = async () => {
    if (!selectedSeat) {
      setError('Please select a seat');
      return;
    }
    if (!pickupLandmark.trim()) {
      setError('Please enter your pickup landmark');
      return;
    }

    setBooking(true);
    setError('');

    try {
      await api.post('/bookings', {
        rideId: id,
        seatNumber: selectedSeat,
        pickupStop,
        pickupLandmark,
        dropoffStop
      });

      setSuccess('Seat booked! Waiting for driver to accept.');
      setSelectedSeat(null);
      fetchRide(); // refresh seat status

    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading ride...</p>
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
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">←</button>
        <div>
          <h1 className="text-base font-semibold text-gray-800">
            {ride.startStop} → {ride.endStop}
          </h1>
          <p className="text-xs text-gray-400">{ride.date} at {ride.departureTime}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Driver info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{ride.driverId.name}</p>
              <p className="text-sm text-gray-400">Age {ride.driverId.age}</p>
            </div>
            <p className="text-green-600 font-bold text-lg">₹{ride.fare}</p>
          </div>
        </div>

        {/* Stops */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Stops</p>
          <div className="space-y-2">
            {ride.stops.map((stop, index) => (
              <div key={stop._id} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-blue-600' :
                    index === ride.stops.length - 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  {index < ride.stops.length - 1 && (
                    <div className="w-0.5 h-4 bg-gray-200" />
                  )}
                </div>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-sm text-gray-700">{stop.location}</p>
                  <p className="text-xs text-gray-400">{stop.estimatedTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seat Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Select a seat</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { color: 'bg-white border-gray-200', label: 'Available' },
              { color: 'bg-blue-600', label: 'Selected' },
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

          {/* Grid */}
          <div className="flex flex-col items-center gap-2">
            {/* Driver row */}
            <div className="w-full flex justify-start mb-2">
              <div className="bg-gray-100 rounded-lg px-3 py-1 text-xs text-gray-500">
                🚗 Driver
              </div>
            </div>

            {/* Seats in rows of 2 */}
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row} className="flex gap-3 w-full justify-center">
                {ride.seats.slice(row * 2, row * 2 + 2).map(seat => (
                  <button
                    key={seat.number}
                    onClick={() => handleSeatClick(seat)}
                    className={`w-16 h-14 rounded-xl border-2 text-sm font-medium transition ${getSeatColor(seat)}`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Booking form — only show when seat selected */}
        {selectedSeat && (
          <div className="bg-white rounded-2xl border border-blue-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Seat {selectedSeat} selected
            </p>

            {/* Pickup stop */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pickup stop</label>
              <select
                value={pickupStop}
                onChange={(e) => {
                  setPickupStop(e.target.value);
                  setDropoffStop(''); // reset dropoff
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
              >
                {validPickups.map(stop => (
                  <option key={stop.location} value={stop.location}>
                    {stop.location} ({stop.estimatedTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup landmark */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Pickup landmark
              </label>
              <input
                type="text"
                value={pickupLandmark}
                onChange={(e) => setPickupLandmark(e.target.value)}
                placeholder="e.g. Near Clock Tower, HDFC Bank"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
              />
            </div>

            {/* Dropoff stop */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dropoff stop</label>
              <select
                value={dropoffStop}
                onChange={(e) => setDropoffStop(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
              >
                {validDropoffs.map(stop => (
                  <option key={stop.location} value={stop.location}>
                    {stop.location} ({stop.estimatedTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Book button */}
            <button
              onClick={handleBook}
              disabled={booking}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {booking ? 'Booking...' : `Confirm Seat ${selectedSeat} — ₹${ride.fare}`}
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-green-700 text-sm">{success}</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="mt-2 text-green-600 text-sm font-medium"
            >
              View My Bookings →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}