import { StockData } from '../types/stock';
import Image from 'next/image';
import { useState } from 'react';

interface CompanyHeaderProps {
  data: StockData;
}

export default function CompanyHeader({ data }: CompanyHeaderProps) {
  const [imageError, setImageError] = useState(false);
  
  const hasData = (value: unknown) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  const formatMarketCap = (marketCap: string) => {
    if (!hasData(marketCap) || marketCap === 'N/A') return 'N/A';
    return marketCap; // Already formatted from API
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        {/* Company Info Section */}
        <div className="flex items-start space-x-4">
          {/* Company Logo */}
          {hasData(data.logo) && !imageError && (
            <div className="w-20 h-20 bg-white rounded-lg p-3 flex items-center justify-center shadow-lg">
              <Image
                src={data.logo}
                alt={`${data.name} logo`}
                width={56}
                height={56}
                className="object-contain"
                onError={handleImageError}
                unoptimized={false}
                priority={true}
              />
            </div>
          )}
          
          {/* Company Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {hasData(data.name) ? data.name : 'Company name not available'}
            </h1>
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl font-semibold text-purple-400">{data.symbol}</span>
              {hasData(data.sector) && (
                <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                  {data.sector}
                </span>
              )}
            </div>
            
            {/* Company Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {hasData(data.exchange) && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span>{data.exchange}</span>
                </div>
              )}
              
              {hasData(data.country) && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <span>{data.country}</span>
                </div>
              )}
              
              {hasData(data.website) && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/>
                  </svg>
                  <span>Website</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Market Cap */}
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-1">Market Cap</div>
          <div className="text-lg font-semibold text-white">
            {formatMarketCap(data.marketCap)}
          </div>
        </div>
      </div>
      
      {/* Data Source Info */}
      <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
        Last updated: {data.lastUpdate} • Data source: {data.dataSource}
      </div>
    </div>
  );
}
