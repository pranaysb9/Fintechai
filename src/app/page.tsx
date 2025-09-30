'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Search, BrainCircuit, Bot, X } from 'lucide-react';

// --- DATA ---
const top100Companies = [
  { symbol: 'AAPL', name: 'Apple Inc.' }, { symbol: 'MSFT', name: 'Microsoft Corporation' }, { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)' }, { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)' }, { symbol: 'AMZN', name: 'Amazon.com, Inc.' }, { symbol: 'NVDA', name: 'NVIDIA Corporation' }, { symbol: 'META', name: 'Meta Platforms, Inc.' }, { symbol: 'TSLA', name: 'Tesla, Inc.' }, { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.' }, { symbol: 'LLY', name: 'Eli Lilly and Company' }, { symbol: 'V', name: 'Visa Inc.' }, { symbol: 'JPM', name: 'JPMorgan Chase & Co.' }, { symbol: 'WMT', name: 'Walmart Inc.' }, { symbol: 'XOM', name: 'Exxon Mobil Corporation' }, { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' }, { symbol: 'MA', name: 'Mastercard Incorporated' }, { symbol: 'JNJ', name: 'Johnson & Johnson' }, { symbol: 'PG', name: 'The Procter & Gamble Company' }, { symbol: 'AVGO', name: 'Broadcom Inc.' }, { symbol: 'ORCL', name: 'Oracle Corporation' }, { symbol: 'HD', name: 'The Home Depot, Inc.' }, { symbol: 'CVX', name: 'Chevron Corporation' }, { symbol: 'MRK', name: 'Merck & Co., Inc.' }, { symbol: 'ABBV', name: 'AbbVie Inc.' }, { symbol: 'COST', name: 'Costco Wholesale Corporation' }, { symbol: 'PEP', name: 'PepsiCo, Inc.' }, { symbol: 'ADBE', name: 'Adobe Inc.' }, { symbol: 'KO', name: 'The Coca-Cola Company' }, { symbol: 'BAC', name: 'Bank of America Corporation' }, { symbol: 'CRM', name: 'Salesforce, Inc.' }, { symbol: 'MCD', name: 'McDonald\'s Corporation' }, { symbol: 'ACN', name: 'Accenture plc' }, { symbol: 'PFE', name: 'Pfizer Inc.' }, { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' }, { symbol: 'CSCO', name: 'Cisco Systems, Inc.' }, { symbol: 'LIN', name: 'Linde plc' }, { symbol: 'ABT', name: 'Abbott Laboratories' }, { symbol: 'WFC', name: 'Wells Fargo & Company' }, { symbol: 'DHR', name: 'Danaher Corporation' }, { symbol: 'VZ', name: 'Verizon Communications Inc.' }, { symbol: 'INTC', name: 'Intel Corporation' }, { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.' }, { symbol: 'DIS', name: 'The Walt Disney Company' }, { symbol: 'NEE', name: 'NextEra Energy, Inc.' }, { symbol: 'NKE', name: 'NIKE, Inc.' }, { symbol: 'CMCSA', name: 'Comcast Corporation' }, { symbol: 'PM', name: 'Philip Morris International Inc.' }, { symbol: 'TXN', name: 'Texas Instruments Incorporated' }, { symbol: 'UPS', name: 'United Parcel Service, Inc.' }, { symbol: 'BMY', name: 'Bristol-Myers Squibb Company' }, { symbol: 'RTX', name: 'RTX Corporation' }, { symbol: 'MS', name: 'Morgan Stanley' }, { symbol: 'HON', name: 'Honeywell International Inc.' }, { symbol: 'LOW', name: 'Lowe\'s Companies, Inc.' }, { symbol: 'UNP', name: 'Union Pacific Corporation' }, { symbol: 'SPGI', name: 'S&P Global Inc.' }, { symbol: 'INTU', name: 'Intuit Inc.' }, { symbol: 'AMGN', name: 'Amgen Inc.' }, { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.' }, { symbol: 'CAT', name: 'Caterpillar Inc.' }, { symbol: 'IBM', name: 'International Business Machines Corporation' }, { symbol: 'DE', name: 'Deere & Company' }, { symbol: 'BA', name: 'The Boeing Company' }, { symbol: 'COP', name: 'ConocoPhillips' }, { symbol: 'GE', name: 'General Electric Company' }, { symbol: 'NOW', name: 'ServiceNow, Inc.' }, { symbol: 'BKNG', name: 'Booking Holdings Inc.' }, { symbol: 'BLK', name: 'BlackRock, Inc.' }, { symbol: 'AMT', name: 'American Tower Corporation' }, { symbol: 'PLD', name: 'Prologis, Inc.' }, { symbol: 'T', name: 'AT&T Inc.' }, { symbol: 'C', name: 'Citigroup Inc.' }, { symbol: 'PYPL', name: 'PayPal Holdings, Inc.' }, { symbol: 'LMT', name: 'Lockheed Martin Corporation' }, { symbol: 'UBER', name: 'Uber Technologies, Inc.' }, { symbol: 'SYK', name: 'Stryker Corporation' }, { symbol: 'MDLZ', name: 'Mondelez International, Inc.' }, { symbol: 'GILD', name: 'Gilead Sciences, Inc.' }, { symbol: 'TJX', name: 'The TJX Companies, Inc.' }, { symbol: 'SCHW', name: 'The Charles Schwab Corporation' }, { symbol: 'CVS', name: 'CVS Health Corporation' }, { symbol: 'TMUS', name: 'T-Mobile US, Inc.' }, { symbol: 'ZTS', name: 'Zoetis Inc.' }, { symbol: 'AXP', name: 'American Express Company' }, { symbol: 'PGR', name: 'The Progressive Corporation' }, { symbol: 'CB', name: 'Chubb Limited' }, { symbol: 'CI', name: 'The Cigna Group' }, { symbol: 'MO', name: 'Altria Group, Inc.' }, { symbol: 'DUK', name: 'Duke Energy Corporation' }, { symbol: 'SO', name: 'The Southern Company' }, { symbol: 'MMC', name: 'Marsh & McLennan Companies, Inc.' }, { symbol: 'REGN', name: 'Regeneron Pharmaceuticals, Inc.' }, { symbol: 'CL', name: 'Colgate-Palmolive Company' }, { symbol: 'ADI', name: 'Analog Devices, Inc.' }, { symbol: 'ADP', name: 'Automatic Data Processing, Inc.' }, { symbol: 'ETN', name: 'Eaton Corporation plc' }, { symbol: 'HCA', name: 'HCA Healthcare, Inc.' }, { symbol: 'FIS', name: 'Fidelity National Information Services, Inc.' },
];

// --- TYPE DEFINITIONS ---
interface StockData {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  companyName: string;
  logo: string;
  high: number;
  low: number;
  open: number;
  marketCap: number;
}

// --- UI COMPONENTS ---
const StockCard = ({ data, isSelected, onClick }: { data: StockData; isSelected: boolean; onClick: () => void; }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border transition-all duration-300 flex items-center space-x-4 ${
      isSelected
        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
    }`}
  >
    <img src={data.logo || `https://placehold.co/40x40/0D1117/FFFFFF?text=${data.symbol.charAt(0)}`} alt={`${data.companyName} logo`} className="w-10 h-10 rounded-full bg-gray-700" onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/0D1117/FFFFFF?text=${data.symbol.charAt(0)}`; }}/>
    <div className="flex-1 text-left">
      <p className="font-bold text-white">{data.symbol}</p>
      <p className="text-xs text-gray-400 truncate">{data.companyName}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-white">${data.currentPrice.toFixed(2)}</p>
      <div className={`flex items-center justify-end space-x-1 text-xs ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {data.change >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
        <span>{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)</span>
      </div>
    </div>
  </button>
);

const SkeletonCard = () => (
    <div className="w-full p-4 rounded-xl border border-gray-800 bg-gray-800/50 flex items-center space-x-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="text-right space-y-2">
            <div className="h-4 bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-gray-700 rounded w-20 ml-auto"></div>
        </div>
    </div>
);

const QuickQuestionButton = ({ question, onClick }: { question: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/80 rounded-lg text-gray-300 hover:text-white transition-all text-sm backdrop-blur-sm border border-gray-700">
        {question}
    </button>
);

const PrimaryStatCard = ({ price, change, changePercent }: { price: number; change: number; changePercent: number; }) => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800/80 p-5 rounded-xl border border-gray-800 mb-4">
        <p className="text-sm text-gray-400 mb-1">Current Price</p>
        <div className="flex items-end space-x-4">
            <p className="text-4xl font-bold text-white tracking-tighter">${price.toFixed(2)}</p>
            <div className={`flex items-center space-x-1 pb-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                <span className="text-xl font-semibold">{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
            </div>
        </div>
    </div>
);

const StatCard = ({ title, value, unit = '' }: { title: string; value: number; unit?: string}) => (
    <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/80 backdrop-blur-sm">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-semibold text-white tracking-tight">
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{unit}
        </p>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function FinSightRAG() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const answerRef = useRef<HTMLDivElement>(null);

  // Initial display symbols
  const initialDisplaySymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];

  // Real Finnhub API data fetching
  const fetchStockDataBatch = async (symbols: string[]): Promise<Record<string, StockData>> => {
    const symbolsToFetch = symbols.filter(s => s && !stockData[s]);
    if (symbolsToFetch.length === 0) return {};

    const newStockData: Record<string, StockData> = {};
    
    try {
      for (const symbol of symbolsToFetch) {
        try {
          // Fetch quote data from Finnhub
          const quoteResponse = await fetch(`/api/finnhub/quote?symbol=${symbol}`);
          if (!quoteResponse.ok) {
            console.error(`Failed to fetch quote for ${symbol}`);
            continue;
          }
          const quoteData = await quoteResponse.json();

          // Fetch company profile
          const profileResponse = await fetch(`/api/finnhub/profile?symbol=${symbol}`);
          const profileData = profileResponse.ok ? await profileResponse.json() : {};

          const company = top100Companies.find(c => c.symbol === symbol) || { 
            symbol, 
            name: profileData.name || `${symbol} Company` 
          };

          newStockData[symbol] = {
            symbol,
            currentPrice: quoteData.c || 0,
            change: quoteData.d || 0,
            changePercent: quoteData.dp || 0,
            companyName: company.name,
            logo: profileData.logo || `https://placehold.co/40x40/0D1117/FFFFFF?text=${symbol.charAt(0)}`,
            high: quoteData.h || 0,
            low: quoteData.l || 0,
            open: quoteData.o || 0,
            marketCap: profileData.marketCapitalization || 0
          };
        } catch (err) {
          console.error(`Error fetching data for ${symbol}:`, err);
        }
      }
    } catch (err) {
      console.error('Error in batch stock fetch:', err);
    }
    
    return newStockData;
  };

  useEffect(() => {
    const initialFetch = async () => {
        setIsDataLoading(true);
        const data = await fetchStockDataBatch(initialDisplaySymbols);
        setStockData(data);
        setIsDataLoading(false);
    };
    initialFetch();

    // Refresh data periodically
    const interval = setInterval(async () => {
        if(Object.keys(stockData).length > 0) {
            const data = await fetchStockDataBatch(Object.keys(stockData));
            setStockData(currentData => ({...currentData, ...data}));
        }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer]);
  
  const handleSearchSelect = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    
    // Fetch data for newly selected stock if not already loaded
    if (!stockData[symbol]) {
      const newData = await fetchStockDataBatch([symbol]);
      setStockData(currentData => ({...currentData, ...newData}));
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return [];
    return top100Companies.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery]);

  const askQuestion = async () => {
    if (!question.trim() || isLoading) return;
    
    setIsLoading(true);
    setAnswer('');
    setError('');

    try {
      // Send both question AND the selected symbol to RAG API
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question.trim(),
          symbol: selectedSymbol // This is crucial - sending the selected ticker
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from server');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
            if (line.includes('[DONE]')) break;
            if (line.startsWith('data: ')) {
                const jsonStr = line.replace('data: ', '');
                try {
                    const parsed = JSON.parse(jsonStr);
                    const textChunk = parsed.choices[0]?.delta?.content || "";
                    setAnswer(prev => prev + textChunk);
                } catch (e) {
                    console.error("Failed to parse stream chunk:", e);
                }
            }
        }
      }
    } catch (e: any) {
      setError(e.message);
      console.error('RAG API Error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
    setTimeout(() => document.getElementById('ask-ai-button')?.click(), 100);
  };
  
  const selectedStockDetails = stockData[selectedSymbol];
  const displayedStocks = Object.values(stockData).sort((a,b) => a.symbol.localeCompare(b.symbol));

  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-sans">
      <div className="fixed inset-0 bg-[url('https://tailwindcss.com/_next/static/media/docs@30.8b9a76a2.avif')] bg-cover opacity-5"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-[#0D1117] to-[#0D1117]"></div>

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0D1117]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">FinSight AI</h1>
            </div>
            <p className="text-gray-400 text-sm hidden md:block">Real-time Financial Intelligence</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            AI Financial Analyst
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Search for a stock, ask a question, and get instant analysis powered by live market data and GPT-4.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT SIDEBAR --- */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-md relative">
                <h3 className="font-semibold mb-4 flex items-center"><Search className="w-4 h-4 mr-2 text-gray-400"/>Find a Company or Symbol</h3>
                <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="e.g., Apple or AAPL"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {filteredCompanies.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                       <ul className="max-h-60 overflow-y-auto">
                         {filteredCompanies.map(company => (
                             <li key={company.symbol}>
                                 <button onClick={() => handleSearchSelect(company.symbol)} className="w-full text-left px-4 py-3 hover:bg-gray-800 transition flex justify-between items-center">
                                    <span>{company.name}</span>
                                    <span className="text-xs text-gray-400 font-mono">{company.symbol}</span>
                                 </button>
                             </li>
                         ))}
                       </ul>
                    </div>
                )}
            </div>
            <div className="space-y-3 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isDataLoading && initialDisplaySymbols.map((s) => <SkeletonCard key={s} />)}
                {!isDataLoading && displayedStocks.map((stock) => (
                    <StockCard key={stock.symbol} data={stock} isSelected={selectedSymbol === stock.symbol} onClick={() => setSelectedSymbol(stock.symbol)} />
                ))}
            </div>
          </aside>

          {/* --- MAIN CHAT AREA --- */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-grow p-6 bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-md flex flex-col h-[78vh]">
                {selectedStockDetails ? (
                    <div className="flex-shrink-0 mb-4 pb-4 border-b border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center space-x-4">
                                <img src={selectedStockDetails.logo} alt={`${selectedStockDetails.companyName} logo`} className="w-12 h-12 rounded-full bg-gray-700" onError={(e) => { e.currentTarget.src = `https://placehold.co/48x48/0D1117/FFFFFF?text=${selectedStockDetails.symbol.charAt(0)}`; }}/>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedStockDetails.symbol}</h2>
                                    <p className="text-gray-400">{selectedStockDetails.companyName}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-green-400">
                               <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                               <span className="text-sm font-medium">Live Data</span>
                            </div>
                        </div>
                        <PrimaryStatCard 
                            price={selectedStockDetails.currentPrice} 
                            change={selectedStockDetails.change} 
                            changePercent={selectedStockDetails.changePercent}
                        />
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Day High" value={selectedStockDetails.high}/>
                            <StatCard title="Day Low" value={selectedStockDetails.low}/>
                            <StatCard title="Open Price" value={selectedStockDetails.open}/>
                            <StatCard title="Market Cap (B)" value={selectedStockDetails.marketCap / 1000000000} unit="B"/>
                         </div>
                    </div>
                ) : <div className="h-24"></div>}
              
                <div ref={answerRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {answer && (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                             <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mt-1">
                                    <Bot className="w-5 h-5"/>
                                </div>
                                <div className="flex-1 bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                    <p className="font-semibold text-white mb-2">FinSight AI Analysis</p>
                                    <div dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }}/>
                                    {isLoading && <div className="inline-block w-2 h-2 ml-1 bg-white rounded-full animate-pulse"></div>}
                                </div>
                            </div>
                        </div>
                    )}
                    {!answer && !isLoading && (
                        <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                          <div className="space-y-3 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Quick Analysis for {selectedSymbol}</h3>
                            {[
                                `Provide a summary of ${selectedSymbol}'s current performance.`,
                                `What is the short-term outlook for ${selectedSymbol}?`,
                                `Identify key support and resistance levels for ${selectedSymbol}.`,
                                `Is ${selectedSymbol} looking bullish or bearish today?`
                            ].map((q) => <QuickQuestionButton key={q} question={q} onClick={() => handleQuickQuestion(q)} />)}
                          </div>
                        </div>
                    )}
                </div>

              <div className="flex-shrink-0 mt-6">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder={`Ask a question about ${selectedSymbol}...`}
                  />
                  <button
                    id="ask-ai-button"
                    onClick={askQuestion}
                    disabled={isLoading || !question.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : <Sparkles className="w-5 h-5"/>}
                    <span className="ml-2">{isLoading ? 'Analyzing...' : 'Ask AI'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
            <div className="fixed bottom-4 right-4 bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl max-w-sm border border-red-500">
                <p className="font-bold">An Error Occurred</p>
                <p className="mt-1 text-sm">{error}</p>
                 <button onClick={() => setError('')} className="absolute top-2 right-2 text-red-200 hover:text-white">&times;</button>
            </div>
        )}
      </main>
    </div>
  );
}