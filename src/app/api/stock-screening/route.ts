import { NextRequest, NextResponse } from 'next/server';

interface N8NStockData {
  symbol: string;
  name: string;
  sector: string;
  score: number;
  rating: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
  week52High: number | null;
  distanceFrom52High: string | null;
  scoreBreakdown?: {
    momentum: number;
    quality: number;
    technical: number;
  };
}

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_SCREENER || 'https://thinkcode.app.n8n.cloud/webhook-test/screen-stocks-sequential';
const N8N_AUTH_TOKEN = process.env.NEXT_PUBLIC_N8N_WEBHOOK_STOCK_SCREENER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract data from the form
    const maxStocks = body.batchSize || 20;
    const userEmail = body.userEmail;
    
    // Validate user email is provided
    if (!userEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User email is required for screening. Please log in and try again.',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    console.log('Proxying screening request to n8n:', N8N_WEBHOOK_URL);
    console.log('Screening request body:', { maxStocks, userEmail, ...body });

    // Check if auth token is available
    if (!N8N_AUTH_TOKEN) {
      console.error('NEXT_PUBLIC_N8N_WEBHOOK_STOCK_SCREENER_API_KEY environment variable is not set');
      throw new Error('Authentication token not configured');
    }

    // For large batches, use a shorter initial timeout and implement polling
    const isLargeBatch = maxStocks >= 100;
    const initialTimeout = isLargeBatch ? 30000 : 120000; // 30 seconds for large batches, 2 minutes for small

    console.log(`Using ${initialTimeout / 1000}s initial timeout for ${maxStocks} stocks`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), initialTimeout);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${N8N_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ 
          maxStocks,
          userEmail,
          ...body // Include all other form data
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('n8n screening error:', errorText);
        
        // Handle Cloudflare timeout specifically
        if (response.status === 524) {
          if (maxStocks >= 500) {
            throw new Error('The Full Screen screening process is taking longer than expected. This comprehensive analysis may take 10+ minutes. Please try again later or use a smaller batch size.');
          }
          throw new Error('The screening process is taking longer than expected. This is normal for larger batch sizes. Please try again in a few minutes or reduce the batch size.');
        }
        
        // Handle cancelled executions and other n8n errors
        if (response.status === 500) {
          console.log('n8n returned 500 error:', errorText);
          
          // Check for cancelled execution
          if (errorText.includes('cancelled') || errorText.includes('cancellation')) {
            console.log('n8n execution was cancelled - this may be normal for large batches');
            if (maxStocks >= 100) {
              // For large batches, treat cancellation as a timeout and switch to polling
              return NextResponse.json({
                success: false,
                requiresPolling: true,
                message: `Screening ${maxStocks} stocks is in progress. The initial request was cancelled (normal for large batches).`,
                estimatedTime: maxStocks >= 500 ? '8-10 minutes' : '3-5 minutes',
                timestamp: new Date().toISOString()
              }, { status: 202 }); // 202 Accepted
            }
            throw new Error('The screening execution was cancelled. This may happen with large batch sizes. Please try again.');
          }
          
          // Handle other 500 errors that might indicate the workflow is still processing
          if (maxStocks >= 100) {
            console.log('Large batch with 500 error - treating as processing and switching to polling');
            return NextResponse.json({
              success: false,
              requiresPolling: true,
              message: `Screening ${maxStocks} stocks encountered an error but may still be processing. Switching to polling mode.`,
              estimatedTime: maxStocks >= 500 ? '8-10 minutes' : '3-5 minutes',
              timestamp: new Date().toISOString()
            }, { status: 202 }); // 202 Accepted
          }
          
                  // Handle other n8n errors
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`n8n workflow error: ${errorData.message || 'Unknown error occurred'}`);
        } catch {
          throw new Error(`n8n API error: ${response.status} - ${errorText}`);
        }
        }
        
        throw new Error(`n8n API error: ${response.status} - ${errorText}`);
      }

      let data;
      let rawResponseText = '';
      
      try {
        data = await response.json();
        console.log('n8n screening response:', data);
      } catch (jsonError) {
        console.error('Failed to parse n8n response as JSON:', jsonError);
        
        // Get the raw response text for debugging
        try {
          rawResponseText = await response.text();
          console.error('Raw response text:', rawResponseText);
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
        
        // Check if this is a large batch that might still be processing
        if (maxStocks >= 100) {
          console.log('Large batch with JSON parse error - treating as processing and switching to polling');
          return NextResponse.json({
            success: false,
            requiresPolling: true,
            message: `Screening ${maxStocks} stocks encountered a response error but may still be processing. Switching to polling mode.`,
            estimatedTime: maxStocks >= 500 ? '8-10 minutes' : '3-5 minutes',
            timestamp: new Date().toISOString()
          }, { status: 202 }); // 202 Accepted
        }
        
        // If we can't parse JSON, it might be a workflow error
        const errorMessage = rawResponseText.includes('Create Screening Session') 
          ? 'The screening workflow encountered a configuration error. This is likely due to an issue with the n8n workflow setup. Please try again or contact support if the problem persists.'
          : 'The screening workflow encountered an error and returned invalid data. This may be due to a configuration issue in the workflow. Please try again or contact support if the problem persists.';
        
        throw new Error(errorMessage);
      }

      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('The screening workflow returned an invalid response format. Please try again.');
      }

      // Transform the n8n response to match our expected format
      const transformedResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          totalScreened: data.summary?.totalScreened || 0,
          averageScore: data.summary?.averageScore || 0,
          strongBuys: data.summary?.ratings?.strongBuy || 0,
          buys: data.summary?.ratings?.buy || 0,
          topSector: data.summary?.topSector || 'N/A'
        },
        results: data.results?.map((stock: N8NStockData, index: number) => ({
          rank: index + 1,
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          score: stock.score,
          rating: stock.rating,
          price: stock.price,
          changePercent: stock.changePercent,
          marketCap: stock.marketCap,
          peRatio: stock.peRatio,
          week52High: stock.week52High,
          distanceFrom52High: stock.distanceFrom52High,
          scoreBreakdown: {
            momentum: stock.scoreBreakdown?.momentum || 0,
            quality: stock.scoreBreakdown?.quality || 0,
            technical: stock.scoreBreakdown?.technical || 0
          }
        })) || []
      };

      return NextResponse.json(transformedResponse);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If it's a timeout and it's a large batch, return a special response for polling
      if (fetchError instanceof Error && fetchError.name === 'AbortError' && isLargeBatch) {
        console.log('Large batch timeout - returning polling response');
        return NextResponse.json({
          success: false,
          requiresPolling: true,
          message: `Screening ${maxStocks} stocks is in progress. This may take several minutes.`,
          estimatedTime: maxStocks >= 500 ? '8-10 minutes' : '3-5 minutes',
          timestamp: new Date().toISOString()
        }, { status: 202 }); // 202 Accepted
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Screening proxy error:', error);
    
    // Handle specific timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'The screening request timed out. For Full Screen mode, this may take 10+ minutes. Please try again later or use a smaller batch size.',
            timestamp: new Date().toISOString(),
            summary: {
              totalScreened: 0,
              averageScore: 0,
              strongBuys: 0,
              buys: 0,
              topSector: 'N/A'
            },
            results: []
          },
          { status: 408 }
        );
      }
      
      if (error.message.includes('524')) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString(),
            summary: {
              totalScreened: 0,
              averageScore: 0,
              strongBuys: 0,
              buys: 0,
              topSector: 'N/A'
            },
            results: []
          },
          { status: 524 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to screen stocks',
        timestamp: new Date().toISOString(),
        summary: {
          totalScreened: 0,
          averageScore: 0,
          strongBuys: 0,
          buys: 0,
          topSector: 'N/A'
        },
        results: []
      },
      { status: 500 }
    );
  }
}
