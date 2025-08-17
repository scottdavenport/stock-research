import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_SCREENER || 'https://thinkcode.app.n8n.cloud/webhook-test/screen-stocks-sequential';
const N8N_AUTH_TOKEN = process.env.NEXT_PUBLIC_N8N_WEBHOOK_STOCK_SCREENER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract maxStocks from the form data
    const maxStocks = body.batchSize || 20;
    
    console.log('Proxying screening request to n8n:', N8N_WEBHOOK_URL);
    console.log('Screening request body:', { maxStocks });

    // Check if auth token is available
    if (!N8N_AUTH_TOKEN) {
      console.error('NEXT_PUBLIC_N8N_WEBHOOK_STOCK_SCREENER_API_KEY environment variable is not set');
      throw new Error('Authentication token not configured');
    }

    // Set a longer timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ maxStocks }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n screening error:', errorText);
      
      // Handle Cloudflare timeout specifically
      if (response.status === 524) {
        throw new Error('The screening process is taking longer than expected. This is normal for larger batch sizes. Please try again in a few minutes or reduce the batch size.');
      }
      
      throw new Error(`n8n API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('n8n screening response:', data);

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
      results: data.results?.map((stock: any, index: number) => ({
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
    console.error('Screening proxy error:', error);
    
    // Handle specific timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'The screening request timed out. This can happen with larger batch sizes. Please try a smaller batch size or try again later.',
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
            error: 'The screening process is taking longer than expected. This is normal for larger batch sizes. Please try again in a few minutes or reduce the batch size.',
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
