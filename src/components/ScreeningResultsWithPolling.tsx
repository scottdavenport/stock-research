'use client';

import { useState, useEffect } from 'react';
import { useScreeningResults } from '../hooks/useScreeningResults';
import { ScreeningSession, ScreeningResultWithSession } from '../types/stock';
import LoadingSpinner from './LoadingSpinner';
import WatchListButton from './WatchListButton';
import AutoSuggestionModal from './AutoSuggestionModal';
import ProcessingBanner from './ProcessingBanner';
import EducationalContent from './EducationalContent';
import { useWatchlist } from '../hooks/useWatchlist';

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
  const { isWatched } = useWatchlist();
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'changePercent' | 'symbol'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [showAutoSuggestion, setShowAutoSuggestion] = useState(false);
  const [hasShownAutoSuggestion, setHasShownAutoSuggestion] = useState(false);

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

  // Show auto-suggestion modal when screening completes with high-scoring stocks
  useEffect(() => {
    if (session?.status === 'completed' && results.length > 0 && !hasShownAutoSuggestion) {
      const highScoringStocks = results.filter(stock => stock.score >= 85);
      if (highScoringStocks.length > 0) {
        setShowAutoSuggestion(true);
        setHasShownAutoSuggestion(true);
      }
    }
  }, [session?.status, results, hasShownAutoSuggestion]);

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

    // Calculate summary statistics from actual results
    const totalStocks = resultsToShow.length;
    const buyRatedStocks = resultsToShow.filter(result => 
      ['STRONG BUY', 'BUY', 'WEAK BUY'].includes(result.rating)
    ).length;
    const buyPercentage = totalStocks > 0 ? (buyRatedStocks / totalStocks) * 100 : 0;
    const averageScore = totalStocks > 0 
      ? resultsToShow.reduce((sum, result) => sum + result.score, 0) / totalStocks 
      : 0;

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalStocks}</div>
            <div className="text-sm text-gray-400">Total Screened</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{buyRatedStocks}</div>
            <div className="text-sm text-gray-400">Buy Rated</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{buyPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Buy Percentage</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{averageScore.toFixed(1)}</div>
            <div className="text-sm text-gray-400">Avg Score</div>
          </div>
        </div>

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white rounded text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
                <th className="text-left py-2 px-2 text-gray-400">Actions</th>
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
                  <td className="py-2 px-2">
                    <div className="flex justify-center">
                      <WatchListButton
                        symbol={result.symbol}
                        isWatched={isWatched(result.symbol)}
                        size="sm"
                        showText={false}
                      />
                    </div>
                  </td>
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

  // Consolidated debug info - one compact component
  const debugSection = (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-purple-400 mb-3">🔍 Debug Info</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400">Session ID:</span>
          <p className="text-white font-mono text-xs break-all">{sessionId || 'None'}</p>
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
        <div>
          <span className="text-gray-400">Workflow Status:</span>
          <p className={`font-semibold ${
            session?.status === 'completed' ? 'text-green-400' : 
            session?.status === 'processing' || session?.status === 'running' || session?.status === 'pending' ? 'text-yellow-400' : 
            session?.status === 'failed' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {session?.status?.toUpperCase() || 'UNKNOWN'}
          </p>
        </div>
        <div>
          <span className="text-gray-400">Created:</span>
          <p className="text-white">{session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}</p>
        </div>
        <div>
          <span className="text-gray-400">Processing Time:</span>
          <p className="text-white">{session?.processingTimeSeconds ? formatTime(session.processingTimeSeconds) : 'N/A'}</p>
        </div>
        <div>
          <span className="text-gray-400">Results:</span>
          <p className="text-white">{results.length > 0 ? `${results.length} stocks` : 'None'}</p>
        </div>
      </div>
    </div>
  );

  // Error State - Check for errors first
  if (error) {
    return (
      <div>
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
        
        {/* Debug info moved below error state */}
        <div className="mt-8">
          {debugSection}
        </div>
      </div>
    );
  }

  // Results State - Show results when available, regardless of polling status
  if (results.length > 0 || latestResults.length > 0) {
    const resultsToShow = results.length > 0 ? results : latestResults;
    const sessionToShow = results.length > 0 ? session : latestSession;
    
    return (
      <div>
        {renderResults(resultsToShow, sessionToShow)}
        
        {/* Auto-suggestion Modal */}
        <AutoSuggestionModal
          isOpen={showAutoSuggestion}
          onClose={() => setShowAutoSuggestion(false)}
          stocks={resultsToShow}
          onStocksAdded={(count) => {
            console.log(`Added ${count} stocks to watchlist`);
          }}
        />
        
        {/* Debug and Session Info - Moved below results */}
        <div className="mt-8 space-y-4">
          {debugSection}
          
          {/* Session Info */}
          {sessionToShow && (
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Session Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                <div>
                  <span className="font-medium">Session ID:</span> {sessionToShow.id}
                </div>
                <div>
                  <span className="font-medium">Started:</span> {sessionToShow.createdAt ? new Date(sessionToShow.createdAt).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Completed:</span> {sessionToShow.completedAt ? new Date(sessionToShow.completedAt).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Processing Time:</span> {formatTime(sessionToShow.processingTimeSeconds)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // New UX Flow: Show existing results with processing banner OR educational content
  if (isLoading || isPolling) {
    // If user has existing results, show them with processing banner
    if (latestResults.length > 0) {
      return (
        <div>
          {/* Processing Banner */}
          <ProcessingBanner 
            batchSize={session?.totalStocksScreened || 500}
            estimatedTime=""
            startedAt={session?.createdAt || new Date().toISOString()}
          />
          
          {/* Show existing results */}
          {renderResults(latestResults, latestSession)}
          
          {/* Debug info */}
          <div className="mt-8">
            {debugSection}
          </div>
        </div>
      );
    }
    
    // If no existing results, show educational content
    return (
      <div>
        <EducationalContent 
          batchSize={session?.totalStocksScreened || 500}
          estimatedTime=""
          startedAt={session?.createdAt || new Date().toISOString()}
        />
        
        {/* Debug info */}
        <div className="mt-8">
          {debugSection}
        </div>
      </div>
    );
  }

  // No results state
  return (
    <div>
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <p className="text-gray-400">No screening results available yet.</p>
      </div>
      
      {/* Debug info moved below no results state */}
      <div className="mt-8">
        {debugSection}
      </div>
    </div>
  );
}
