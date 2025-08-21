import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { WatchlistStock } from '../utils/watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch watchlist on mount and when user changes
  useEffect(() => {
    if (user?.email) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
      setWatchedSymbols([]);
    }
  }, [user?.email]);

  const fetchWatchlist = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlist?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        setWatchlist(data.data || []);
        setWatchedSymbols((data.data || []).map((stock: WatchlistStock) => stock.symbol));
      } else {
        setError(data.error || 'Failed to fetch watchlist');
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError('Failed to fetch watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, notes?: string) => {
    if (!user?.email) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          symbol,
          userEmail: user.email,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWatchedSymbols(prev => [...prev, symbol]);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, error: 'Failed to add to watchlist' };
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!user?.email) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          symbol,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWatchedSymbols(prev => prev.filter(s => s !== symbol));
        setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return { success: false, error: 'Failed to remove from watchlist' };
    }
  };

  const bulkAddToWatchlist = async (symbols: string[]) => {
    if (!user?.email) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-add',
          symbols,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWatchedSymbols(prev => [...new Set([...prev, ...symbols])]);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error bulk adding to watchlist:', error);
      return { success: false, error: 'Failed to bulk add to watchlist' };
    }
  };

  const isWatched = (symbol: string) => {
    return watchedSymbols.includes(symbol);
  };

  const getWatchlistCount = () => {
    return watchlist.length;
  };

  return {
    watchlist,
    watchedSymbols,
    isLoading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    bulkAddToWatchlist,
    isWatched,
    getWatchlistCount,
    refreshWatchlist: fetchWatchlist,
  };
}
