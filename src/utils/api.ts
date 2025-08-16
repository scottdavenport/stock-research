import { StockFormData, StockResponse, ScreeningFormData, ScreeningResponse } from '../types/stock';

export async function researchStock(formData: StockFormData): Promise<StockResponse> {
  console.log('Making request to local API proxy');
  console.log('Request payload:', { symbol: formData.symbol });
  
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
  console.log('Making screening request to n8n');
  console.log('Request payload:', formData);
  
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
    
    return data as ScreeningResponse;
  } catch (error) {
    console.error('Screening API Error:', error);
    throw error;
  }
}
