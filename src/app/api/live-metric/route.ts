// app/api/live-metric/route.ts
import { NextRequest } from 'next/server';

// Global state for live metrics (in production, use Redis)
interface LiveMetrics {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  lastUpdated: string;
}

let liveMetrics: LiveMetrics = {
  currentPrice: 0,
  priceChange: 0,
  priceChangePercent: 0,
  volume: 0,
  lastUpdated: new Date().toISOString()
};

let clients: Set<ReadableStreamDefaultController> = new Set();

// Export the update function directly
export function updateLiveMetrics(newMetrics: Partial<LiveMetrics>) {
  liveMetrics = { 
    ...liveMetrics, 
    ...newMetrics, 
    lastUpdated: new Date().toISOString() 
  };
  
  // Broadcast to all connected clients
  clients.forEach(controller => {
    try {
      controller.enqueue(`data: ${JSON.stringify(liveMetrics)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE:', error);
      clients.delete(controller);
    }
  });
}

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);
      
      // Send initial data immediately
      controller.enqueue(`data: ${JSON.stringify(liveMetrics)}\n\n`);
      
      // Remove client when connection closes
      request.signal.addEventListener('abort', () => {
        clients.delete(controller);
      });
    },
    cancel() {
      // Clean up when stream is cancelled
      clients.forEach(controller => {
        try {
          controller.close();
        } catch (error) {
          // Ignore errors during cleanup
        }
      });
      clients.clear();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}