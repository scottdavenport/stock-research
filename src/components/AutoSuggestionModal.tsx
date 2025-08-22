'use client';

import { useState } from 'react';
import { ScreeningResult } from '../types/stock';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

interface AutoSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: ScreeningResult[];
  onStocksAdded?: (count: number) => void;
}

export default function AutoSuggestionModal({ 
  isOpen, 
  onClose, 
  stocks, 
  onStocksAdded 
}: AutoSuggestionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

  // Filter stocks with score >= 85
  const highScoringStocks = stocks.filter(stock => stock.score >= 85);

  const handleSelectAll = () => {
    setSelectedStocks(highScoringStocks.map(stock => stock.symbol));
  };

  const handleDeselectAll = () => {
    setSelectedStocks([]);
  };

  const handleToggleStock = (symbol: string) => {
    setSelectedStocks(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleAddSelected = async () => {
    if (!user?.email || selectedStocks.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk-add',
          symbols: selectedStocks,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onStocksAdded?.(selectedStocks.length);
        addToast(`Added ${selectedStocks.length} stocks to watchlist`, 'success');
        onClose();
      } else {
        console.error('Error adding stocks to watchlist:', data.error);
        addToast('Failed to add stocks to watchlist. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding stocks to watchlist:', error);
      addToast('Failed to add stocks to watchlist. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaybeLater = () => {
    onClose();
  };

  if (!isOpen || highScoringStocks.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Great Opportunities Found! 🎯</h2>
              <p className="text-gray-400 text-sm mt-1">
                We found {highScoringStocks.length} high-scoring stocks (85+) that might be worth watching
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {highScoringStocks.map((stock) => (
              <div
                key={stock.symbol}
                className={`
                  flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer
                  ${selectedStocks.includes(stock.symbol)
                    ? 'bg-purple-900/20 border-purple-500'
                    : 'bg-gray-750 border-gray-600 hover:border-gray-500'
                  }
                `}
                onClick={() => handleToggleStock(stock.symbol)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStocks.includes(stock.symbol)}
                    onChange={() => handleToggleStock(stock.symbol)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{stock.symbol}</span>
                      <span className="text-gray-400">{stock.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                        stock.rating === 'STRONG BUY' ? 'text-green-400 bg-green-900/20 border-green-500' :
                        stock.rating === 'BUY' ? 'text-blue-400 bg-blue-900/20 border-blue-500' :
                        'text-yellow-400 bg-yellow-900/20 border-yellow-500'
                      }`}>
                        {stock.rating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{stock.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${stock.score >= 90 ? 'text-green-400' : 'text-blue-400'}`}>
                    {stock.score}/100
                  </div>
                  <div className="text-sm text-gray-400">
                    ${stock.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-750">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {selectedStocks.length} of {highScoringStocks.length} stocks selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleMaybeLater}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Maybe Later
            </button>
                         <button
               onClick={handleAddSelected}
               disabled={isLoading || selectedStocks.length === 0}
               className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 border border-amber-400 hover:border-amber-500 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {isLoading ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                   Adding...
                 </>
               ) : (
                 <>
                   <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                   </svg>
                   Add {selectedStocks.length} to Watchlist
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
