import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                AI Code Agent
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Ana Sayfa
              </Link>
              <Link
                to="/repos"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Repolar
              </Link>
              <Link
                to="/chat"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Chat
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user && (
              <span className="text-gray-700 mr-4">
                Hoş geldin, {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
