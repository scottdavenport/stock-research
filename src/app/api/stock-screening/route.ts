import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_SCREENER || 'https://thinkcode.app.n8n.cloud/webhook-test/screen-stocks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxying screening request to n8n:', N8N_WEBHOOK_URL);
    console.log('Screening request body:', body);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('n8n screening response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Screening proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to screen stocks' },
      { status: 500 }
    );
  }
}
