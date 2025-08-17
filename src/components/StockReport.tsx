import { StockData } from '../types/stock';
import CompanyHeader from './CompanyHeader';
import PriceDisplay from './PriceDisplay';
import FinancialMetrics from './FinancialMetrics';
import CompanyProfile from './CompanyProfile';
import NewsCarousel from './NewsCarousel';

interface StockReportProps {
  data: StockData;
}

export default function StockReport({ data }: StockReportProps) {
  const hasData = (value: unknown) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Company Header with Logo and Basic Info */}
      <CompanyHeader data={data} />
      
      {/* Price Display with Enhanced Styling */}
      <PriceDisplay data={data} />
      
      {/* Financial Metrics Dashboard */}
      <FinancialMetrics data={data} />
      
      {/* Company Profile and Description */}
      <CompanyProfile data={data} />
      
      {/* News Carousel */}
      <NewsCarousel data={data} />
      
      {/* Data Availability Alert */}
      {(!hasData(data.name) || !hasData(data.sector) || !hasData(data.exchange)) && (
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-yellow-400 text-lg mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-400 font-semibold">Some Data Unavailable</h3>
              <p className="text-yellow-300 text-sm mb-2">
                Some company information is not currently available. This may be due to:
              </p>
              <ul className="text-yellow-300 text-sm list-disc list-inside space-y-1">
                {!hasData(data.name) && <li>Company profile API call not working</li>}
                {!hasData(data.sector) && <li>Sector information not retrieved</li>}
                {!hasData(data.exchange) && <li>Exchange information missing</li>}
                {!hasData(data.logo) && <li>Company logo not available</li>}
                {!hasData(data.peRatio) && <li>Financial metrics not available</li>}
                {(!data.news || data.news.length === 0) && <li>News data not available</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Data Status */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">API Data Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Quote Data:</span>
                  <span className={data.debug?.hasAllData?.quote ? 'text-green-400' : 'text-red-400'}>
                    {data.debug?.hasAllData?.quote ? '✅ Available' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Profile Data:</span>
                  <span className={data.debug?.hasAllData?.profile ? 'text-green-400' : 'text-red-400'}>
                    {data.debug?.hasAllData?.profile ? '✅ Available' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Metrics Data:</span>
                  <span className={data.debug?.hasAllData?.metrics ? 'text-green-400' : 'text-red-400'}>
                    {data.debug?.hasAllData?.metrics ? '✅ Available' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">News Data:</span>
                  <span className={data.debug?.hasAllData?.news ? 'text-green-400' : 'text-red-400'}>
                    {data.debug?.hasAllData?.news ? '✅ Available' : '❌ Missing'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Available Fields */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Available Fields</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Quote fields:</span>
                  <div className="text-gray-300 mt-1">
                    {data.debug?.quoteFields?.join(', ') || 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Profile fields:</span>
                  <div className="text-gray-300 mt-1">
                    {data.debug?.profileFields?.join(', ') || 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Metrics fields:</span>
                  <div className="text-gray-300 mt-1">
                    {data.debug?.metricsFields?.join(', ') || 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">News count:</span>
                  <span className="text-gray-300 ml-2">{data.debug?.newsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
