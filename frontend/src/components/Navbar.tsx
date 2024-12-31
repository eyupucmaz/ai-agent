import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) return null;

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-space_cadet-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-xl font-bold text-fairy_tale-500 hover:text-fairy_tale-400 transition-all duration-300 transform hover:scale-105"
              >
                AI Code Agent
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`group relative inline-flex items-center px-4 py-2 text-sm font-medium text-fairy_tale-300 transition-all duration-300 rounded-md
                  ${
                    isActivePath('/')
                      ? 'text-fairy_tale-100 bg-space_cadet-600'
                      : 'hover:text-fairy_tale-100 hover:bg-space_cadet-600'
                  }`}
              >
                <span className="relative z-10">Home</span>
                <div
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-iris-400 transform origin-left transition-all duration-300
                  ${
                    isActivePath('/')
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
              <Link
                to="/repos"
                className={`group relative inline-flex items-center px-4 py-2 text-sm font-medium text-fairy_tale-300 transition-all duration-300 rounded-md
                  ${
                    isActivePath('/repos')
                      ? 'text-fairy_tale-100 bg-space_cadet-600'
                      : 'hover:text-fairy_tale-100 hover:bg-space_cadet-600'
                  }`}
              >
                <span className="relative z-10">Repos</span>
                <div
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-iris-400 transform origin-left transition-all duration-300
                  ${
                    isActivePath('/repos')
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
              <Link
                to="/chat"
                className={`group relative inline-flex items-center px-4 py-2 text-sm font-medium text-fairy_tale-300 transition-all duration-300 rounded-md
                  ${
                    isActivePath('/chat')
                      ? 'text-fairy_tale-100 bg-space_cadet-600'
                      : 'hover:text-fairy_tale-100 hover:bg-space_cadet-600'
                  }`}
              >
                <span className="relative z-10">Chat</span>
                <div
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-iris-400 transform origin-left transition-all duration-300
                  ${
                    isActivePath('/chat')
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user && (
              <span className="text-fairy_tale-300 mr-4">
                Welcome, {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                bg-electric_purple-500 hover:bg-electric_purple-600 transition-all duration-300 transform hover:scale-105
                shadow-sm hover:shadow-lg hover:shadow-electric_purple-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
