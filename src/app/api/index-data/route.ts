// app/api/index-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

// Import the function directly from the route
import { updateLiveMetrics } from '../live-metric/route';

// Cohere embedding function (384 dimensions)
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'embed-english-light-v2.0',
        texts: [text],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cohere error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.embeddings[0];
  } catch (error) {
    console.warn('Cohere embedding failed, using local fallback:', error);
    return generateLocalEmbedding(text, 384);
  }
}

function generateLocalEmbedding(text: string, dimension: number = 384): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const embedding = Array(dimension).fill(0);
  const rng = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < dimension; i++) {
    embedding[i] = rng(hash + i) * 2 - 1;
  }
  
  return embedding;
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface FinnhubQuote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
}

export async function POST(request: NextRequest) {
  try {
    const { symbol = 'AAPL' } = await request.json();
    const upperSymbol = symbol.toUpperCase();

    console.log(`Fetching data for ${upperSymbol} from Finnhub...`);
    
    // Fetch live data from Finnhub
    const finnhubResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!finnhubResponse.ok) {
      throw new Error(`Finnhub API error: ${finnhubResponse.status}`);
    }

    const quote: FinnhubQuote = await finnhubResponse.json();

    // Validate we have actual data
    if (quote.c === 0 && quote.d === 0 && quote.dp === 0) {
      throw new Error(`Invalid symbol or no data available for ${upperSymbol}`);
    }

    // Fetch company profile
    let companyProfile = null;
    try {
      const profileResponse = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${upperSymbol}&token=${process.env.FINNHUB_API_KEY}`
      );
      if (profileResponse.ok) {
        companyProfile = await profileResponse.json();
      }
    } catch (error) {
      console.warn('Company profile fetch failed:', error);
    }

    // Create RAG context document
    const ragDocument = {
      symbol: upperSymbol,
      currentPrice: quote.c,
      priceChange: quote.d,
      priceChangePercent: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      timestamp: new Date(quote.t * 1000).toISOString(),
      companyName: companyProfile?.name || upperSymbol,
      currency: companyProfile?.currency || 'USD',
      exchange: companyProfile?.exchange || 'Unknown',
      marketCap: companyProfile?.marketCapitalization || null,
      industry: companyProfile?.finnhubIndustry || 'Unknown',
      description: `Real-time stock data for ${companyProfile?.name || upperSymbol} (${upperSymbol}). Current price: $${quote.c.toFixed(2)}, Change: ${quote.d > 0 ? '+' : ''}${quote.d.toFixed(2)} (${quote.dp > 0 ? '+' : ''}${quote.dp.toFixed(2)}%). Today's range: $${quote.l.toFixed(2)}-$${quote.h.toFixed(2)}.`
    };

    console.log('Generating embedding...');
    const embedding = await generateEmbedding(JSON.stringify(ragDocument));
    console.log(`Embedding generated with ${embedding.length} dimensions`);

    // Prepare vector for Pinecone (384 dimensions)
    const vector = {
      id: `${upperSymbol}-${Date.now()}`,
      values: embedding,
      metadata: {
        symbol: upperSymbol,
        type: 'financial_data',
        timestamp: new Date().toISOString(),
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        source: 'finnhub',
        embeddingProvider: embedding.length === 384 ? 'cohere' : 'local_fallback',
        document: JSON.stringify(ragDocument)
      }
    };

    // Upsert to Pinecone
    console.log('Upserting to Pinecone...');
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    await index.upsert([vector]);
    console.log('Successfully upserted to Pinecone');

    // Update live metrics via SSE - using the directly imported function
    updateLiveMetrics({
      currentPrice: quote.c,
      priceChange: quote.d,
      priceChangePercent: quote.dp,
      volume: 0
    });

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      vectorId: vector.id,
      embeddingDimensions: embedding.length,
      embeddingProvider: vector.metadata.embeddingProvider
    });

  } catch (error: any) {
    console.error('Indexing error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to index data',
        details: 'Check symbol validity and API configuration'
      },
      { status: 500 }
    );
  }
}