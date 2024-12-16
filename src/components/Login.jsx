import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/login',
        { username, password },
        { withCredentials: true }
      );
      console.log('Login response:', response);
  
      // Kontrollojmë rolin dhe drejtojmë përdoruesin
      const userRole = response.data.user.role;  // Merr rolin e përdoruesit nga përgjigja
  
      if (userRole === 'admin') {
        // Përdoruesi është admin, drejtoje në dashboard
        window.location.href = '/dashboard';
      } else {
        // Përdoruesi është user, drejtoje në homepage
        window.location.href = '/';
      }
  
    } catch (error) {
      console.error('Login error:', error.response || error.message);
      setMessage('Gabim gjatë login.');
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
    {/* Header */}
    <header className="bg-blue-600 shadow-md">
      <nav className="flex justify-between items-center px-8 py-6 text-white">
        <div className="text-3xl font-extrabold">Menaxhimi i Konferencave</div>
        <ul className="flex space-x-6 text-lg">
          <li><a href="/" className="hover:text-teal-300 transition duration-200">Home</a></li>
          <li><a href="/about-us" className="hover:text-teal-300 transition duration-200">About Us</a></li>
          <li><a href="/workshops" className="hover:text-teal-300 transition duration-200">Workshops</a></li>
          <li><a href="/event-highlights" className="hover:text-teal-300 transition duration-200">Event Highlights</a></li>
          <li><a href="/contact-us" className="hover:text-teal-300 transition duration-200">Contact</a></li>
        </ul>
      </nav>
    </header>

    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Hyr</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Shkruani username tuaj"
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Shkruani password tuaj"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out"
          >
            Hyr
          </button>
        </form>
        {message && <p className="mt-4 text-red-500 text-center">{message}</p>}

        <p className="mt-6 text-center text-gray-600">
          Nuk keni llogari?{' '}
          <a href="/register" className="text-blue-600 font-semibold hover:underline">
            Regjistrohu këtu
          </a>
        </p>
      </div>
    </div>
    <footer className="bg-gray-800 text-white text-center py-6">
        &copy; 2024 Menaxhimi i Konferencave. Të gjitha të drejtat të rezervuara.
      </footer>

    </div>
  );
};

export default Login;