import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

export default function Rides() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const date = searchParams.get('date');
  const pickup = searchParams.get('pickup');
  const dropoff = searchParams.get('dropoff');

  const [exactRides, setExactRides] = useState([]);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rides', {
        params: { date, pickup, dropoff }
      });
      setExactRides(res.data.exactDate);
      setNearbyRides(res.data.nearbyDates);
    } catch (err) {
      setError('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = (ride) =>
    ride.seats.filter(s => s.status === 'available').length;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  const RideCard = ({ ride }) => (
    <div
      onClick={() => navigate(`/rides/${ride._id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-blue-200 transition"
    >
      {/* Driver + time */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-gray-800">{ride.driverId.name}</p>
          <p className="text-xs text-gray-400">Age {ride.driverId.age}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-600 font-semibold">{ride.departureTime}</p>
          <p className="text-xs text-gray-400">{formatDate(ride.date)}</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-gray-600">{ride.startStop}</p>
        <div className="flex-1 h-px bg-gray-200" />
        <p className="text-sm text-gray-600">{ride.endStop}</p>
      </div>

      {/* Fare + seats */}
      <div className="flex items-center justify-between">
        <p className="text-green-600 font-semibold">₹{ride.fare}</p>
        <p className="text-sm text-gray-400">
          {availableSeats(ride)} seat{availableSeats(ride) !== 1 ? 's' : ''} left
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Searching rides...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-800">
            {pickup} → {dropoff}
          </h1>
          <p className="text-xs text-gray-400">{formatDate(date)}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Exact date results */}
        {exactRides.length > 0 ? (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Available rides
            </p>
            <div className="space-y-3">
              {exactRides.map(ride => (
                <RideCard key={ride._id} ride={ride} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No rides on {formatDate(date)}</p>
          </div>
        )}

        {/* Nearby dates */}
        {nearbyRides.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Rides on nearby dates
            </p>
            <div className="space-y-3">
              {nearbyRides.map(ride => (
                <RideCard key={ride._id} ride={ride} />
              ))}
            </div>
          </div>
        )}

        {/* Nothing at all */}
        {exactRides.length === 0 && nearbyRides.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No rides found in the next 3 days</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 text-blue-600 text-sm"
            >
              Search different dates
            </button>
          </div>
        )}

      </div>
    </div>
  );
}