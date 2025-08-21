'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg">Stock Research</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Research
            </Link>
            <Link
              href="/screening"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/screening')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Screener
            </Link>
            {user && (
              <Link
                href="/watchlist"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('/watchlist')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>⭐</span>
                Watchlist
              </Link>
            )}
            
            {/* Auth Links */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-gray-300 text-sm">
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/login')
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
