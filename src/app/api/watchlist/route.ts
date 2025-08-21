import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchWatchlist, 
  addToWatchlist, 
  removeFromWatchlist, 
  bulkAddToWatchlist 
} from '../../../utils/watchlist';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    const result = await fetchWatchlist(userEmail);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in watchlist GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol, userEmail, notes, symbols } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'add':
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol is required for add action' },
            { status: 400 }
          );
        }
        result = await addToWatchlist(symbol, userEmail, notes);
        break;

      case 'remove':
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol is required for remove action' },
            { status: 400 }
          );
        }
        result = await removeFromWatchlist(symbol, userEmail);
        break;

      case 'bulk-add':
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { success: false, error: 'Symbols array is required for bulk-add action' },
            { status: 400 }
          );
        }
        result = await bulkAddToWatchlist(symbols, userEmail);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Must be "add", "remove", or "bulk-add"' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in watchlist POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
