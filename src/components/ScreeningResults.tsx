'use client';

import { ScreeningResponseWithSession } from '../types/stock';
import { useRouter } from 'next/navigation';
import WatchListButton from './WatchListButton';

interface ScreeningResultsProps {
  data: ScreeningResponseWithSession;
}

export default function ScreeningResults({ data }: ScreeningResultsProps) {
  const router = useRouter();

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}K`;
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

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-orange-900';
    return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
  };

  const handleResearchStock = (symbol: string) => {
    // Navigate to research page with symbol as URL parameter
    router.push(`/?symbol=${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="space-y-6">
      {/* Session Information */}
      {data.sessionId && (
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-blue-400 font-semibold mb-1">Screening Session</h3>
              <p className="text-blue-300 text-sm">
                Session ID: {data.sessionId.slice(0, 8)}... • User: {data.userEmail}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-300">
                {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Screening Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.summary.totalScreened}</div>
            <div className="text-sm text-gray-400">Stocks Screened</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.summary.averageScore.toFixed(1)}</div>
            <div className="text-sm text-gray-400">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{data.summary.strongBuys}</div>
            <div className="text-sm text-gray-400">Strong Buys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{data.summary.buys}</div>
            <div className="text-sm text-gray-400">Buys</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Top Sector: <span className="text-purple-400 font-semibold">{data.summary.topSector}</span>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Top Opportunities</h3>
          <p className="text-gray-400 text-sm mt-1">
            Ranked by momentum + quality score (0-100)
          </p>
        </div>

        <div className="divide-y divide-gray-700">
          {data.results.map((stock, index) => (
            <div key={stock.symbol} className="p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between mb-4">
                {/* Stock Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Rank Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadgeColor(stock.rank || index + 1)}`}>
                      #{stock.rank || index + 1}
                    </div>
                    
                    <div className="text-2xl font-bold text-white">{stock.symbol}</div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold border ${getRatingColor(stock.rating)}`}>
                      {stock.rating}
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(stock.score)}`}>
                      {stock.score}/100
                    </div>
                  </div>
                  
                  <div className="text-gray-300 mb-2">{stock.name}</div>
                  <div className="text-sm text-gray-400">{stock.sector}</div>
                </div>

                {/* Price Info */}
                <div className="text-right">
                  <div className="text-xl font-bold text-white">${stock.price.toFixed(2)}</div>
                  <div className={`text-sm font-semibold ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatMarketCap(stock.marketCap)}
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Momentum</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" 
                        style={{ width: `${(stock.scoreBreakdown.momentum / 40) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-white font-semibold">{stock.scoreBreakdown.momentum}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Quality</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                        style={{ width: `${(stock.scoreBreakdown.quality / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-white font-semibold">{stock.scoreBreakdown.quality}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Technical</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" 
                        style={{ width: `${(stock.scoreBreakdown.technical / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-white font-semibold">{stock.scoreBreakdown.technical}</span>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-400">P/E Ratio:</span>
                  <span className="text-white ml-1">
                    {stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">52W High:</span>
                  <span className="text-white ml-1">
                    {stock.week52High ? `$${stock.week52High.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">From High:</span>
                  <span className="text-white ml-1">
                    {stock.distanceFrom52High ? `${stock.distanceFrom52High}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-white ml-1">
                    {formatMarketCap(stock.marketCap)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <WatchListButton
                  symbol={stock.symbol}
                  size="md"
                  showText={false}
                />
                <button
                  onClick={() => handleResearchStock(stock.symbol)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <span>🔍</span>
                  Research {stock.symbol}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
