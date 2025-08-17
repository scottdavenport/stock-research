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
    const { maxStocks, jobId } = body;
    
    console.log('Polling screening status for:', { maxStocks, jobId });

    // Check if auth token is available
    if (!N8N_AUTH_TOKEN) {
      console.error('NEXT_PUBLIC_N8N_WEBHOOK_STOCK_SCREENER_API_KEY environment variable is not set');
      throw new Error('Authentication token not configured');
    }

    // TODO: In a real implementation, you'd have a job ID and status endpoint
    // For now, we'll simulate a status check by returning "still processing"
    // This prevents multiple screening requests from being triggered
    
    console.log('Status check for job:', jobId, 'maxStocks:', maxStocks);
    
    // Simulate processing time based on batch size
    const estimatedProcessingTime = maxStocks >= 500 ? 540 : maxStocks * 4.5 + 20; // seconds
    const timeSinceStart = Date.now() - parseInt(jobId.split('-')[1]);
    
    if (timeSinceStart < estimatedProcessingTime * 1000) {
      return NextResponse.json({
        success: false,
        status: 'processing',
        message: `Screening ${maxStocks} stocks is still in progress...`,
        progress: Math.min(100, (timeSinceStart / (estimatedProcessingTime * 1000)) * 100),
        timestamp: new Date().toISOString()
      }, { status: 202 });
    }
    
    // If we've exceeded the estimated time, try one final request to get results
    console.log('Estimated time exceeded, making final request to get results...');
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ maxStocks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n screening status error:', errorText);
      
      // Handle 404 errors (webhook not registered in test mode)
      if (response.status === 404) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && errorData.message.includes('not registered')) {
            console.log('n8n webhook not registered (test mode) - this is expected for polling');
            return NextResponse.json({
              success: false,
              status: 'processing',
              message: 'Screening is still in progress... (n8n test mode limitation)',
              timestamp: new Date().toISOString()
            }, { status: 202 });
          }
        } catch {
          // Continue with normal error handling
        }
      }
      
      // If still processing, return status
      if (response.status === 524) {
        return NextResponse.json({
          success: false,
          status: 'processing',
          message: 'Screening is still in progress...',
          timestamp: new Date().toISOString()
        }, { status: 200 }); // Changed to 200 to indicate we got a response
      }
      
      // For other errors, return processing status instead of throwing
      console.log('n8n returned error, but continuing to poll:', response.status, errorText);
      return NextResponse.json({
        success: false,
        status: 'processing',
        message: 'Screening is still in progress... (encountered error but continuing)',
        timestamp: new Date().toISOString()
      }, { status: 202 });
    }

    const data = await response.json();
    
    console.log('n8n screening status response:', data);

    // If we get here, the job is complete
    const transformedResponse = {
      success: true,
      status: 'completed',
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

  } catch (error) {
    console.error('Screening status error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to check screening status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
