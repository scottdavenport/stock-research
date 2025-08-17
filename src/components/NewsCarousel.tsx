import { StockData } from '../types/stock';

interface NewsCarouselProps {
  data: StockData;
}

export default function NewsCarousel({ data }: NewsCarouselProps) {
  const hasData = (value: unknown) => {
    return value !== null && value !== undefined && value !== '' && value !== 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!data.news || data.news.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent News</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
          <p className="text-gray-400">No recent news available</p>
          <p className="text-gray-500 text-sm mt-2">
            Check back later for the latest updates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Recent News</h2>
        <div className="text-sm text-gray-400">
          {data.news.length} article{data.news.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-6">
        {data.news.map((article, index) => (
          <div key={index} className="border-b border-gray-700 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start space-x-4">
              {/* News Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
              </div>
              
              {/* Article Content */}
              <div className="flex-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {hasData(article.summary) && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                      {article.summary}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <span>{formatDate(article.date)}</span>
                      </span>
                      
                      {hasData(article.summary) && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                          <span>Summary available</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                      <span className="text-sm font-medium">Read more</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* View All News Link */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            Stay updated with the latest news about {data.symbol}
          </p>
          <p className="text-xs text-gray-500">
            News data provided by {data.dataSource}
          </p>
        </div>
      </div>
    </div>
  );
}
