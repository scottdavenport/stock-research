'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

interface WatchListButtonProps {
  symbol: string;
  isWatched?: boolean;
  onToggle?: (isWatched: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function WatchListButton({ 
  symbol, 
  isWatched: initialIsWatched = false, 
  onToggle,
  size = 'md',
  showText = false 
}: WatchListButtonProps) {
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Check initial watchlist status
  useEffect(() => {
    if (user?.email && !isInitialized) {
      checkWatchlistStatus();
    }
  }, [user?.email, isInitialized]);

  const checkWatchlistStatus = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/watchlist?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const watchedSymbols = data.data.map((stock: any) => stock.symbol);
        const watched = watchedSymbols.includes(symbol);
        setIsWatched(watched);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const handleToggle = async () => {
    if (!user?.email || isLoading) return;

    setIsLoading(true);
    const newIsWatched = !isWatched;

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: newIsWatched ? 'add' : 'remove',
          symbol,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsWatched(newIsWatched);
        onToggle?.(newIsWatched);
        addToast(
          newIsWatched 
            ? `${symbol} added to watchlist` 
            : `${symbol} removed from watchlist`,
          'success'
        );
      } else {
        console.error('Error toggling watchlist:', data.error);
        // Revert the optimistic update
        setIsWatched(!newIsWatched);
        addToast(
          `Failed to ${newIsWatched ? 'add' : 'remove'} ${symbol} from watchlist`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      // Revert the optimistic update
      setIsWatched(!newIsWatched);
      addToast(
        `Failed to ${newIsWatched ? 'add' : 'remove'} ${symbol} from watchlist`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.email) {
    return null; // Don't show button if user is not authenticated
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md border
        ${isWatched 
          ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400' 
          : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${showText ? 'min-w-[120px]' : ''}
      `}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isLoading ? (
        <div className={`${sizeClasses[size]} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
        </div>
      ) : (
        <div className={`${sizeClasses[size]} flex items-center justify-center`}>
          {isWatched ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" opacity="0.3"/>
            </svg>
          )}
        </div>
      )}
      
      {showText && (
        <span className={textSizeClasses[size]}>
          {isLoading ? '...' : (isWatched ? 'Watching' : 'Watch')}
        </span>
      )}
    </button>
  );
}
