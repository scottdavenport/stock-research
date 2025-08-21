'use client';

import { useState } from 'react';
import ScreeningForm from '../../components/ScreeningForm';
import ScreeningResultsWithPolling from '../../components/ScreeningResultsWithPolling';
import { ScreeningFormData, ScreeningSessionResponse } from '../../types/stock';
import { screenStocks } from '../../utils/api';
import AuthGuard from '../../components/AuthGuard';
import { useAuth } from '../../components/AuthProvider';

export default function ScreeningPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (formData: ScreeningFormData) => {
    console.log('Starting screening submission:', formData);
    
    // Check if user is authenticated
    if (!user?.email) {
      setError('You must be logged in to run stock screening. Please log in and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSessionId(null);

    try {
      console.log('Calling screenStocks API with user email:', user.email);
      const response = await screenStocks(formData, user.email);
      console.log('Received screening session response:', response);

      if (response.success) {
        console.log('Screening session created successfully:', response.sessionId);
        console.log('🔧 Setting sessionId in page component:', response.sessionId);
        setSessionId(response.sessionId);
      } else {
        console.log('Screening session creation failed:', response.error);
        setError(response.error || 'Failed to create screening session');
      }
    } catch (err) {
      console.error('Screening error:', err);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'An error occurred while creating the screening session. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          errorMessage = 'The screening service returned invalid data. This may be due to a configuration issue. Please try again or contact support if the problem persists.';
        } else if (err.message.includes('timeout') || err.message.includes('524')) {
          errorMessage = 'The screening service is taking longer than expected to respond. Please try again in a few minutes.';
        } else if (err.message.includes('session')) {
          errorMessage = 'Failed to create screening session. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      console.log('Screening submission completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSessionId(null);
    // The form will still have the last submitted data, so user can just click submit again
  };

  return (
    <AuthGuard>
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
            {/* Form Section - More compact */}
            <div className="mb-6 max-w-2xl mx-auto">
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
                    
                    {/* Additional guidance for session creation errors */}
                    {error.includes('session') && (
                      <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-1">Suggested Solutions:</h4>
                        <ul className="text-sm text-yellow-300 space-y-1">
                          <li>• Check your internet connection</li>
                          <li>• Try again in a few minutes</li>
                          <li>• If the problem persists, contact support</li>
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

            {/* Results Section with Polling - Always show if user is logged in */}
            {user?.email && (
              <div className="mt-8">
                <div className="text-xs text-gray-500 mb-2">
                  Debug: sessionId = {sessionId || 'null'}, userEmail = {user.email}
                </div>
                <ScreeningResultsWithPolling sessionId={sessionId} userEmail={user.email} />
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
