import { StockFormData, StockResponse, ScreeningFormData, ScreeningResponse, ScreeningResponseWithSession, ScreeningSessionResponse } from '../types/stock';

// Request deduplication for both research and screening
let currentResearchRequest: Promise<StockResponse> | null = null;
let currentScreeningRequest: Promise<ScreeningSessionResponse> | null = null;
let currentLegacyScreeningRequest: Promise<ScreeningResponseWithSession> | null = null;

export async function researchStock(formData: StockFormData): Promise<StockResponse> {
  // If there's already a research request in progress, return it
  if (currentResearchRequest) {
    console.log('Research request already in progress, returning existing promise');
    return currentResearchRequest;
  }
  
  console.log('Making request to local API proxy');
  console.log('Request payload:', { symbol: formData.symbol });
  
  // Create the research request promise
  currentResearchRequest = performResearchRequest(formData);
  
  try {
    const result = await currentResearchRequest;
    return result;
  } finally {
    // Clear the current request when done
    currentResearchRequest = null;
  }
}

async function performResearchRequest(formData: StockFormData): Promise<StockResponse> {
  try {
    const response = await fetch('/api/stock-research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        symbol: formData.symbol,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    return data as StockResponse;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function screenStocks(formData: ScreeningFormData, userEmail: string): Promise<ScreeningSessionResponse> {
  // If there's already a screening request in progress, return it
  if (currentScreeningRequest) {
    console.log('Screening request already in progress, returning existing promise');
    return currentScreeningRequest;
  }
  
  console.log('Triggering n8n workflow for screening:', { ...formData, userEmail });
  
  // Create the screening request promise
  currentScreeningRequest = performScreeningRequest(formData, userEmail);
  
  try {
    const result = await currentScreeningRequest;
    return result;
  } finally {
    // Clear the current request when done
    currentScreeningRequest = null;
  }
}

async function performScreeningRequest(formData: ScreeningFormData, userEmail: string): Promise<ScreeningSessionResponse> {
  try {
    // Send webhook to n8n workflow
    const response = await fetch('/api/stock-screening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        userEmail,
      }),
    });

    console.log('n8n workflow response status:', response.status);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('n8n workflow response error text:', errorText);
        
        // Try to parse as JSON to get structured error info
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            throw new Error(errorData.error);
          }
        } catch {
          // If not JSON, use the raw text
        }
        
        throw new Error(`n8n workflow failed (${response.status}): ${errorText}`);
      } catch (parseError) {
        throw new Error(`n8n workflow failed (${response.status}): Unable to read error details`);
      }
    }

    let data;
    try {
      data = await response.json();
      console.log('n8n workflow response data:', data);
      console.log('Response keys:', Object.keys(data));
      console.log('Response raw text:', JSON.stringify(data, null, 2));
      console.log('sessionId from response:', data.sessionId);
      console.log('sessionId type:', typeof data.sessionId);
    } catch (jsonError) {
      console.error('Failed to parse n8n workflow response as JSON:', jsonError);
      throw new Error('The n8n workflow returned invalid data. Please try again.');
    }
    
    // Handle different n8n response formats
    let sessionId = data.sessionId;
    
    // Check if this is a completed screening response (has summary and results)
    if (data.summary && Array.isArray(data.results)) {
      console.log('📊 Received completed screening response with summary:', data.summary);
      console.log('📈 Results count:', data.results.length);
      
      // Check if this is a real completed screening with results
      if (data.results.length > 0) {
        console.log('🎉 Screening completed with results! Displaying immediately.');
        // This is a completed screening with actual results
        // We don't need a sessionId since we have the results
        sessionId = null;
      } else {
        console.log('⏳ Screening completed but no results yet - will poll for updates');
        // This is a completed screening but no results yet
        // We need to find the session and poll for results
        
        // For completed screenings, we need to find the session in the database
        // The sessionId might be in the summary or we need to look it up
        if (data.summary.sessionId) {
          sessionId = data.summary.sessionId;
        } else if (data.sessionId) {
          // Sometimes the sessionId is still present even in completed responses
          sessionId = data.sessionId;
          console.log('✅ Found sessionId in completed response:', sessionId);
        } else {
          // Since this is a completed screening, we should find the most recent session
          // that matches this user and timestamp
          console.log('🔍 Completed screening detected - will find session in database');
          console.log('🔍 Looking for session created around:', data.timestamp);
          
          // Check if sessionId might be in a different field
          if (data.id) {
            sessionId = data.id;
            console.log('✅ Found sessionId in "id" field:', sessionId);
          } else if (data.session_id) {
            sessionId = data.session_id;
            console.log('✅ Found sessionId in "session_id" field:', sessionId);
          } else {
            sessionId = null; // Let the polling hook find the session
          }
        }
      }
    } else if (data.sessionId && data.success) {
      // This is the Early Success Response from n8n
      console.log('🚀 Received Early Success Response with sessionId:', data.sessionId);
      sessionId = data.sessionId;
    } else if (data.success && data.message === 'Stock screening started successfully') {
      // This is also an Early Success Response from n8n (different format)
      console.log('🚀 Received Early Success Response (alternative format)');
      // The sessionId will be found in the database by the polling hook
      sessionId = null;
    } else if (sessionId === '[object Object]' || (typeof sessionId === 'string' && sessionId.includes('[object Object]'))) {
      // Handle the case where n8n returns '[object Object]' string
      console.log('🔧 Detected [object Object] sessionId, will find session in database');
      
      // The sessionId is actually in the data field of the Create Screening Session response
      // Since we can't access the n8n context directly, we'll find the session by timestamp
      console.log('🔍 Will find session by timestamp since sessionId is [object Object]');
      sessionId = null; // Let the polling hook find the session
    } else if (typeof sessionId === 'object' && sessionId !== null) {
      // If sessionId is an object, try to extract the actual UUID
      console.log('SessionId is object:', sessionId);
      if (typeof sessionId === 'string') {
        sessionId = sessionId;
      } else if (sessionId.value) {
        sessionId = sessionId.value;
      } else if (sessionId.body) {
        sessionId = sessionId.body;
      } else if (sessionId.data) {
        // Handle the case where sessionId is { data: "uuid" }
        sessionId = sessionId.data;
      } else {
        // Try to stringify and extract UUID pattern
        const sessionStr = JSON.stringify(sessionId);
        const uuidMatch = sessionStr.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
          sessionId = uuidMatch[0];
        } else {
          console.error('Could not extract sessionId from object:', sessionId);
          sessionId = null;
        }
      }
    }
    
    console.log('Final sessionId after processing:', sessionId);
    
    // Transform n8n response to our expected format
    const apiResponse: ScreeningSessionResponse = {
      success: data.success,
      sessionId: sessionId,
      status: data.status || (data.results && data.results.length > 0 ? 'completed' : 'processing'),
      message: data.message,
      timestamp: data.timestamp,
      // Include results if they're available immediately
      results: data.results && data.results.length > 0 ? data.results : undefined,
      summary: data.summary
    };

    console.log('🎯 Final API response:', apiResponse);
    return apiResponse;
  } catch (error) {
    console.error('Screening API Error:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function screenStocksLegacy(formData: ScreeningFormData, userEmail: string): Promise<ScreeningResponseWithSession> {
  // If there's already a screening request in progress, return it
  if (currentLegacyScreeningRequest) {
    console.log('Legacy screening request already in progress, returning existing promise');
    return currentLegacyScreeningRequest;
  }
  
  console.log('Making screening request to n8n (legacy mode)');
  console.log('Request payload:', { ...formData, userEmail });
  
  // Create the screening request promise
  currentLegacyScreeningRequest = performScreeningRequestLegacy(formData, userEmail);
  
  try {
    const result = await currentLegacyScreeningRequest;
    return result;
  } finally {
    // Clear the current request when done
    currentLegacyScreeningRequest = null;
  }
}

async function performScreeningRequestLegacy(formData: ScreeningFormData, userEmail: string): Promise<ScreeningResponseWithSession> {
  try {
    const response = await fetch('/api/stock-screening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        userEmail,
      }),
    });

    console.log('Screening response status:', response.status);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('Screening response error text:', errorText);
        
        // Try to parse as JSON to get structured error info
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            throw new Error(errorData.error);
          }
        } catch {
          // If not JSON, use the raw text
        }
        
        throw new Error(`Screening failed (${response.status}): ${errorText}`);
      } catch (parseError) {
        throw new Error(`Screening failed (${response.status}): Unable to read error details`);
      }
    }

    let data;
    try {
      data = await response.json();
      console.log('Screening response data:', data);
    } catch (jsonError) {
      console.error('Failed to parse screening response as JSON:', jsonError);
      throw new Error('The screening service returned invalid data. Please try again.');
    }
    
    // Check if this requires polling (large batches)
    if (data.requiresPolling) {
      console.log('Large batch detected, starting polling...');
      return await pollScreeningStatus(formData, userEmail);
    }
    
    return data as ScreeningResponseWithSession;
  } catch (error) {
    console.error('Screening API Error:', error);
    throw error;
  }
}

async function pollScreeningStatus(formData: ScreeningFormData, userEmail: string): Promise<ScreeningResponseWithSession> {
  const maxAttempts = 30; // 5 minutes with 10-second intervals (reduced from 60 attempts)
  let attempts = 0;
  
  console.log(`Starting polling for ${formData.batchSize} stocks, max attempts: ${maxAttempts}`);
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Polling attempt ${attempts}/${maxAttempts}`);
    
    try {
      // Add a delay between attempts to prevent overwhelming the server
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds instead of 5
      }
      
      const response = await fetch('/api/stock-screening/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          maxStocks: formData.batchSize,
          userEmail,
          jobId: `screening-${Date.now()}-${attempts}` // Unique job ID for each attempt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status polling error:', errorText);
        
        // If it's a 524 timeout, continue polling
        if (response.status === 524) {
          console.log('Still processing (524 timeout), continuing to poll...');
          continue;
        }
        
        // If it's a 404 (webhook not registered in test mode), continue polling
        if (response.status === 404) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message && errorData.message.includes('not registered')) {
              console.log('n8n test mode limitation - continuing to poll...');
              continue;
            }
                  } catch {
          // Continue with normal error handling
        }
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
        console.log('Status polling response:', data);
      } catch (jsonError) {
        console.error('Failed to parse status response as JSON:', jsonError);
        
        // For polling, if we can't parse JSON, it might mean the process is still running
        console.log('Status response not valid JSON - continuing to poll...');
        continue;
      }
      
      // Check if we got a successful response with results
      if (data.success && data.results && data.results.length > 0) {
        console.log('Screening completed successfully with results!');
        return data as ScreeningResponseWithSession;
      }
      
      if (data.status === 'completed') {
        console.log('Screening completed!');
        return data as ScreeningResponseWithSession;
      }
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Screening failed');
      }
      
      // Still processing, continue polling
      console.log('Still processing, continuing to poll...');
      
    } catch (error) {
      console.error('Polling error:', error);
      
      // If it's a fatal error, stop polling
      if (error instanceof Error) {
        if (error.message.includes('Failed to check screening status') || 
            error.message.includes('Screening failed')) {
          throw error;
        }
      }
      
      // For other errors, continue polling
      console.log('Non-fatal error, continuing to poll...');
    }
  }
  
  throw new Error('Screening timed out after 5 minutes of polling');
}
