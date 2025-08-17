'use client';

import { useState } from 'react';
import ScreeningForm from '../../components/ScreeningForm';
import ScreeningResults from '../../components/ScreeningResults';
import { ScreeningFormData, ScreeningResponse } from '../../types/stock';
import { screenStocks } from '../../utils/api';

export default function ScreeningPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<ScreeningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ScreeningFormData) => {
    setIsLoading(true);
    setError(null);
    setScreeningData(null);

    try {
      const response = await screenStocks(formData);

      if (response.success) {
        setScreeningData(response);
      } else {
        setError(response.error || 'Failed to screen stocks');
      }
    } catch (err) {
      setError('An error occurred while screening stocks. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // The form will still have the last submitted data, so user can just click submit again
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Stock Screener
          </h1>
          <p className="text-gray-400 text-lg max-w-4xl mx-auto">
            Automatically screen 500+ high-quality stocks to find the best momentum opportunities. 
            Our intelligent algorithm scores stocks based on technical momentum, fundamental quality, 
            and market catalysts to identify high-potential candidates.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Form Section */}
          <div className="mb-8">
            <ScreeningForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Error State */}
          {error && !isLoading && (
            <div className="mt-8 bg-red-900/20 border border-red-500 rounded-lg p-6">
              <div className="flex items-start">
                <div className="text-red-400 text-lg mr-3 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-red-400 font-semibold mb-2">Screening Error</h3>
                  <p className="text-red-300 mb-4">{error}</p>
                  
                  {/* Additional guidance for timeout errors */}
                  {error.includes('timeout') || error.includes('524') && (
                    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-1">Suggested Solutions:</h4>
                      <ul className="text-sm text-yellow-300 space-y-1">
                        <li>• Try a smaller batch size (10-20 stocks)</li>
                        <li>• Wait a few minutes and try again</li>
                        <li>• The workflow may still be processing in the background</li>
                      </ul>
                    </div>
                  )}
                  
                  <button
                    onClick={handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {screeningData && !isLoading && (
            <div className="mt-8">
              <ScreeningResults data={screeningData} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by Finnhub API • Intelligent screening algorithm for momentum opportunities</p>
        </div>
      </div>
    </div>
  );
}
