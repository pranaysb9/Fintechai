// app/api/rag/route.ts

import { NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────────
// Fetch real-time data from Finnhub
// ──────────────────────────────────────────────
async function getStockData(symbol: string) {
  console.log(`Fetching Finnhub data for ${symbol}...`);
  const quoteRes = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
  );
  if (!quoteRes.ok) throw new Error(`Finnhub quote failed: ${quoteRes.status}`);
  const quote = await quoteRes.json();
  if (!quote.c || quote.c === 0) throw new Error("Invalid stock data");

  let profile = null;
  try {
    const profileRes = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );
    if (profileRes.ok) profile = await profileRes.json();
  } catch (e) {
    console.warn("Could not fetch profile:", e);
  }

  return {
    symbol,
    currentPrice: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    companyName: profile?.name || symbol,
    currency: profile?.currency || "USD",
    exchange: profile?.exchange || "N/A",
    marketCap: profile?.marketCapitalization || "N/A",
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────
// OpenAI Chat API call with PROPER SSE streaming
// ──────────────────────────────────────────────
async function getAIResponse(
  context: string,
  userQuestion: string
): Promise<ReadableStream> {
  console.log("Trying OpenAI Chat API...");
  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a professional financial analyst. Use only the provided real-time data to answer the user's question concisely and accurately.\n\n${context}`,
            },
            { role: "user", content: userQuestion },
          ],
          max_tokens: 500,
          temperature: 0.3,
          stream: true, // ENABLE streaming from OpenAI
        }),
      }
    );

    console.log("OpenAI response status:", openaiRes.status);

    if (!openaiRes.ok) {
      const errTxt = await openaiRes.text();
      console.error("OpenAI API error:", errTxt);
      throw new Error(`OpenAI API failed: ${openaiRes.status}`);
    }

    if (!openaiRes.body) {
      throw new Error("OpenAI response body is null");
    }

    // Return the OpenAI stream directly
    return openaiRes.body;
  } catch (err) {
    console.error("API call failed:", err);
    console.log("Using local fallback stream");

    // Fallback with proper SSE format
    const fallbackText =
      "The AI service is currently unavailable. Based on the data, the stock appears stable. (Fallback response).";

    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send the fallback text as a single SSE event
        const sseData = `data: ${JSON.stringify({
          choices: [
            {
              delta: {
                content: fallbackText,
              },
            },
          ],
        })}\n\n`;

        controller.enqueue(encoder.encode(sseData));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
  }
}

// ──────────────────────────────────────────────
// Main API route handler with PROPER SSE
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { question, symbol = "AAPL" } = await request.json();
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    console.log(`Processing RAG for ${symbol}:`, question);

    // 1. Fetch real-time stock data
    const stockData = await getStockData(symbol);
    console.log("Stock data fetched successfully");

    // 2. Build context
    const context = `
REAL-TIME STOCK DATA for ${stockData.symbol}:
- Company: ${stockData.companyName}
- Current Price: $${stockData.currentPrice}
- Change: ${stockData.change >= 0 ? "+" : ""}${stockData.change} (${
      stockData.changePercent
    }%)
- Day Range: $${stockData.low} - $${stockData.high}
- Previous Close: $${stockData.previousClose}
- Market Cap: ${
      typeof stockData.marketCap === "number"
        ? `$${(stockData.marketCap / 1_000_000_000).toFixed(2)}B`
        : stockData.marketCap
    }
- Exchange: ${stockData.exchange}
- Timestamp: ${new Date(stockData.timestamp).toLocaleString()}
`;

    console.log("Built context, getting AI response...");

    // 3. Get AI response stream from OpenAI (with proper streaming)
    const openAIStream = await getAIResponse(context, question);

    // 4. Create a transform stream to ensure proper SSE format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // OpenAI already sends proper SSE format, so we can pass it through
        controller.enqueue(chunk);
      },
    });

    // 5. Return streaming response with proper headers
    return new Response(openAIStream.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Encoding": "none",
        "X-Accel-Buffering": "no", // Disable buffering for proper streaming
      },
    });
  } catch (err) {
    console.error("RAG route error:", err);

    // Fallback with proper SSE format
    const fallbackStr =
      "An error occurred. Based on available data, the stock is trading near its daily range with moderate volatility.";

    const fallbackStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send error as proper SSE
        const sseData = `data: ${JSON.stringify({
          choices: [
            {
              delta: {
                content: fallbackStr,
              },
            },
          ],
        })}\n\n`;

        controller.enqueue(encoder.encode(sseData));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
}
