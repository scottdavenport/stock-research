import { StockData } from '../types/stock';

interface FinancialMetricsProps {
  data: StockData;
}

export default function FinancialMetrics({ data }: FinancialMetricsProps) {
  const hasData = (value: any) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getBetaColor = (beta: number) => {
    if (beta < 0.8) return 'text-blue-400'; // Low volatility
    if (beta > 1.2) return 'text-red-400';  // High volatility
    return 'text-yellow-400';               // Medium volatility
  };

  const getBetaDescription = (beta: number) => {
    if (beta < 0.8) return 'Low volatility';
    if (beta > 1.2) return 'High volatility';
    return 'Medium volatility';
  };

  const getPERatioColor = (pe: number) => {
    if (pe < 15) return 'text-green-400';   // Potentially undervalued
    if (pe > 25) return 'text-red-400';     // Potentially overvalued
    return 'text-yellow-400';               // Fair value
  };

  const getPERatioDescription = (pe: number) => {
    if (pe < 15) return 'Potentially undervalued';
    if (pe > 25) return 'Potentially overvalued';
    return 'Fair value range';
  };

  const calculate52WeekPosition = () => {
    if (!hasData(data.technicals.week52High) || !hasData(data.technicals.week52Low)) {
      return null;
    }
    
    const high = Number(data.technicals.week52High);
    const low = Number(data.technicals.week52Low);
    const current = data.price;
    
    if (high === low) return 50; // Avoid division by zero
    
    return ((current - low) / (high - low)) * 100;
  };

  const week52Position = calculate52WeekPosition();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Financial Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P/E Ratio */}
        <div className="bg-gray-700 rounded-lg p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">P/E Ratio</div>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="font-semibold mb-1">Price-to-Earnings Ratio</div>
                <div className="text-gray-300">
                  Shows how much you pay for each dollar of company earnings. 
                  <br /><br />
                  <strong>Low (under 15):</strong> Potentially undervalued - good deal
                  <br />
                  <strong>Medium (15-25):</strong> Fair price
                  <br />
                  <strong>High (over 25):</strong> Potentially overvalued - expensive
                </div>
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${hasData(data.peRatio) ? getPERatioColor(Number(data.peRatio)) : 'text-gray-400'}`}>
            {hasData(data.peRatio) ? Number(data.peRatio).toFixed(2) : 'N/A'}
          </div>
          {hasData(data.peRatio) && (
            <div className="text-xs text-gray-400 mt-1">
              {getPERatioDescription(Number(data.peRatio))}
            </div>
          )}
        </div>

        {/* Beta */}
        <div className="bg-gray-700 rounded-lg p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Beta</div>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="font-semibold mb-1">Stock Volatility</div>
                <div className="text-gray-300">
                  Measures how much this stock's price moves compared to the overall market.
                  <br /><br />
                  <strong>Low (under 0.8):</strong> Less risky, moves slower than market
                  <br />
                  <strong>Medium (0.8-1.2):</strong> Moves with the market
                  <br />
                  <strong>High (over 1.2):</strong> More risky, moves faster than market
                </div>
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${hasData(data.beta) ? getBetaColor(Number(data.beta)) : 'text-gray-400'}`}>
            {hasData(data.beta) ? Number(data.beta).toFixed(2) : 'N/A'}
          </div>
          {hasData(data.beta) && (
            <div className="text-xs text-gray-400 mt-1">
              {getBetaDescription(Number(data.beta))}
            </div>
          )}
        </div>

        {/* 52-Week Range */}
        <div className="bg-gray-700 rounded-lg p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">52-Week Range</div>
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="font-semibold mb-1">52-Week Price Range</div>
                <div className="text-gray-300">
                  Shows the highest and lowest prices this stock has traded at over the past year.
                  <br /><br />
                  <strong>Current position:</strong> Where today's price falls within that range
                  <br />
                  <strong>Near high:</strong> Stock might be expensive
                  <br />
                  <strong>Near low:</strong> Stock might be a bargain
                </div>
              </div>
            </div>
          </div>
          {hasData(data.technicals.week52High) && hasData(data.technicals.week52Low) ? (
            <>
              <div className="text-lg font-semibold text-white mb-2">
                {formatPrice(Number(data.technicals.week52Low))} - {formatPrice(Number(data.technicals.week52High))}
              </div>
              {week52Position !== null && (
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(week52Position, 0), 100)}%` }}
                  ></div>
                </div>
              )}
              <div className="text-xs text-gray-400">
                Current: {formatPrice(data.price)}
              </div>
            </>
          ) : (
            <div className="text-lg font-semibold text-gray-400">N/A</div>
          )}
        </div>
      </div>

      {/* Educational Resources for Young Investors */}
      <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
          </svg>
          <h3 className="text-lg font-semibold text-purple-400">Learning Resources for Young Investors</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Understanding these metrics is key to making informed investment decisions. Here are some helpful resources:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a 
            href="https://www.investopedia.com/terms/p/price-earningsratio.asp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-blue-300 transition-colors">
                P/E Ratio Explained
              </div>
              <div className="text-xs text-gray-400">
                Investopedia - Understanding Price-to-Earnings
              </div>
            </div>
          </a>

          <a 
            href="https://www.investopedia.com/terms/b/beta.asp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-green-300 transition-colors">
                Beta & Volatility
              </div>
              <div className="text-xs text-gray-400">
                Investopedia - Understanding Stock Risk
              </div>
            </div>
          </a>

          <a 
            href="https://www.nerdwallet.com/article/investing/how-to-start-investing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-purple-300 transition-colors">
                How to Start Investing
              </div>
              <div className="text-xs text-gray-400">
                NerdWallet - Beginner's Guide
              </div>
            </div>
          </a>

          <a 
            href="https://www.reddit.com/r/investing/wiki/faq/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-medium group-hover:text-orange-300 transition-colors">
                r/investing FAQ
              </div>
              <div className="text-xs text-gray-400">
                Reddit - Community Resources
              </div>
            </div>
          </a>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <div className="text-sm">
              <div className="text-yellow-400 font-medium mb-1">Important Disclaimer</div>
              <div className="text-yellow-300">
                This information is for educational purposes only. Always do your own research and consider consulting with a financial advisor before making investment decisions. Past performance doesn't guarantee future results.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
