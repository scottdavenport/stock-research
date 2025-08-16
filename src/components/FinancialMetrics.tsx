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
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">P/E Ratio</div>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
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
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">Beta</div>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
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
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400 text-sm">52-Week Range</div>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
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
    </div>
  );
}
