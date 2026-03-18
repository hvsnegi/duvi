import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10 digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-otp', { phone });
      // Save phone to use on verify page
      localStorage.setItem('pendingPhone', phone);
      navigate('/verify');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600">Duvi</h1>
        <p className="text-gray-500 mt-1">Dehradun → Garud</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your phone number to continue</p>

        {/* Phone input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Phone number</label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400">
            <span className="text-gray-400 text-sm mr-2">+91</span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="9876543210"
              className="flex-1 outline-none text-gray-800 text-sm"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          You will receive an OTP on WhatsApp
        </p>
      </div>
    </div>
  );
}