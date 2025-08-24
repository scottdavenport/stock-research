import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { ScreeningSession, ScreeningResultWithSession, ScreeningResultsResponse } from '../types/stock';

interface UseScreeningResultsReturn {
  session: ScreeningSession | null;
  results: ScreeningResultWithSession[];
  latestSession: ScreeningSession | null;
  latestResults: ScreeningResultWithSession[];
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  pollCount: number;
  lastPollTime: string | null;
  retry: () => void;
}

export function useScreeningResults(sessionId: string | null, userEmail: string | null): UseScreeningResultsReturn {
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [results, setResults] = useState<ScreeningResultWithSession[]>([]);
  const [latestSession, setLatestSession] = useState<ScreeningSession | null>(null);
  const [latestResults, setLatestResults] = useState<ScreeningResultWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  
  // Dynamic timeout based on batch size - extend for larger batches
  const getMaxAttempts = (batchSize?: number) => {
    if (!batchSize) return 180; // 30 minutes default
    if (batchSize >= 5000) return 360; // 60 minutes for 5000+ stocks
    if (batchSize >= 2000) return 300; // 50 minutes for 2000+ stocks
    if (batchSize >= 1000) return 240; // 40 minutes for 1000+ stocks
    if (batchSize >= 500) return 180; // 30 minutes for 500+ stocks
    return 180; // 30 minutes for smaller batches
  };
  
  const maxAttempts = getMaxAttempts();

  const checkForRecentSessions = useCallback(async () => {
    if (!userEmail) return;

    console.log('🔍 Checking for recent sessions for user:', userEmail);

    try {
      // Look for sessions created in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentSessions, error: recentSessionsError } = await supabase
        .from('user_screening_sessions')
        .select('*')
        .eq('user_email', userEmail)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(5); // Get more sessions to find the right one

      if (recentSessionsError) {
        console.log('❌ Error checking for recent sessions:', recentSessionsError);
      } else if (recentSessions && recentSessions.length > 0) {
        console.log('🕐 Found', recentSessions.length, 'recent sessions');
        
        // Find the most recent processing session
        const processingSession = recentSessions.find(s => 
          s.status === 'processing' || s.status === 'running'
        );
        
        if (processingSession) {
          console.log('📋 Found processing session, setting as current:', processingSession.id);
          const newSession = {
            id: processingSession.id,
            userId: processingSession.user_email, // Use email as userId for now
            userEmail: processingSession.user_email,
            status: processingSession.status,
            totalStocksScreened: processingSession.total_stocks_screened,
            totalBuyRated: processingSession.total_buy_rated,
            buyPercentage: processingSession.buy_percentage,
            averageScore: processingSession.average_score,
            averageBuyScore: processingSession.average_buy_score || 0,
            processingTimeSeconds: processingSession.processing_time_seconds,
            createdAt: processingSession.created_at,
            completedAt: processingSession.completed_at,
            screeningType: processingSession.screening_type,
            filters: processingSession.filters
          };
          setSession(newSession);
          
          // Don't start polling automatically for existing sessions
          // Only start polling when a new screening is initiated (sessionId prop provided)
          console.log('📋 Found existing processing session, not starting polling automatically');
        } else {
          console.log('📭 No processing sessions found in recent sessions');
          // Log all session statuses for debugging
          recentSessions.forEach(s => {
            console.log(`  - Session ${s.id}: ${s.status} (created: ${s.created_at})`);
          });
        }
      } else {
        console.log('📭 No recent sessions found');
      }
    } catch (err) {
      console.error('Error checking for recent sessions:', err);
    }
  }, [userEmail]);

  const fetchLatestResults = useCallback(async () => {
    if (!userEmail) return;

    console.log('🔍 Fetching latest results for user:', userEmail);

    try {
      // Always fetch the most recent session for this user with error details
      const { data: latestSessionData, error: latestSessionError } = await supabase
        .from('user_screening_sessions')
        .select(`
          id,
          user_email,
          status,
          created_at,
          completed_at,
          total_stocks_screened,
          total_buy_rated,
          buy_percentage,
          average_score,
          average_buy_score,
          processing_time_seconds,
          screening_type,
          filters,
          session_data
        `)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestSessionError) {
        console.log('❌ Error fetching sessions for user:', userEmail, latestSessionError);
        if (latestSessionError.code === '406') {
          console.error('🔒 Database access denied - RLS policy issue. Please check user_screening_sessions table permissions.');
        }
      } else if (latestSessionData) {
        console.log('📊 Latest session found:', latestSessionData.id, 'Status:', latestSessionData.status);
        
        const latestSessionInfo: ScreeningSession = {
          id: latestSessionData.id,
          userId: latestSessionData.user_email, // Use email as userId for now
          userEmail: latestSessionData.user_email,
          status: latestSessionData.status,
          totalStocksScreened: latestSessionData.total_stocks_screened,
          totalBuyRated: latestSessionData.total_buy_rated,
          buyPercentage: latestSessionData.buy_percentage,
          averageScore: latestSessionData.average_score,
          averageBuyScore: latestSessionData.average_buy_score,
          processingTimeSeconds: latestSessionData.processing_time_seconds,
          createdAt: latestSessionData.created_at,
          completedAt: latestSessionData.completed_at,
          screeningType: latestSessionData.screening_type,
          filters: latestSessionData.filters
        };

        setLatestSession(latestSessionInfo);

        // Check for failed sessions and extract error details
        if (latestSessionData.status === 'failed') {
          let errorMessage = 'Screening failed. Please try again.';
          
          // Extract error details from session_data if available
          if (latestSessionData.session_data) {
            try {
              const sessionDataObj = typeof latestSessionData.session_data === 'string' 
                ? JSON.parse(latestSessionData.session_data) 
                : latestSessionData.session_data;
              
              if (sessionDataObj.error_message) {
                errorMessage = `Screening failed: ${sessionDataObj.error_message}`;
              } else if (sessionDataObj.error) {
                errorMessage = `Screening failed: ${sessionDataObj.error}`;
              }
              
              // Add additional context if available
              if (sessionDataObj.failed_at) {
                errorMessage += ` (Failed at: ${new Date(sessionDataObj.failed_at).toLocaleString()})`;
              }
            } catch (parseError) {
              console.error('Error parsing session_data:', parseError);
            }
          }
          
          console.log('❌ Latest session failed with error:', errorMessage);
          setError(errorMessage);
          return;
        }

        // If latest session is completed, fetch its enhanced results
        if (latestSessionData.status === 'completed' || latestSessionData.status === 'replaced') {
          const enhancedResultsResponse = await fetch(`/api/stock-screening/enhanced?sessionId=${latestSessionData.id}&userEmail=${encodeURIComponent(userEmail)}&limit=50`);
          
          if (enhancedResultsResponse.ok) {
            const enhancedData = await enhancedResultsResponse.json();
            
            if (enhancedData.success && enhancedData.results) {
              console.log('📈 Latest enhanced results found:', enhancedData.results.length, 'stocks');
              setLatestResults(enhancedData.results);
            } else {
              console.log('⚠️ Enhanced latest results not available, falling back to basic results');
              // Fallback to basic results
              const { data: latestResultsData, error: latestResultsError } = await supabase
                .from('screening_results')
                .select(`
                  symbol,
                  score,
                  rating,
                  price,
                  change_percent,
                  rank_position,
                  score_breakdown,
                  created_at,
                  stock_universe!inner(name, sector)
                `)
                .eq('session_id', latestSessionData.id)
                .order('rank_position', { ascending: true });

              if (!latestResultsError && latestResultsData) {
                console.log('📈 Latest basic results found:', latestResultsData.length, 'stocks');
                
                const transformedLatestResults: ScreeningResultWithSession[] = latestResultsData.map((result: any) => ({
                  rank: result.rank_position || 0,
                  symbol: result.symbol,
                  name: result.stock_universe.name,
                  score: result.score,
                  rating: result.rating,
                  price: result.price,
                  changePercent: result.change_percent,
                  sector: result.stock_universe.sector,
                  rankPosition: result.rank_position,
                  marketCap: result.market_cap || 0,
                  peRatio: result.pe_ratio,
                  week52High: result.week_52_high,
                  distanceFrom52High: result.distance_from_52_high,
                  scoreBreakdown: result.score_breakdown || {
                    momentum: 0,
                    quality: 0,
                    technical: 0
                  }
                }));

                setLatestResults(transformedLatestResults);
              }
            }
          } else {
            console.log('⚠️ Enhanced latest results endpoint failed, falling back to basic results');
            // Fallback to basic results
            const { data: latestResultsData, error: latestResultsError } = await supabase
              .from('screening_results')
              .select(`
                symbol,
                score,
                rating,
                price,
                change_percent,
                rank_position,
                score_breakdown,
                created_at,
                stock_universe!inner(name, sector)
              `)
              .eq('session_id', latestSessionData.id)
              .order('rank_position', { ascending: true });

            if (!latestResultsError && latestResultsData) {
              console.log('📈 Latest basic results found:', latestResultsData.length, 'stocks');
              
              const transformedLatestResults: ScreeningResultWithSession[] = latestResultsData.map((result: any) => ({
                rank: result.rank_position || 0,
                symbol: result.symbol,
                name: result.stock_universe.name,
                score: result.score,
                rating: result.rating,
                price: result.price,
                changePercent: result.change_percent,
                sector: result.stock_universe.sector,
                rankPosition: result.rank_position,
                marketCap: result.market_cap || 0,
                peRatio: result.pe_ratio,
                week52High: result.week_52_high,
                distanceFrom52High: result.distance_from_52_high,
                scoreBreakdown: result.score_breakdown || {
                  momentum: 0,
                  quality: 0,
                  technical: 0
                }
              }));

              setLatestResults(transformedLatestResults);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching latest results:', err);
    }
  }, [userEmail]);

  const fetchSessionStatus = useCallback(async () => {
    if (!userEmail) return;

    const currentTime = new Date().toISOString();
    setLastPollTime(currentTime);
    setPollCount(prev => prev + 1);

    // Always get the most recent session for this user with error details
    const { data: latestSessionData, error: latestSessionError } = await supabase
      .from('user_screening_sessions')
      .select(`
        id,
        user_email,
        status,
        created_at,
        completed_at,
        total_stocks_screened,
        total_buy_rated,
        buy_percentage,
        average_score,
        average_buy_score,
        processing_time_seconds,
        screening_type,
        filters,
        session_data
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestSessionError) {
      console.error('Error fetching latest session:', latestSessionError);
      // If we can't fetch the session, it might be an n8n error
      if (attemptCountRef.current > 3) { // After 3 attempts, assume it's an error
        setError('Unable to fetch screening session. The n8n workflow may have failed to start properly.');
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
      return;
    }

    if (!latestSessionData) {
      console.log('No sessions found for user:', userEmail);
      // If no session found after several attempts, it might be an n8n error
      if (attemptCountRef.current > 3) {
        setError('No screening session found. The n8n workflow may have failed to create a session.');
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
      return;
    }

    const currentSessionId = latestSessionData.id;
    console.log(`🔄 Polling attempt ${attemptCountRef.current + 1} for session:`, currentSessionId, 'Status:', latestSessionData.status);

    try {
      // Use the latest session data we already fetched
      const sessionData = latestSessionData;

      const sessionInfo: ScreeningSession = {
        id: sessionData.id,
        userId: sessionData.user_email, // Use email as userId for now
        userEmail: sessionData.user_email,
        status: sessionData.status,
        totalStocksScreened: sessionData.total_stocks_screened,
        totalBuyRated: sessionData.total_buy_rated,
        buyPercentage: sessionData.buy_percentage,
        averageScore: sessionData.average_score,
        averageBuyScore: sessionData.average_buy_score,
        processingTimeSeconds: sessionData.processing_time_seconds,
        createdAt: sessionData.created_at,
        completedAt: sessionData.completed_at,
        screeningType: sessionData.screening_type,
        filters: sessionData.filters
      };

      setSession(sessionInfo);

      // Check for failed sessions immediately and extract error details
      if (sessionData.status === 'failed') {
        let errorMessage = 'Screening failed. Please try again.';
        
        // Extract error details from session_data if available
        if (sessionData.session_data) {
          try {
            const sessionDataObj = typeof sessionData.session_data === 'string' 
              ? JSON.parse(sessionData.session_data) 
              : sessionData.session_data;
            
            if (sessionDataObj.error_message) {
              errorMessage = `Screening failed: ${sessionDataObj.error_message}`;
            } else if (sessionDataObj.error) {
              errorMessage = `Screening failed: ${sessionDataObj.error}`;
            }
            
            // Add additional context if available
            if (sessionDataObj.failed_at) {
              errorMessage += ` (Failed at: ${new Date(sessionDataObj.failed_at).toLocaleString()})`;
            }
          } catch (parseError) {
            console.error('Error parsing session_data:', parseError);
          }
        }
        
        console.log('❌ Session failed with error:', errorMessage);
        setError(errorMessage);
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Fetch enhanced results from our new API endpoint
      const enhancedResultsResponse = await fetch(`/api/stock-screening/enhanced?sessionId=${currentSessionId}&userEmail=${encodeURIComponent(userEmail)}&limit=100`);
      
      if (enhancedResultsResponse.ok) {
        const enhancedData = await enhancedResultsResponse.json();
        
        if (enhancedData.success && enhancedData.results) {
          console.log('✅ Fetched enhanced results:', enhancedData.results.length, 'stocks');
          setResults(enhancedData.results);
        } else {
          console.log('⚠️ Enhanced results not available, falling back to basic results');
          // Fallback to basic results if enhanced endpoint fails
          const { data: resultsData, error: resultsError } = await supabase
            .from('screening_results')
            .select(`
              symbol,
              score,
              rating,
              price,
              change_percent,
              rank_position,
              score_breakdown,
              stock_universe!inner(name, sector)
            `)
            .eq('session_id', currentSessionId)
            .order('rank_position', { ascending: true });

          if (resultsError) {
            throw new Error(`Failed to fetch results: ${resultsError.message}`);
          }

          const transformedResults: ScreeningResultWithSession[] = (resultsData || []).map((result: any) => ({
            rank: result.rank_position || 0,
            symbol: result.symbol,
            name: result.stock_universe.name,
            score: result.score,
            rating: result.rating,
            price: result.price,
            changePercent: result.change_percent,
            sector: result.stock_universe.sector,
            rankPosition: result.rank_position,
            marketCap: result.market_cap || 0,
            peRatio: result.pe_ratio,
            week52High: result.week_52_high,
            distanceFrom52High: result.distance_from_52_high,
            scoreBreakdown: result.score_breakdown || {
              momentum: 0,
              quality: 0,
              technical: 0
            }
          }));

          setResults(transformedResults);
        }
      } else {
        console.log('⚠️ Enhanced endpoint failed, falling back to basic results');
        // Fallback to basic results
        const { data: resultsData, error: resultsError } = await supabase
          .from('screening_results')
          .select(`
            symbol,
            score,
            rating,
            price,
            change_percent,
            rank_position,
            score_breakdown,
            stock_universe!inner(name, sector)
          `)
          .eq('session_id', currentSessionId)
          .order('rank_position', { ascending: true });

        if (resultsError) {
          throw new Error(`Failed to fetch results: ${resultsError.message}`);
        }

        const transformedResults: ScreeningResultWithSession[] = (resultsData || []).map((result: any) => ({
          rank: result.rank_position || 0,
          symbol: result.symbol,
          name: result.stock_universe.name,
          score: result.score,
          rating: result.rating,
          price: result.price,
          changePercent: result.change_percent,
          sector: result.stock_universe.sector,
          rankPosition: result.rank_position,
          marketCap: result.market_cap || 0,
          peRatio: result.pe_ratio,
          week52High: result.week_52_high,
          distanceFrom52High: result.distance_from_52_high,
          scoreBreakdown: result.score_breakdown || {
            momentum: 0,
            quality: 0,
            technical: 0
          }
        }));

        setResults(transformedResults);
      }
      
      // Update session state with latest data
      setSession(sessionInfo);
      
      // Handle different session statuses
      if (results.length > 0) {
        // Stop polling as soon as we have results, regardless of session status
        console.log('✅ Found results, stopping polling');
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        console.log('⏳ Session still processing, continuing to poll...');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching screening status';
      setError(errorMessage);
      setIsPolling(false);
      setIsLoading(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [userEmail, results.length]);

  const startPolling = useCallback(() => {
    // Start polling if we have either a sessionId prop OR a current session
    const currentSessionId = sessionId || session?.id;
    if (!currentSessionId || !userEmail) return;

    console.log('🚀 Starting polling for session:', currentSessionId);
    setIsLoading(true);
    setError(null);
    setIsPolling(true);
    attemptCountRef.current = 0;
    setPollCount(0);

    // Get batch size from session or use default for timeout calculation
    const batchSize = session?.totalStocksScreened || 500;
    const dynamicMaxAttempts = getMaxAttempts(batchSize);
    const timeoutMinutes = Math.ceil(dynamicMaxAttempts / 6); // 6 attempts per minute

    console.log(`⏱️ Using dynamic timeout: ${timeoutMinutes} minutes for ${batchSize} stocks`);

    // Initial fetch - get both current session and latest results
    fetchSessionStatus();
    fetchLatestResults();

    // Set up polling interval (10 seconds)
    pollingIntervalRef.current = setInterval(() => {
      attemptCountRef.current++;
      
      if (attemptCountRef.current >= dynamicMaxAttempts) {
        setError(`Screening timed out after ${timeoutMinutes} minutes. Please try again.`);
        setIsPolling(false);
        setIsLoading(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      fetchSessionStatus();
      fetchLatestResults(); // Always check for latest results too
    }, 10000); // 10 seconds

    // Set up dynamic timeout
    timeoutRef.current = setTimeout(() => {
      setError(`Screening timed out after ${timeoutMinutes} minutes. Please try again.`);
      setIsPolling(false);
      setIsLoading(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, timeoutMinutes * 60 * 1000);

  }, [sessionId, userEmail, fetchSessionStatus, session?.totalStocksScreened]);

  const retry = useCallback(() => {
    setError(null);
    startPolling();
  }, [startPolling]);

  useEffect(() => {
    console.log('🔧 useScreeningResults mounted/updated with:', { sessionId, userEmail });
    
    if (userEmail) {
      // Always fetch latest results when component mounts
      console.log('🔄 Fetching latest results for user:', userEmail);
      fetchLatestResults();
      
      // Only start polling if we have a sessionId (indicating a new screening was initiated)
      if (sessionId) {
        console.log('🚀 Starting polling for new session:', sessionId);
        startPolling();
      } else {
        console.log('📋 No active sessionId, not starting polling');
      }
    } else {
      console.log('❌ No userEmail provided');
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionId, userEmail, startPolling, fetchLatestResults]);

  // Update todos
  useEffect(() => {
    if (pollCount > 0) {
      console.log(`🔄 Polling active - attempt ${pollCount}`);
    }
  }, [pollCount]);

  return {
    session,
    results,
    latestSession,
    latestResults,
    isLoading,
    error,
    isPolling,
    pollCount,
    lastPollTime,
    retry
  };
}
