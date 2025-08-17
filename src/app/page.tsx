'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StockForm from '../components/StockForm';
import StockReport from '../components/StockReport';
import LoadingSpinner from '../components/LoadingSpinner';
import { StockFormData, StockData } from '../types/stock';
import { researchStock } from '../utils/api';
import { useAuth } from '../components/AuthProvider';
import AuthGuard from '../components/AuthGuard';

function HomeContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const { user } = useAuth();
  
  const searchParams = useSearchParams();

  const handleSubmit = async (formData: StockFormData) => {
    setIsLoading(true);
    setError(null);
    setStockData(null);

    try {
      const response = await researchStock(formData);

      if (response.success && response.data) {
        setStockData(response.data);
      } else {
        setError(response.error || 'Failed to fetch stock data');
      }
    } catch (err) {
      setError('An error occurred while researching the stock. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL parameter for auto-submission
  useEffect(() => {
    const symbolParam = searchParams.get('symbol');
    if (symbolParam && !autoSubmitted) {
      const trimmedSymbol = symbolParam.trim().toUpperCase();
      if (trimmedSymbol && trimmedSymbol.length <= 5) {
        setAutoSubmitted(true);
        // Scroll to top when auto-researching
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleSubmit({ symbol: trimmedSymbol });
      }
    }
  }, [searchParams, autoSubmitted]);

  // Scroll to top when component mounts (for auto-research)
  useEffect(() => {
    if (searchParams.get('symbol')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Stock Research
            </h1>
            {user && (
              <div className="mb-4">
                <p className="text-green-400 text-lg">
                  Welcome back, {user.email}!
                </p>
              </div>
            )}
            <p className="text-gray-400 text-lg max-w-4xl mx-auto">
              Enter any stock symbol to get comprehensive research data including real-time quotes, 
              company profiles with logos, financial metrics (P/E ratio, beta), 52-week ranges, 
              and recent news with summaries from Finnhub API.
            </p>
            <div className="mt-4">
              <a 
                href="/screening" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                🚀 Try our Stock Screener
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            {/* Form Section */}
            <div className="mb-8">
              <StockForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                initialSymbol={searchParams.get('symbol') || undefined}
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="mt-8">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="mt-8 bg-red-900/20 border border-red-500 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="text-red-400 text-lg mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-400 font-semibold">Error</h3>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {stockData && !isLoading && (
              <div className="mt-8">
                {/* Auto-research notification */}
                {autoSubmitted && (
                  <div className="mb-4 bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="text-blue-400 text-lg mr-3">🔍</div>
                      <div>
                        <h3 className="text-blue-400 font-semibold">Auto-Research</h3>
                        <p className="text-blue-300">
                          Automatically researched {stockData.symbol} from the stock screener
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <StockReport data={stockData} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>Powered by Finnhub API • Enhanced with comprehensive financial data and analysis</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
