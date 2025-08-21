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
  const maxAttempts = 90; // 15 minutes with 10-second intervals

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
          console.log('🚀 Found processing session, setting as current:', processingSession.id);
          const newSession = {
            id: processingSession.id,
            userEmail: processingSession.user_email,
            status: processingSession.status,
            totalStocksScreened: processingSession.total_stocks_screened,
            totalBuyRated: processingSession.total_buy_rated,
            buyPercentage: processingSession.buy_percentage,
            averageScore: processingSession.average_score,
            processingTimeSeconds: processingSession.processing_time_seconds,
            createdAt: processingSession.created_at,
            completedAt: processingSession.completed_at,
            screeningType: processingSession.screening_type,
            filters: processingSession.filters
          };
          setSession(newSession);
          
          // Start polling immediately when we find a processing session
          console.log('🚀 Starting polling for found session:', processingSession.id);
          setIsLoading(true);
          setError(null);
          setIsPolling(true);
          attemptCountRef.current = 0;
          setPollCount(0);
          
          // Initial fetch
          fetchSessionStatus();
          fetchLatestResults();
          
          // Set up polling interval (10 seconds)
          pollingIntervalRef.current = setInterval(() => {
            attemptCountRef.current++;
            
            if (attemptCountRef.current >= maxAttempts) {
              setError('Screening timed out after 15 minutes. Please try again.');
              setIsPolling(false);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              return;
            }

            fetchSessionStatus();
            fetchLatestResults();
          }, 10000);
          
          // Set up timeout (15 minutes)
          timeoutRef.current = setTimeout(() => {
            setError('Screening timed out after 15 minutes. Please try again.');
            setIsPolling(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }, 15 * 60 * 1000);
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
      // Always fetch the most recent session for this user
      const { data: latestSessionData, error: latestSessionError } = await supabase
        .from('user_screening_sessions')
        .select('*')
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
          userEmail: latestSessionData.user_email,
          status: latestSessionData.status,
          totalStocksScreened: latestSessionData.total_stocks_screened,
          totalBuyRated: latestSessionData.total_buy_rated,
          buyPercentage: latestSessionData.buy_percentage,
          averageScore: latestSessionData.average_score,
          processingTimeSeconds: latestSessionData.processing_time_seconds,
          createdAt: latestSessionData.created_at,
          completedAt: latestSessionData.completed_at,
          screeningType: latestSessionData.screening_type,
          filters: latestSessionData.filters
        };

        setLatestSession(latestSessionInfo);

        // If latest session is completed, fetch its results
        if (latestSessionData.status === 'completed' || latestSessionData.status === 'replaced') {
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
            console.log('📈 Latest results found:', latestResultsData.length, 'stocks');
            
            const transformedLatestResults: ScreeningResultWithSession[] = latestResultsData.map((result: any) => ({
              symbol: result.symbol,
              name: result.stock_universe.name,
              score: result.score,
              rating: result.rating,
              price: result.price,
              changePercent: result.change_percent,
              sector: result.stock_universe.sector,
              rankPosition: result.rank_position,
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
    } catch (err) {
      console.error('Error fetching latest results:', err);
    }
  }, [userEmail]);

  const fetchSessionStatus = useCallback(async () => {
    if (!userEmail) return;

    const currentTime = new Date().toISOString();
    setLastPollTime(currentTime);
    setPollCount(prev => prev + 1);

    // Always get the most recent session for this user
    const { data: latestSessionData, error: latestSessionError } = await supabase
      .from('user_screening_sessions')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestSessionError) {
      console.error('Error fetching latest session:', latestSessionError);
      return;
    }

    if (!latestSessionData) {
      console.log('No sessions found for user:', userEmail);
      return;
    }

    const currentSessionId = latestSessionData.id;
    console.log(`🔄 Polling attempt ${attemptCountRef.current + 1} for session:`, currentSessionId);

    try {
      // Use the latest session data we already fetched
      const sessionData = latestSessionData;

      const sessionInfo: ScreeningSession = {
        id: sessionData.id,
        userEmail: sessionData.user_email,
        status: sessionData.status,
        totalStocksScreened: sessionData.total_stocks_screened,
        totalBuyRated: sessionData.total_buy_rated,
        buyPercentage: sessionData.buy_percentage,
        averageScore: sessionData.average_score,
        processingTimeSeconds: sessionData.processing_time_seconds,
        createdAt: sessionData.created_at,
        completedAt: sessionData.completed_at,
        screeningType: sessionData.screening_type,
        filters: sessionData.filters
      };

      setSession(sessionInfo);

      // Always fetch results if they exist, regardless of session status
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
        symbol: result.symbol,
        name: result.stock_universe.name,
        score: result.score,
        rating: result.rating,
        price: result.price,
        changePercent: result.change_percent,
        sector: result.stock_universe.sector,
        rankPosition: result.rank_position,
        scoreBreakdown: result.score_breakdown || {
          momentum: 0,
          quality: 0,
          technical: 0
        }
      }));

      setResults(transformedResults);
      
      // Update session state with latest data
      setSession(sessionData);
      
      // Handle different session statuses
      if (sessionData.status === 'failed') {
        setError('Screening failed. Please try again.');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (sessionData.status === 'replaced' && transformedResults.length > 0) {
        console.log('✅ Session replaced with results, stopping polling');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (sessionData.status === 'completed' && transformedResults.length > 0) {
        console.log('✅ Session completed with results, stopping polling');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (transformedResults.length > 0) {
        console.log('📊 Found results while session is still processing, continuing to poll for updates');
      } else {
        console.log('⏳ Session still processing, continuing to poll...');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching screening status';
      setError(errorMessage);
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [userEmail]);

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

    // Initial fetch - get both current session and latest results
    fetchSessionStatus();
    fetchLatestResults();

    // Set up polling interval (10 seconds)
    pollingIntervalRef.current = setInterval(() => {
      attemptCountRef.current++;
      
      if (attemptCountRef.current >= maxAttempts) {
        setError('Screening timed out after 15 minutes. Please try again.');
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      fetchSessionStatus();
      fetchLatestResults(); // Always check for latest results too
    }, 10000); // 10 seconds

    // Set up timeout (15 minutes)
    timeoutRef.current = setTimeout(() => {
      setError('Screening timed out after 15 minutes. Please try again.');
      setIsPolling(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 15 * 60 * 1000); // 15 minutes

  }, [sessionId, userEmail, fetchSessionStatus, maxAttempts]);

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
      
      // Always start polling when we have a userEmail, regardless of sessionId
      console.log('🚀 Starting polling for user:', userEmail);
      startPolling();
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
