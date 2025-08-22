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

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'STRONG BUY': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'BUY': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'WEAK BUY': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'HOLD': return 'text-gray-400 bg-gray-900/20 border-gray-500';
      case 'WEAK SELL': return 'text-orange-400 bg-orange-900/20 border-orange-500';
      case 'SELL': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'STRONG SELL': return 'text-red-500 bg-red-900/30 border-red-600';
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

  const getMetricColor = (value: number, positiveIsGood: boolean = true) => {
    if (positiveIsGood) {
      return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
    } else {
      return value < 0 ? 'text-green-400' : value > 0 ? 'text-red-400' : 'text-gray-400';
    }
  };

  const handleResearchStock = (symbol: string) => {
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
            Ranked by momentum + quality score (0-100) with comprehensive financial analysis
          </p>
        </div>

        <div className="divide-y divide-gray-700">
          {data.results.map((stock, index) => (
            <div key={stock.symbol} className="p-6 hover:bg-gray-750 transition-colors">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                {/* Stock Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Rank Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadgeColor(stock.rankPosition || stock.rank || index + 1)}`}>
                      #{stock.rankPosition || stock.rank || index + 1}
                    </div>
                    
                    <div className="text-2xl font-bold text-white">{stock.symbol}</div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold border ${getRatingColor(stock.rating)}`}>
                      {stock.rating}
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(stock.score)}`}>
                      {stock.score}/100
                    </div>
                    {stock.signalStrength && (
                      <div className="text-sm text-purple-400 font-semibold">
                        Signal: {stock.signalStrength}/100
                      </div>
                    )}
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

              {/* Enhanced Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Price Performance */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-purple-400">Price Performance</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Day Range:</span>
                      <span className="text-white">
                        ${stock.dayLow?.toFixed(2) || 'N/A'} - ${stock.dayHigh?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">52W Range:</span>
                      <span className="text-white">
                        ${stock.week52Low?.toFixed(2) || 'N/A'} - ${stock.week52High?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">From High:</span>
                      <span className={`${stock.distanceFrom52High ? (parseFloat(stock.distanceFrom52High) > -10 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                        {stock.distanceFrom52High ? `${stock.distanceFrom52High}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volume Analysis */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-blue-400">Volume Analysis</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volume:</span>
                      <span className="text-white">{stock.volume ? formatVolume(stock.volume) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Volume:</span>
                      <span className="text-white">{stock.avgVolume ? formatVolume(stock.avgVolume) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rel Volume:</span>
                      <span className={`${stock.relativeVolume ? (stock.relativeVolume > 1.5 ? 'text-green-400' : stock.relativeVolume < 0.5 ? 'text-red-400' : 'text-gray-400') : 'text-gray-400'}`}>
                        {stock.relativeVolume ? stock.relativeVolume.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valuation Metrics */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-400">Valuation</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">P/E Ratio:</span>
                      <span className="text-white">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Forward P/E:</span>
                      <span className="text-white">{stock.forwardPe ? stock.forwardPe.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beta:</span>
                      <span className={`${stock.beta ? (Math.abs(stock.beta - 1) < 0.2 ? 'text-green-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                        {stock.beta ? stock.beta.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growth & Quality */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-400">Growth & Quality</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">EPS Growth:</span>
                      <span className={`${stock.epsGrowth ? getMetricColor(stock.epsGrowth) : 'text-gray-400'}`}>
                        {stock.epsGrowth ? `${stock.epsGrowth > 0 ? '+' : ''}${stock.epsGrowth.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue Growth:</span>
                      <span className={`${stock.revenueGrowth ? getMetricColor(stock.revenueGrowth) : 'text-gray-400'}`}>
                        {stock.revenueGrowth ? `${stock.revenueGrowth > 0 ? '+' : ''}${stock.revenueGrowth.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROE:</span>
                      <span className={`${stock.roe ? getMetricColor(stock.roe) : 'text-gray-400'}`}>
                        {stock.roe ? `${stock.roe.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-indigo-400">Performance</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">YTD Return:</span>
                      <span className={`${stock.ytdReturn ? getMetricColor(stock.ytdReturn) : 'text-gray-400'}`}>
                        {stock.ytdReturn ? `${stock.ytdReturn > 0 ? '+' : ''}${stock.ytdReturn.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MTD Return:</span>
                      <span className={`${stock.mtdReturn ? getMetricColor(stock.mtdReturn) : 'text-gray-400'}`}>
                        {stock.mtdReturn ? `${stock.mtdReturn > 0 ? '+' : ''}${stock.mtdReturn.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">4W Relative:</span>
                      <span className={`${stock.priceRelative4w ? getMetricColor(stock.priceRelative4w) : 'text-gray-400'}`}>
                        {stock.priceRelative4w ? `${stock.priceRelative4w > 0 ? '+' : ''}${stock.priceRelative4w.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-orange-400">Financial Health</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Op Margin:</span>
                      <span className={`${stock.operatingMargin ? getMetricColor(stock.operatingMargin) : 'text-gray-400'}`}>
                        {stock.operatingMargin ? `${stock.operatingMargin.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Debt/Equity:</span>
                      <span className={`${stock.debtToEquity ? (stock.debtToEquity < 0.5 ? 'text-green-400' : stock.debtToEquity > 1 ? 'text-red-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                        {stock.debtToEquity ? stock.debtToEquity.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Cap:</span>
                      <span className="text-white">{formatMarketCap(stock.marketCap)}</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-purple-400">Score Breakdown</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Momentum:</span>
                      <span className="text-green-400">{stock.scoreBreakdown?.momentum || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quality:</span>
                      <span className="text-blue-400">{stock.scoreBreakdown?.quality || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Technical:</span>
                      <span className="text-purple-400">{stock.scoreBreakdown?.technical || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-400">Risk Assessment</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volatility:</span>
                      <span className={`${stock.beta ? (Math.abs(stock.beta - 1) < 0.2 ? 'text-green-400' : Math.abs(stock.beta - 1) < 0.5 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-400'}`}>
                        {stock.beta ? (Math.abs(stock.beta - 1) < 0.2 ? 'Low' : Math.abs(stock.beta - 1) < 0.5 ? 'Med' : 'High') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Leverage:</span>
                      <span className={`${stock.debtToEquity ? (stock.debtToEquity < 0.5 ? 'text-green-400' : stock.debtToEquity > 1 ? 'text-red-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                        {stock.debtToEquity ? (stock.debtToEquity < 0.5 ? 'Low' : stock.debtToEquity > 1 ? 'High' : 'Med') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Downside:</span>
                      <span className={`${stock.distanceFrom52High ? (parseFloat(stock.distanceFrom52High) > -10 ? 'text-green-400' : parseFloat(stock.distanceFrom52High) > -25 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-400'}`}>
                        {stock.distanceFrom52High ? (parseFloat(stock.distanceFrom52High) > -10 ? 'Low' : parseFloat(stock.distanceFrom52High) > -25 ? 'Med' : 'High') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <WatchListButton
                  symbol={stock.symbol}
                  size="md"
                  showText={false}
                />
                <button
                  onClick={() => handleResearchStock(stock.symbol)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
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
