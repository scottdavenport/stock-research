import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_RESEARCHER || 'https://thinkcode.app.n8n.cloud/webhook-test/stock-research';
const N8N_AUTH_TOKEN = process.env.NEXT_PUBLIC_N8N_WEBHOOK_STOCK_RESEARCHER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxying request to n8n:', N8N_WEBHOOK_URL);
    console.log('Request body:', body);

    // Check if auth token is available
    if (!N8N_AUTH_TOKEN) {
      console.error('NEXT_PUBLIC_N8N_WEBHOOK_STOCK_RESEARCHER_API_KEY environment variable is not set');
      throw new Error('Authentication token not configured');
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_AUTH_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n research error:', errorText);
      throw new Error(`n8n API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('n8n response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch stock data' 
      },
      { status: 500 }
    );
  }
}
