'use client';

import { useState } from 'react';
import StockForm from '../components/StockForm';
import StockReport from '../components/StockReport';
import LoadingSpinner from '../components/LoadingSpinner';
import { StockFormData, StockData, StockResponse } from '../types/stock';
import { researchStock } from '../utils/api';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Stock Research App
          </h1>
          <p className="text-gray-400 text-lg max-w-4xl mx-auto">
            Enter any stock symbol to get comprehensive research data including real-time quotes, 
            company profiles with logos, financial metrics (P/E ratio, beta), 52-week ranges, 
            and recent news with summaries from Finnhub API.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Form Section */}
          <div className="mb-8">
            <StockForm onSubmit={handleSubmit} isLoading={isLoading} />
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
  );
}
