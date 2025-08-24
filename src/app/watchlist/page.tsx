'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { WatchlistStock } from '../../utils/watchlist';
import WatchListButton from '../../components/WatchListButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRouter } from 'next/navigation';

type SortField = 'symbol' | 'latest_score' | 'latest_price' | 'latest_change_percent' | 'added_at';
type SortDirection = 'asc' | 'desc';

export default function WatchListPage() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('added_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      fetchWatchlist();
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null values
    if (aValue === null) aValue = sortDirection === 'asc' ? Infinity : -Infinity;
    if (bValue === null) bValue = sortDirection === 'asc' ? Infinity : -Infinity;

    // Handle string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSelectAll = () => {
    setSelectedStocks(sortedWatchlist.map(stock => stock.symbol));
  };

  const handleDeselectAll = () => {
    setSelectedStocks([]);
  };

  const handleToggleStock = (symbol: string) => {
    setSelectedStocks(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleRemoveSelected = async () => {
    if (!user?.email || selectedStocks.length === 0) return;

    setIsRemoving(true);
    try {
      const results = await Promise.all(
        selectedStocks.map(symbol =>
          fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'remove',
              symbol,
              userEmail: user.email,
            }),
          }).then(res => res.json())
        )
      );

      const failed = results.filter(result => !result.success);
      if (failed.length === 0) {
        setWatchlist(prev => prev.filter(stock => !selectedStocks.includes(stock.symbol)));
        setSelectedStocks([]);
      } else {
        alert(`Failed to remove ${failed.length} stocks. Please try again.`);
      }
    } catch (error) {
      console.error('Error removing stocks:', error);
      alert('Failed to remove stocks. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Symbol', 'Company', 'Sector', 'Score', 'Rating', 'Price', 'Change %', 'Added Date'];
    const csvContent = [
      headers.join(','),
      ...sortedWatchlist.map(stock => [
        stock.symbol,
        `"${stock.company_name}"`,
        `"${stock.sector}"`,
        stock.latest_score || 'N/A',
        stock.latest_rating || 'N/A',
        stock.latest_price || 'N/A',
        stock.latest_change_percent || 'N/A',
        new Date(stock.added_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResearchStock = (symbol: string) => {
    router.push(`/?symbol=${encodeURIComponent(symbol)}`);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${marketCap.toFixed(0)}`;
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'STRONG BUY': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'BUY': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'WEAK BUY': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'HOLD': return 'text-gray-400 bg-gray-900/20 border-gray-500';
      case 'AVOID': return 'text-red-400 bg-red-900/20 border-red-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sign in to view your watchlist</h1>
          <p className="text-gray-400">Please sign in to access your personalized watchlist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
        <p className="text-gray-400">
          Track your favorite stocks and monitor their performance
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchWatchlist}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-white mb-4">Your watchlist is empty</h2>
          <p className="text-gray-400 mb-6">
            Start building your watchlist by running a stock screening and adding promising stocks.
          </p>
          <button
            onClick={() => router.push('/screening')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Stock Screening
          </button>
        </div>
      ) : (
        <>
          {/* Actions Bar */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">
                  {selectedStocks.length} of {watchlist.length} selected
                </span>
                {selectedStocks.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    disabled={isRemoving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 border border-red-500 hover:border-red-600 text-white rounded text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isRemoving ? 'Removing...' : `Remove ${selectedStocks.length}`}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white rounded text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Watchlist Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStocks.length === sortedWatchlist.length && sortedWatchlist.length > 0}
                        onChange={selectedStocks.length === sortedWatchlist.length ? handleDeselectAll : handleSelectAll}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleSort('symbol')}
                    >
                      <div className="flex items-center gap-1">
                        Symbol
                        {sortField === 'symbol' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-left">Sector</th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleSort('latest_score')}
                    >
                      <div className="flex items-center gap-1">
                        Score
                        {sortField === 'latest_score' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleSort('latest_price')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortField === 'latest_price' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleSort('latest_change_percent')}
                    >
                      <div className="flex items-center gap-1">
                        Change %
                        {sortField === 'latest_change_percent' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleSort('added_at')}
                    >
                      <div className="flex items-center gap-1">
                        Added
                        {sortField === 'added_at' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedWatchlist.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStocks.includes(stock.symbol)}
                          onChange={() => handleToggleStock(stock.symbol)}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{stock.symbol}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-300">{stock.company_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-400">{stock.sector}</div>
                      </td>
                      <td className="px-4 py-3">
                        {stock.latest_score ? (
                          <div className={`font-bold ${getScoreColor(stock.latest_score)}`}>
                            {stock.latest_score}/100
                          </div>
                        ) : (
                          <div className="text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stock.latest_rating ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${getRatingColor(stock.latest_rating)}`}>
                            {stock.latest_rating}
                          </span>
                        ) : (
                          <div className="text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stock.latest_price ? (
                          <div className="text-white">${stock.latest_price.toFixed(2)}</div>
                        ) : (
                          <div className="text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stock.latest_change_percent !== null ? (
                          <div className={`font-semibold ${stock.latest_change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.latest_change_percent >= 0 ? '+' : ''}{stock.latest_change_percent.toFixed(2)}%
                          </div>
                        ) : (
                          <div className="text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-400 text-sm">
                          {new Date(stock.added_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                                                 <div className="flex items-center gap-2">
                           <button
                             onClick={() => handleResearchStock(stock.symbol)}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white rounded text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                           >
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                             </svg>
                             Research
                           </button>
                           <WatchListButton
                             symbol={stock.symbol}
                             isWatched={true}
                             size="sm"
                             onToggle={(isWatched) => {
                               if (!isWatched) {
                                 setWatchlist(prev => prev.filter(s => s.symbol !== stock.symbol));
                               }
                             }}
                           />
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
