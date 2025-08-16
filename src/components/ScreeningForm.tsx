'use client';

import { useState } from 'react';
import { ScreeningFormData } from '../types/stock';

interface ScreeningFormProps {
  onSubmit: (formData: ScreeningFormData) => void;
  isLoading: boolean;
}

export default function ScreeningForm({ onSubmit, isLoading }: ScreeningFormProps) {
  const [formData, setFormData] = useState<ScreeningFormData>({
    batchSize: 20,
    startIndex: 0,
    type: 'momentum',
    sector: 'All',
    marketCap: 'All'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ScreeningFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
            <option value={10}>10 stocks</option>
            <option value={20}>20 stocks</option>
            <option value={50}>50 stocks</option>
            <option value={100}>100 stocks</option>
          </select>
          <p className="text-sm text-gray-400 mt-1">
            Number of stocks to screen in this batch
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
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Screening Stocks...
            </div>
          ) : (
            'Start Screening'
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <h3 className="text-sm font-semibold text-purple-400 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Screens 500+ high-quality stocks using momentum + fundamental criteria</li>
          <li>• Scores each stock (0-100) based on technical, quality, and catalyst factors</li>
          <li>• Returns top-ranked opportunities with actionable insights</li>
          <li>• Results typically available in 30 seconds or less</li>
        </ul>
      </div>
    </div>
  );
}
