import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userEmail = searchParams.get('userEmail');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User email is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    console.log('Fetching enhanced screening results for:', { sessionId, userEmail, limit });

    // Build the query
    let query = supabase
      .from('screening_results')
      .select(`
        *,
        stock_universe!inner(
          symbol,
          name,
          sector,
          market_cap_tier
        )
      `)
      .order('score', { ascending: false })
      .limit(limit);

    // Add filters if provided
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // Get the most recent results for the user
    const { data: results, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch screening results',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No screening results found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Transform the database results to match our enhanced interface
    const transformedResults = results.map((result, index) => ({
      rank: index + 1,
      symbol: result.symbol,
      name: result.stock_universe?.name || result.symbol,
      sector: result.stock_universe?.sector || 'Unknown',
      score: result.score,
      rating: result.rating,
      price: result.price || 0,
      changePercent: result.change_percent || 0,
      marketCap: result.market_cap || 0,
      peRatio: result.pe_ratio,
      week52High: result.week_52_high,
      distanceFrom52High: result.distance_from_52_high,
      
      // Enhanced fields from database
      signalStrength: result.signal_strength,
      rankPosition: result.rank_position,
      dayHigh: result.day_high,
      dayLow: result.day_low,
      week52Low: result.week_52_low,
      volume: result.volume,
      avgVolume: result.avg_volume,
      relativeVolume: result.relative_volume,
      forwardPe: result.forward_pe,
      beta: result.beta,
      epsGrowth: result.eps_growth,
      revenueGrowth: result.revenue_growth,
      roe: result.roe,
      operatingMargin: result.operating_margin,
      debtToEquity: result.debt_to_equity,
      ytdReturn: result.ytd_return,
      mtdReturn: result.mtd_return,
      priceRelative4w: result.price_relative_4w,
      priceRelative13w: result.price_relative_13w,
      
      // Detailed analysis data
      scoreBreakdown: result.score_breakdown || {
        momentum: 0,
        quality: 0,
        technical: 0
      },
      technicals: result.technicals || {},
      signals: result.signals || {},
      insights: result.insights || {},
      recommendations: result.recommendations || {}
    }));

    // Calculate summary statistics
    const totalScreened = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalScreened;
    const strongBuys = results.filter(r => r.rating === 'STRONG BUY').length;
    const buys = results.filter(r => r.rating === 'BUY').length;
    
    // Get top sector
    const sectorCounts = results.reduce((acc, r) => {
      const sector = r.stock_universe?.sector || 'Unknown';
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSector = Object.entries(sectorCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalScreened,
        averageScore: Math.round(averageScore * 10) / 10,
        strongBuys,
        buys,
        topSector
      },
      results: transformedResults
    };

    console.log(`✅ Enhanced screening results: ${totalScreened} stocks with comprehensive data`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced screening results error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch enhanced screening results',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
