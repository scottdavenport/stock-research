'use client';

import { useState, useEffect } from 'react';
import { StockFormData } from '../types/stock';

interface StockFormProps {
  onSubmit: (data: StockFormData) => void;
  isLoading: boolean;
  initialSymbol?: string;
}

export default function StockForm({ onSubmit, isLoading, initialSymbol }: StockFormProps) {
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState('');

  // Set initial symbol if provided
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol.toUpperCase());
    }
  }, [initialSymbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedSymbol = symbol.trim().toUpperCase();
    
    if (!trimmedSymbol) {
      setError('Please enter a stock symbol');
      return;
    }

    if (trimmedSymbol.length > 5) {
      setError('Stock symbol must be 5 characters or less');
      return;
    }

    onSubmit({ symbol: trimmedSymbol });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={handleInputChange}
            placeholder="e.g., AAPL"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-colors"
            disabled={isLoading}
            maxLength={5}
          />
        </div>
        
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !symbol.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? 'Researching...' : 'Research Stock'}
        </button>
      </form>
    </div>
  );
}
