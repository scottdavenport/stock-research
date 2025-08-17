'use client';

import { useState, useEffect } from 'react';
import { ScreeningFormData } from '../types/stock';

interface ScreeningFormProps {
  onSubmit: (formData: ScreeningFormData) => void;
  isLoading: boolean;
}

export default function ScreeningForm({ onSubmit, isLoading }: ScreeningFormProps) {
  const [formData, setFormData] = useState<ScreeningFormData>({
    batchSize: 5,
    startIndex: 0,
    type: 'momentum',
    sector: 'All',
    marketCap: 'All'
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState(0);

  // Calculate estimated time based on batch size (4.5 seconds per stock + 20 seconds buffer)
  const calculateEstimatedTime = (batchSize: number) => {
    if (batchSize === 500) {
      // Full screen: 500+ stocks, estimate 8-10 minutes
      return 540; // 9 minutes (540 seconds)
    }
    return Math.round(batchSize * 4.5) + 20;
  };

  // Timer effect for loading state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      setElapsedTime(0);
      setEstimatedRemaining(calculateEstimatedTime(formData.batchSize || 5));
      
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newElapsed = prev + 1;
          const totalEstimated = calculateEstimatedTime(formData.batchSize || 5);
          setEstimatedRemaining(Math.max(0, totalEstimated - newElapsed));
          return newElapsed;
        });
      }, 1000);
    } else {
      setElapsedTime(0);
      setEstimatedRemaining(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, formData.batchSize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ScreeningFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Stock Screener</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Screening Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Screening Strategy
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="momentum">Momentum (Balanced)</option>
            <option value="conservative">Conservative</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <p className="text-sm text-gray-400 mt-1">
            {formData.type === 'momentum' && 'Balanced approach focusing on momentum + quality'}
            {formData.type === 'conservative' && 'Lower risk, higher quality stocks'}
            {formData.type === 'aggressive' && 'Higher risk, maximum momentum potential'}
          </p>
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Batch Size
          </label>
          <select
            value={formData.batchSize}
            onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value={5}>5 stocks</option>
            <option value={10}>10 stocks</option>
            <option value={20}>20 stocks</option>
            <option value={50}>50 stocks</option>
            <option value={100}>100 stocks</option>
            <option value={500}>Full Screen (500+ stocks)</option>
          </select>
          <p className="text-sm text-gray-400 mt-1">
            Number of stocks to screen in this batch • Est. time: {formatTime(calculateEstimatedTime(formData.batchSize || 5))}
          </p>
        </div>

        {/* Sector Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sector Focus
          </label>
          <select
            value={formData.sector}
            onChange={(e) => handleInputChange('sector', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="All">All Sectors</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Consumer Discretionary">Consumer Discretionary</option>
            <option value="Consumer Staples">Consumer Staples</option>
            <option value="Energy">Energy</option>
            <option value="Industrials">Industrials</option>
            <option value="Communication Services">Communication Services</option>
          </select>
        </div>

        {/* Market Cap Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Market Cap
          </label>
          <select
            value={formData.marketCap}
            onChange={(e) => handleInputChange('marketCap', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="All">All Caps</option>
            <option value="Large">Large Cap ($10B+)</option>
            <option value="Mid">Mid Cap ($2B-$10B)</option>
            <option value="Small">Small Cap (&lt;$2B)</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Screening in Progress...
            </div>
          ) : (
            'Start Screening'
          )}
        </button>

        {/* Full Screen Warning */}
        {formData.batchSize === 500 && !isLoading && (
          <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500 rounded-lg">
            <div className="flex items-start">
              <div className="text-orange-400 text-lg mr-3 mt-0.5">⚠️</div>
              <div>
                <h4 className="text-orange-400 font-semibold mb-1">Full Screen Mode</h4>
                <p className="text-orange-300 text-sm">
                  This will screen 500+ stocks and may take 8-10 minutes to complete. 
                  Please ensure you have time to wait for results. You can leave this page 
                  open and return later to check progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && (
          <div className="mt-4 space-y-3">
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min(100, (elapsedTime / calculateEstimatedTime(formData.batchSize || 5)) * 100)}%` 
                }}
              ></div>
            </div>
            
            {/* Time Indicators */}
            <div className="flex justify-between text-sm text-gray-400">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              <span>Est. remaining: {formatTime(estimatedRemaining)}</span>
            </div>
            
            {/* Progress Text */}
            <div className="text-center text-sm text-gray-300">
              {formData.batchSize === 500 ? (
                <>
                  Screening 500+ stocks in Full Screen mode... This may take 8-10 minutes.
                  <br />
                  <span className="text-orange-400">Please be patient - this is a comprehensive analysis!</span>
                  <br />
                  <span className="text-blue-400 text-xs mt-1">Using polling to handle long-running process...</span>
                </>
              ) : (formData.batchSize || 0) >= 100 ? (
                <>
                  Screening {formData.batchSize || 0} stocks... This may take 3-5 minutes.
                  <br />
                  <span className="text-blue-400 text-xs mt-1">Using polling to handle long-running process...</span>
                </>
              ) : (
                `Screening ${formData.batchSize || 0} stocks... This may take up to ${formatTime(calculateEstimatedTime(formData.batchSize || 5))}`
              )}
            </div>
          </div>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <h3 className="text-sm font-semibold text-purple-400 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Screens 500+ high-quality stocks using momentum + fundamental criteria</li>
          <li>• Scores each stock (0-100) based on technical, quality, and catalyst factors</li>
          <li>• Returns top-ranked opportunities with actionable insights</li>
          <li>• Results typically available in 30-90 seconds depending on batch size</li>
        </ul>
        
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-1">Performance Tips:</h4>
          <ul className="text-xs text-yellow-300 space-y-1">
            <li>• Start with 5-10 stocks for faster results</li>
            <li>• Larger batches (50-100) may take 2-3 minutes</li>
            <li>• Full Screen (500+) may take 8-10 minutes - plan accordingly</li>
            <li>• If you get a timeout, try a smaller batch size</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
