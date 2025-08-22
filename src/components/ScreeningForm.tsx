'use client';

import { useState, useEffect } from 'react';
import { ScreeningFormData } from '../types/stock';

interface ScreeningFormProps {
  onSubmit: (formData: ScreeningFormData) => void;
  isLoading: boolean;
}

export default function ScreeningForm({ onSubmit, isLoading }: ScreeningFormProps) {
  const [formData, setFormData] = useState<ScreeningFormData>({
    batchSize: 500,
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
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <form onSubmit={handleSubmit}>
        {/* Compact Filter Bar */}
        <div className="flex items-center gap-4 p-4">
          {/* Strategy */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-400 mb-1">Strategy</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="momentum">Momentum</option>
              <option value="conservative">Conservative</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          {/* Batch Size */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-400 mb-1">Size</label>
            <select
              value={formData.batchSize}
              onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value={500}>Full (500+)</option>
              <option value={100}>100</option>
              <option value={50}>50</option>
              <option value={20}>20</option>
              <option value={10}>10</option>
              <option value={5}>5</option>
            </select>
          </div>

          {/* Sector */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-400 mb-1">Sector</label>
            <select
              value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="All">All</option>
              <option value="Technology">Tech</option>
              <option value="Healthcare">Health</option>
              <option value="Financial Services">Finance</option>
              <option value="Consumer Discretionary">Consumer</option>
              <option value="Energy">Energy</option>
              <option value="Industrials">Industrial</option>
            </select>
          </div>

          {/* Market Cap */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-400 mb-1">Cap</label>
            <select
              value={formData.marketCap}
              onChange={(e) => handleInputChange('marketCap', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="All">All</option>
              <option value="Large">Large</option>
              <option value="Mid">Mid</option>
              <option value="Small">Small</option>
            </select>
          </div>

          {/* Est. Time */}
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-400">
              Est: {formatTime(calculateEstimatedTime(formData.batchSize || 500))}
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex-shrink-0 ml-auto">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 border border-purple-500 hover:border-purple-600 disabled:border-gray-600 text-white font-medium px-4 py-2 rounded transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-2"></div>
                  Running...
                </div>
              ) : (
                'Start Screening'
              )}
            </button>
          </div>
        </div>

        {/* Full Screen Warning */}
        {formData.batchSize === 500 && !isLoading && (
          <div className="px-4 pb-3">
            <div className="bg-blue-900/20 border border-blue-500 rounded px-3 py-2">
              <p className="text-blue-300 text-xs">
                ⚠️ Full Screen mode: 500+ stocks, 8-10 minutes. You can leave this page open.
              </p>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && (
          <div className="px-4 pb-3 space-y-2">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-gray-500 h-1 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min(100, (elapsedTime / calculateEstimatedTime(formData.batchSize || 5)) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              <span>Remaining: {formatTime(estimatedRemaining)}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
