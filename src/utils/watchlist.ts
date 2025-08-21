import { supabase } from './supabase';

export interface WatchlistStock {
  symbol: string;
  company_name: string;
  sector: string;
  added_at: string;
  notes: string | null;
  latest_score: number | null;
  latest_rating: string | null;
  latest_price: number | null;
  latest_change_percent: number | null;
  latest_screening_date: string | null;
  rank_position: number | null;
}

export interface WatchlistResponse {
  success: boolean;
  data?: WatchlistStock[];
  error?: string;
}

/**
 * Add a stock to the user's watchlist
 */
export async function addToWatchlist(
  symbol: string, 
  userEmail: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_to_watchlist', {
      p_user_email: userEmail,
      p_symbol: symbol,
      p_notes: notes || null
    });

    if (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { success: false, error: 'Failed to add stock to watchlist' };
  }
}

/**
 * Remove a stock from the user's watchlist
 */
export async function removeFromWatchlist(
  symbol: string, 
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_from_watchlist', {
      p_user_email: userEmail,
      p_symbol: symbol
    });

    if (error) {
      console.error('Error removing from watchlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, error: 'Failed to remove stock from watchlist' };
  }
}

/**
 * Get the user's complete watchlist with latest screening data
 */
export async function fetchWatchlist(userEmail: string): Promise<WatchlistResponse> {
  try {
    const { data, error } = await supabase.rpc('get_watchlist_with_latest_data', {
      p_user_email: userEmail
    });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return { success: false, error: 'Failed to fetch watchlist' };
  }
}

/**
 * Get array of watched stock symbols
 */
export async function getWatchedStocks(userEmail: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_watchlist_with_latest_data', {
      p_user_email: userEmail
    });

    if (error) {
      console.error('Error fetching watched stocks:', error);
      return { success: false, error: error.message };
    }

    const symbols = (data || []).map((stock: WatchlistStock) => stock.symbol);
    return { success: true, data: symbols };
  } catch (error) {
    console.error('Error fetching watched stocks:', error);
    return { success: false, error: 'Failed to fetch watched stocks' };
  }
}

/**
 * Check if a specific stock is in the user's watchlist
 */
export async function isStockWatched(
  symbol: string, 
  userEmail: string
): Promise<{ success: boolean; isWatched?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('is_stock_watched', {
      p_user_email: userEmail,
      p_symbol: symbol
    });

    if (error) {
      console.error('Error checking watchlist status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, isWatched: data };
  } catch (error) {
    console.error('Error checking watchlist status:', error);
    return { success: false, error: 'Failed to check watchlist status' };
  }
}

/**
 * Add multiple stocks to watchlist in bulk
 */
export async function bulkAddToWatchlist(
  symbols: string[], 
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const results = await Promise.all(
      symbols.map(symbol => addToWatchlist(symbol, userEmail))
    );

    const failed = results.filter(result => !result.success);
    if (failed.length > 0) {
      return { 
        success: false, 
        error: `Failed to add ${failed.length} stocks to watchlist` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error bulk adding to watchlist:', error);
    return { success: false, error: 'Failed to bulk add stocks to watchlist' };
  }
}
