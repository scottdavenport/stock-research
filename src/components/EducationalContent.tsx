import React from 'react';

interface EducationalContentProps {
  batchSize: number;
  estimatedTime: string;
  startedAt: string;
}

export default function EducationalContent({ batchSize, estimatedTime, startedAt }: EducationalContentProps) {
  const getEstimatedTime = (batchSize: number) => {
    if (batchSize >= 5000) return '25-30 minutes';
    if (batchSize >= 2000) return '15-20 minutes';
    if (batchSize >= 1000) return '10-15 minutes';
    if (batchSize >= 500) return '5-10 minutes';
    return '2-5 minutes';
  };

  const estimatedTimeDisplay = estimatedTime || getEstimatedTime(batchSize);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Your First Screening is in Progress
        </h2>
        <p className="text-gray-400 mb-4">
          We're analyzing {batchSize} stocks using advanced algorithms to find the best investment opportunities.
        </p>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-blue-300 text-sm">
              Estimated completion: {estimatedTimeDisplay}
            </span>
          </div>
          <p className="text-blue-200/70 text-xs mt-2 text-center">
            Started at {new Date(startedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-700/50 rounded-lg p-6">
          <div className="text-green-400 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Momentum Analysis</h3>
          <p className="text-gray-300 text-sm">
            We analyze price trends, volume patterns, and technical indicators to identify stocks with strong upward momentum.
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6">
          <div className="text-blue-400 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Quality Metrics</h3>
          <p className="text-gray-300 text-sm">
            We evaluate financial health, profitability ratios, and business fundamentals to ensure investment quality.
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6">
          <div className="text-purple-400 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Comprehensive Scoring</h3>
          <p className="text-gray-300 text-sm">
            Each stock receives a composite score based on multiple factors, helping you make informed investment decisions.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">What to Expect</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Results will show stocks ranked by their overall investment potential</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Each stock includes detailed metrics and analysis breakdowns</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>You can filter and sort results by various criteria</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Add interesting stocks to your watchlist for further analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
