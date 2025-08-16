import { StockData } from '../types/stock';

interface PriceDisplayProps {
  data: StockData;
}

export default function PriceDisplay({ data }: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeBgColor = (change: number) => {
    return change >= 0 ? 'bg-green-900/20' : 'bg-red-900/20';
  };

  const getChangeBorderColor = (change: number) => {
    return change >= 0 ? 'border-green-500' : 'border-red-500';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        {/* Current Price */}
        <div className="flex-1">
          <div className="text-4xl font-bold text-white mb-2">
            {formatPrice(data.price)}
          </div>
          <div className={`text-xl font-medium ${getChangeColor(data.change)}`}>
            {formatPercent(data.changePercent)} ({formatPrice(data.change)})
          </div>
        </div>
        
        {/* Price Movement Indicator */}
        <div className={`px-4 py-2 rounded-lg border ${getChangeBgColor(data.change)} ${getChangeBorderColor(data.change)}`}>
          <div className="flex items-center space-x-2">
            {data.change >= 0 ? (
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
            <span className={`font-semibold ${getChangeColor(data.change)}`}>
              {data.change >= 0 ? 'Up' : 'Down'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Price Range Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Day High</div>
          <div className="text-lg font-semibold text-white">{formatPrice(data.dayHigh)}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Day Low</div>
          <div className="text-lg font-semibold text-white">{formatPrice(data.dayLow)}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Open</div>
          <div className="text-lg font-semibold text-white">{formatPrice(data.openPrice)}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Prev Close</div>
          <div className="text-lg font-semibold text-white">{formatPrice(data.previousClose)}</div>
        </div>
      </div>
    </div>
  );
}
