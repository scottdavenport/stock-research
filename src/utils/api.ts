import { StockFormData, StockResponse, ScreeningFormData, ScreeningResponse } from '../types/stock';

// Request deduplication for both research and screening
let currentResearchRequest: Promise<StockResponse> | null = null;
let currentScreeningRequest: Promise<ScreeningResponse> | null = null;

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

export async function screenStocks(formData: ScreeningFormData): Promise<ScreeningResponse> {
  // If there's already a screening request in progress, return it
  if (currentScreeningRequest) {
    console.log('Screening request already in progress, returning existing promise');
    return currentScreeningRequest;
  }
  
  console.log('Making screening request to n8n');
  console.log('Request payload:', formData);
  
  // Create the screening request promise
  currentScreeningRequest = performScreeningRequest(formData);
  
  try {
    const result = await currentScreeningRequest;
    return result;
  } finally {
    // Clear the current request when done
    currentScreeningRequest = null;
  }
}

async function performScreeningRequest(formData: ScreeningFormData): Promise<ScreeningResponse> {
  try {
    const response = await fetch('/api/stock-screening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    console.log('Screening response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Screening response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Screening response data:', data);
    
    // Check if this requires polling (large batches)
    if (data.requiresPolling) {
      console.log('Large batch detected, starting polling...');
      return await pollScreeningStatus(formData);
    }
    
    return data as ScreeningResponse;
  } catch (error) {
    console.error('Screening API Error:', error);
    throw error;
  }
}

async function pollScreeningStatus(formData: ScreeningFormData): Promise<ScreeningResponse> {
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
          } catch (parseError) {
            // Continue with normal error handling
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Status polling response:', data);
      
      // Check if we got a successful response with results
      if (data.success && data.results && data.results.length > 0) {
        console.log('Screening completed successfully with results!');
        return data as ScreeningResponse;
      }
      
      if (data.status === 'completed') {
        console.log('Screening completed!');
        return data as ScreeningResponse;
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
