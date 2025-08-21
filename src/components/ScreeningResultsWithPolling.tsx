'use client';

import { useState } from 'react';
import { useScreeningResults } from '../hooks/useScreeningResults';
import { ScreeningSession, ScreeningResultWithSession } from '../types/stock';
import LoadingSpinner from './LoadingSpinner';

interface ScreeningResultsWithPollingProps {
  sessionId: string;
  userEmail: string;
}

export default function ScreeningResultsWithPolling({ sessionId, userEmail }: ScreeningResultsWithPollingProps) {
  const { 
    session, 
    results, 
    latestSession, 
    latestResults, 
    isLoading, 
    error, 
    isPolling, 
    pollCount, 
    lastPollTime, 
    retry 
  } = useScreeningResults(sessionId, userEmail);
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'changePercent' | 'symbol'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getProgressMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Initializing screening process...';
      case 'processing':
      case 'running':
        return 'Processing stocks and calculating scores...';
      case 'completed':
        return 'Screening completed successfully!';
      case 'failed':
        return 'Screening failed. Please try again.';
      case 'replaced':
        return 'Screening was replaced by a newer session.';
      default:
        return 'Processing...';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'STRONG BUY':
        return 'text-green-400 bg-green-900/20';
      case 'BUY':
        return 'text-green-300 bg-green-900/10';
      case 'WEAK BUY':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'HOLD':
        return 'text-gray-400 bg-gray-900/20';
      case 'WEAK SELL':
        return 'text-orange-400 bg-orange-900/20';
      case 'SELL':
        return 'text-red-400 bg-red-900/20';
      case 'STRONG SELL':
        return 'text-red-500 bg-red-900/30';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const exportToCSV = () => {
    if (!results.length) return;

    const headers = ['Rank', 'Symbol', 'Company', 'Score', 'Rating', 'Price', 'Change %', 'Sector'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.rankPosition,
        result.symbol,
        `"${result.name}"`,
        result.score,
        result.rating,
        result.price,
        result.changePercent,
        `"${result.sector}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening-results-${sessionId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAndSortedResults = results
    .filter(result => {
      if (filterRating !== 'all' && result.rating !== filterRating) return false;
      if (filterSector !== 'all' && result.sector !== filterSector) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'changePercent':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        default:
          aValue = a.score;
          bValue = b.score;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const sectors = [...new Set(results.map(r => r.sector))].sort();
  const ratings = ['STRONG BUY', 'BUY', 'WEAK BUY', 'HOLD', 'WEAK SELL', 'SELL', 'STRONG SELL'];

  // Helper function to render results table
  const renderResults = (resultsToShow: ScreeningResultWithSession[], sessionToShow: ScreeningSession | null) => {
    if (!resultsToShow.length) return null;

    const filteredAndSorted = resultsToShow
      .filter(result => {
        if (filterRating !== 'all' && result.rating !== filterRating) return false;
        if (filterSector !== 'all' && result.sector !== filterSector) return false;
        return true;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'score':
            aValue = a.score;
            bValue = b.score;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'changePercent':
            aValue = a.changePercent;
            bValue = b.changePercent;
            break;
          case 'symbol':
            aValue = a.symbol;
            bValue = b.symbol;
            break;
          default:
            aValue = a.score;
            bValue = b.score;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        {/* Summary Cards */}
        {sessionToShow && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{sessionToShow.totalStocksScreened}</div>
              <div className="text-sm text-gray-400">Total Screened</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{sessionToShow.totalBuyRated}</div>
              <div className="text-sm text-gray-400">Buy Rated</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{sessionToShow.buyPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Buy Percentage</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{sessionToShow.averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Avg Score</div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="score">Score</option>
              <option value="rating">Rating</option>
              <option value="changePercent">Change %</option>
              <option value="symbol">Symbol</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Rating:</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="all">All</option>
              {ratings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Sector:</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            >
              <option value="all">All</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportToCSV()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-2 text-gray-400">Rank</th>
                <th className="text-left py-2 px-2 text-gray-400">Symbol</th>
                <th className="text-left py-2 px-2 text-gray-400">Company</th>
                <th className="text-left py-2 px-2 text-gray-400">Score</th>
                <th className="text-left py-2 px-2 text-gray-400">Rating</th>
                <th className="text-left py-2 px-2 text-gray-400">Price</th>
                <th className="text-left py-2 px-2 text-gray-400">Change %</th>
                <th className="text-left py-2 px-2 text-gray-400">Sector</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((result, index) => (
                <tr key={result.symbol} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-2 px-2 text-gray-300">{result.rankPosition}</td>
                  <td className="py-2 px-2 font-mono text-white">{result.symbol}</td>
                  <td className="py-2 px-2 text-white">{result.name}</td>
                  <td className={`py-2 px-2 font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(result.rating)}`}>
                      {result.rating}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-white">${result.price.toFixed(2)}</td>
                  <td className={`py-2 px-2 ${result.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-2 px-2 text-gray-300">{result.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No results match your current filters.
          </div>
        )}
      </div>
    );
  };

  // Always show debugging info at the top
  const debugSection = (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-purple-400 mb-3">🔍 Polling Debug Info</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400">Current Session:</span>
          <p className="text-white font-mono">{sessionId || 'None'}</p>
        </div>
        <div>
          <span className="text-gray-400">Poll Count:</span>
          <p className="text-white">{pollCount}</p>
        </div>
        <div>
          <span className="text-gray-400">Last Poll:</span>
          <p className="text-white">{lastPollTime ? new Date(lastPollTime).toLocaleTimeString() : 'Never'}</p>
        </div>
        <div>
          <span className="text-gray-400">Polling:</span>
          <p className={`font-semibold ${isPolling ? 'text-green-400' : 'text-gray-400'}`}>
            {isPolling ? '🟢 Active' : '🔴 Inactive'}
          </p>
        </div>
      </div>
      
      {latestSession ? (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">📊 Latest Session for {userEmail}</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Session ID:</span>
              <p className="text-white font-mono text-xs">{latestSession.id.slice(0, 8)}...</p>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <p className={`font-semibold ${
                latestSession.status === 'completed' ? 'text-green-400' : 
                latestSession.status === 'processing' || latestSession.status === 'running' ? 'text-yellow-400' : 
                latestSession.status === 'failed' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {latestSession.status.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>
              <p className="text-white">{new Date(latestSession.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400">Stocks:</span>
              <p className="text-white">{latestSession.totalStocksScreened}</p>
            </div>
            <div>
              <span className="text-gray-400">Buy Rated:</span>
              <p className="text-green-400">{latestSession.totalBuyRated}</p>
            </div>
            <div>
              <span className="text-gray-400">Avg Score:</span>
              <p className="text-blue-400">{latestSession.averageScore.toFixed(1)}</p>
            </div>
          </div>
          
          {latestResults.length > 0 && (
            <div className="mt-3">
              <span className="text-gray-400 text-xs">Latest Results:</span>
              <p className="text-white font-semibold">{latestResults.length} stocks available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-red-400 mb-2">⚠️ Database Access Issue</h4>
          <p className="text-xs text-red-300">
            Unable to access screening sessions. This may be due to missing database permissions.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Check the console for detailed error information.
          </p>
        </div>
      )}
    </div>
  );

  // Loading/Polling State
  if (isLoading || isPolling) {
    return (
      <div>
        {debugSection}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <h2 className="text-xl font-bold text-white mt-4 mb-2">
              {session?.status === 'completed' ? 'Loading Results...' : 'Screening in Progress'}
            </h2>
            <p className="text-gray-400 mb-4">
              {session ? getProgressMessage(session.status) : 'Initializing...'}
            </p>
            
            {session && (
              <div className="space-y-2 text-sm text-gray-300">
                <p>Session ID: {session.id}</p>
                <p>Started: {new Date(session.createdAt).toLocaleString()}</p>
                {session.processingTimeSeconds > 0 && (
                  <p>Processing time: {formatTime(session.processingTimeSeconds)}</p>
                )}
              </div>
            )}

            {/* Progress indicator for processing */}
            {(session?.status === 'processing' || session?.status === 'running') && (
              <div className="mt-6">
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-400">
                  This may take 5-10 minutes for large batches...
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Show latest results while polling if available */}
        {latestResults.length > 0 && (
          <div className="mt-6">
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-4">
              <h3 className="text-blue-400 font-semibold mb-2">📈 Previous Results Available</h3>
              <p className="text-blue-300 text-sm">
                Showing {latestResults.length} results from your most recent completed screening 
                ({new Date(latestSession?.completedAt || latestSession?.createdAt || '').toLocaleString()})
              </p>
            </div>
            {renderResults(latestResults, latestSession)}
          </div>
        )}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div>
        {debugSection}
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-red-400 text-lg mr-3 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-2">Screening Error</h3>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={retry}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        
        {/* Show latest results even on error */}
        {latestResults.length > 0 && (
          <div className="mt-6">
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-4">
              <h3 className="text-blue-400 font-semibold mb-2">📈 Previous Results Available</h3>
              <p className="text-blue-300 text-sm">
                Showing {latestResults.length} results from your most recent completed screening 
                ({new Date(latestSession?.completedAt || latestSession?.createdAt || '').toLocaleString()})
              </p>
            </div>
            {renderResults(latestResults, latestSession)}
          </div>
        )}
      </div>
    );
  }

  // Results State
  if ((session?.status === 'completed' || session?.status === 'replaced') && results.length > 0) {
    return (
      <div>
        {debugSection}
        {renderResults(results, session)}
        
        {/* Session Info */}
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Session Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
            <div>
              <span className="font-medium">Session ID:</span> {session.id}
            </div>
            <div>
              <span className="font-medium">Started:</span> {new Date(session.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Completed:</span> {session.completedAt ? new Date(session.completedAt).toLocaleString() : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Processing Time:</span> {formatTime(session.processingTimeSeconds)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No results state but maybe show latest results
  return (
    <div>
      {debugSection}
      {latestResults.length > 0 ? (
        <div>
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-4">
            <h3 className="text-blue-400 font-semibold mb-2">📈 Latest Results Available</h3>
            <p className="text-blue-300 text-sm">
              Showing {latestResults.length} results from your most recent completed screening 
              ({new Date(latestSession?.completedAt || latestSession?.createdAt || '').toLocaleString()})
            </p>
          </div>
          {renderResults(latestResults, latestSession)}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <p className="text-gray-400">No screening results available yet.</p>
        </div>
      )}
    </div>
  );
}
