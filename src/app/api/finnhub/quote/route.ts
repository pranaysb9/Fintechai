import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Finnhub API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got valid data from Finnhub
    if (data.c === 0 && data.d === null) {
      return NextResponse.json({ error: 'Stock symbol not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Finnhub quote error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data: ' + error.message }, { status: 500 });
  }
}