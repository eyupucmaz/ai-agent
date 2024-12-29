import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center text-2xl font-extrabold text-white hover:text-pink-100 transition duration-300"
            >
              AI Agent
            </Link>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-white font-semibold text-base">
                  Merhaba, {user?.githubUsername || user?.username}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transform hover:scale-105 transition duration-300 shadow-md"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
