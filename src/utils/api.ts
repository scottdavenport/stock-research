import { StockFormData, StockResponse } from '../types/stock';

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
