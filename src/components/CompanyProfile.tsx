import { StockData } from '../types/stock';

interface CompanyProfileProps {
  data: StockData;
}

export default function CompanyProfile({ data }: CompanyProfileProps) {
  const hasData = (value: unknown) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Company Overview</h2>
      
      {hasData(data.description) ? (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-base">
            {data.description}
          </p>
          
          {/* Company Quick Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-sm text-gray-400">Sector</div>
                <div className="text-white font-medium">
                  {hasData(data.sector) ? data.sector : 'Not available'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-sm text-gray-400">Headquarters</div>
                <div className="text-white font-medium">
                  {hasData(data.country) ? data.country : 'Not available'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-sm text-gray-400">Exchange</div>
                <div className="text-white font-medium">
                  {hasData(data.exchange) ? data.exchange : 'Not available'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-sm text-gray-400">Market Cap</div>
                <div className="text-white font-medium">
                  {hasData(data.marketCap) ? data.marketCap : 'Not available'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Website Link */}
          {hasData(data.website) && (
            <div className="pt-4 border-t border-gray-700">
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/>
                </svg>
                <span>Visit Company Website</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                </svg>
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <p className="text-gray-400">Company description not available</p>
          <p className="text-gray-500 text-sm mt-2">
            This information may be available in the company profile data
          </p>
        </div>
      )}
    </div>
  );
}
