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
            <div className="w-8 h-8 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg">Stock Research</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive('/')
                  ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent hover:border-gray-600'
              }`}
            >
              Research
            </Link>
            <Link
              href="/screening"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive('/screening')
                  ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent hover:border-gray-600'
              }`}
            >
              Screener
            </Link>
            {user && (
              <Link
                href="/watchlist"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                  isActive('/watchlist')
                    ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent hover:border-gray-600'
                }`}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Watchlist
              </Link>
            )}
            
            {/* Auth Links */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 border border-transparent hover:border-gray-600 transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      isActive('/login')
                        ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent hover:border-gray-600'
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
