import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ProcessingBannerProps {
  batchSize: number;
  estimatedTime: string;
  startedAt: string;
}

export default function ProcessingBanner({ batchSize, estimatedTime, startedAt }: ProcessingBannerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getEstimatedTime = (batchSize: number) => {
    if (batchSize >= 5000) return '25-30 minutes';
    if (batchSize >= 2000) return '15-20 minutes';
    if (batchSize >= 1000) return '10-15 minutes';
    if (batchSize >= 500) return '5-10 minutes';
    return '2-5 minutes';
  };

  const estimatedTimeDisplay = estimatedTime || getEstimatedTime(batchSize);

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="small" />
          <div>
            <h3 className="text-blue-300 font-semibold text-sm">
              New Screening in Progress
            </h3>
            <p className="text-blue-200 text-xs">
              {batchSize} stocks • Estimated completion: {estimatedTimeDisplay}
            </p>
            <p className="text-blue-200/70 text-xs">
              Started at {new Date(startedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-blue-300 text-xs font-medium">
            Background Processing
          </div>
          <div className="text-blue-200/70 text-xs">
            You can continue using the app
          </div>
        </div>
      </div>
    </div>
  );
}
