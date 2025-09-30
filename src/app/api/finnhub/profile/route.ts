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
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
    );
    
    if (!response.ok) {
      // If profile fails, return empty object instead of error
      return NextResponse.json({});
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Finnhub profile error:', error);
    // Return empty object instead of error for profile
    return NextResponse.json({});
  }
}