import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const ROUTE = [
  'Dehradun',
  'Rishikesh',
  'Shivpuri',
  'Byasi',
  'Devprayag',
  'Srinagar (Garhwal)',
  'Rudraprayag',
  'Augustmuni',
  'Karnprayag',
  'Garud',
];

export default function PassengerHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [pickup, setPickup] = useState('Dehradun');
  const [dropoff, setDropoff] = useState('Garud');
  const [error, setError] = useState('');

  const handleSearch = () => {
    const pickupIndex = ROUTE.indexOf(pickup);
    const dropoffIndex = ROUTE.indexOf(dropoff);

    if (pickupIndex >= dropoffIndex) {
      setError(`Dropoff must come after pickup on the route`);
      return;
    }

    setError('');
    navigate(`/rides?date=${date}&pickup=${pickup}&dropoff=${dropoff}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-600">Duvi</h1>
          <p className="text-xs text-gray-400">Dehradun → Garud</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            My Bookings
          </button>
          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm">Where are you headed?</p>
      </div>

      {/* Search Card */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          </div>

          {/* Pickup */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Pickup stop</label>
            <select
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
            >
              {ROUTE.slice(0, -1).map(stop => (
                <option key={stop} value={stop}>{stop}</option>
              ))}
            </select>
          </div>

          {/* Dropoff */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Dropoff stop</label>
            <select
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
            >
              {ROUTE.slice(1).map(stop => (
                <option key={stop} value={stop}>{stop}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 transition"
          >
            Search Rides
          </button>
        </div>
      </div>

      {/* Route info */}
      <div className="px-4 mt-6">
        <p className="text-xs text-gray-400 mb-3">Stops on this route</p>
        <div className="flex flex-col gap-1">
          {ROUTE.map((stop, index) => (
            <div key={stop} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-600' : index === ROUTE.length - 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
                {index < ROUTE.length - 1 && (
                  <div className="w-0.5 h-4 bg-gray-200" />
                )}
              </div>
              <p className="text-sm text-gray-600">{stop}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}