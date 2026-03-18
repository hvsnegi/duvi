import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/useAuth';

export default function Verify() {
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const phone = localStorage.getItem('pendingPhone');

const handleSubmit = async () => {
  if (submitted) return;
  setSubmitted(true);

  if (!otp || otp.length !== 6) {
    setError('Please enter the 6 digit OTP');
    setSubmitted(false);
    return;
  }

  if (isNewUser && (!name || !age)) {
    setError('Please enter your name and age');
    setSubmitted(false);
    return;
  }

  setLoading(true);
  setError('');

  try {
    const res = await api.post('/auth/verify-otp', {
      phone,
      otp,
      ...(isNewUser && { name, age: parseInt(age) })
    });

    login(res.data.user, res.data.token);

    if (res.data.user.role === 'driver') navigate('/driver');
    else if (res.data.user.role === 'admin') navigate('/admin');
    else navigate('/home');

  } catch (err) {
    setSubmitted(false);
    const errorMsg = err.response?.data?.error || 'Something went wrong';

    if (err.response?.data?.isNewUser) {
      setIsNewUser(true);
      setError('Please enter your name and age to complete signup');
    } else {
      setError(errorMsg);
    }
  } finally {
    setLoading(false);
  }
};

  if (!phone) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-600">Duvi</h1>
        <p className="text-gray-500 mt-1">Dehradun → Garud</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Verify OTP</h2>
        <p className="text-gray-500 text-sm mb-6">
          Enter the OTP sent to <span className="font-medium text-gray-700">+91 {phone}</span> on WhatsApp
        </p>

        {/* OTP input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">OTP</label>
          <input
            type="tel"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
           
            placeholder="6 digit OTP"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-800 text-sm focus:border-blue-400 tracking-widest text-center text-lg"
          />
        </div>

        {/* New user fields */}
        {isNewUser && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-800 text-sm focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Your age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                min="10"
                max="100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none text-gray-800 text-sm focus:border-blue-400"
              />
            </div>
          </div>
        )}

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
          {loading ? 'Verifying...' : isNewUser ? 'Complete Signup' : 'Verify OTP'}
        </button>

        {/* Back */}
        <button
          onClick={() => navigate('/login')}
          className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-600"
        >
          ← Change number
        </button>
      </div>
    </div>
  );
}