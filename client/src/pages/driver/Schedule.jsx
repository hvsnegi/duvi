import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

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

export default function Schedule() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [departureTime, setDepartureTime] = useState('06:00');
  const [startStop, setStartStop] = useState('Dehradun');
  const [endStop, setEndStop] = useState('Garud');
  const [fare, setFare] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // Calculate stop times preview
  const calculatePreview = () => {
    const startIndex = ROUTE.indexOf(startStop);
    const endIndex = ROUTE.indexOf(endStop);

    if (startIndex >= endIndex) {
      setError('End stop must come after start stop');
      setPreview(null);
      return;
    }

    setError('');
    const stops = ROUTE.slice(startIndex, endIndex + 1);
    const [hours, mins] = departureTime.split(':').map(Number);
    const depMins = hours * 60 + mins;

    const MINUTES = [0, 45, 75, 95, 125, 155, 185, 215, 235, 245];

    const startMins = MINUTES[startIndex];
    const result = stops.map((stop, i) => {
      const offset = MINUTES[startIndex + i] - startMins;
      const total = depMins + offset;
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      return {
        location: stop,
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      };
    });

    setPreview(result);
  };

  const handleSubmit = async () => {
    if (!date || !departureTime || !startStop || !endStop || !fare) {
      setError('All fields are required');
      return;
    }

    if (ROUTE.indexOf(startStop) >= ROUTE.indexOf(endStop)) {
      setError('End stop must come after start stop');
      return;
    }

    if (parseInt(fare) <= 0) {
      setError('Please enter a valid fare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/rides', {
        date,
        departureTime,
        startStop,
        endStop,
        fare: parseInt(fare)
      });

      navigate('/driver');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/driver')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-base font-semibold text-gray-800">Schedule a Ride</h1>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">

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

          {/* Departure time */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Departure time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          </div>

          {/* Start stop */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Starting from</label>
            <select
              value={startStop}
              onChange={(e) => setStartStop(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
            >
              {ROUTE.slice(0, -1).map(stop => (
                <option key={stop} value={stop}>{stop}</option>
              ))}
            </select>
          </div>

          {/* End stop */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Ending at</label>
            <select
              value={endStop}
              onChange={(e) => setEndStop(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 bg-white"
            >
              {ROUTE.slice(1).map(stop => (
                <option key={stop} value={stop}>{stop}</option>
              ))}
            </select>
          </div>

          {/* Fare */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">Fare per seat (₹)</label>
            <input
              type="number"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              placeholder="800"
              min="1"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
            />
          </div>

          {/* Preview button */}
          <button
            onClick={calculatePreview}
            className="w-full border border-blue-200 text-blue-600 rounded-xl py-2 text-sm font-medium hover:bg-blue-50 transition"
          >
            Preview stops and times
          </button>

        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
              Stops on this ride
            </p>
            <div className="space-y-2">
              {preview.map((stop, index) => (
                <div key={stop.location} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === preview.length - 1 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    {index < preview.length - 1 && (
                      <div className="w-0.5 h-4 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <p className="text-sm text-gray-700">{stop.location}</p>
                    <p className="text-xs text-gray-400">{stop.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm px-1">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-2xl py-4 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-lg transition"
        >
          {loading ? 'Scheduling...' : 'Schedule Ride'}
        </button>

      </div>
    </div>
  );
}