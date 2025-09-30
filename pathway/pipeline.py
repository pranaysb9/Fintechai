import os
from datetime import datetime
from dotenv import load_dotenv
import pathway as pw
import requests

# Load API key from .env file
load_dotenv()
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")

# Define a function to fetch data from Finnhub for a given stock symbol
def fetch_finnhub_data(symbol):
    """
    Fetches quote and profile data for a stock symbol from Finnhub.
    This function will be applied by Pathway to each incoming symbol request.
    """
    try:
        # Fetch real-time quote data
        quote_url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
        quote_res = requests.get(quote_url)
        quote_res.raise_for_status()
        quote = quote_res.json()

        if not quote or quote.get("c") == 0:
            print(f"Warning: No valid quote data for {symbol}")
            return None

        # Fetch company profile data
        profile_url = f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={FINNHUB_API_KEY}"
        profile_res = requests.get(profile_url)
        profile_res.raise_for_status()
        profile = profile_res.json()

        # Construct the final data object, matching the schema expected by the Next.js app
        return {
            "symbol": symbol,
            "currentPrice": quote.get("c", 0.0),
            "change": quote.get("d", 0.0),
            "changePercent": quote.get("dp", 0.0),
            "high": quote.get("h", 0.0),
            "low": quote.get("l", 0.0),
            "open": quote.get("o", 0.0),
            "previousClose": quote.get("pc", 0.0),
            "companyName": profile.get("name", symbol),
            "currency": profile.get("currency", "USD"),
            "exchange": profile.get("exchange", "N/A"),
            "marketCap": profile.get("marketCapitalization", 0.0),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

# The main function to define and run the Pathway pipeline
def run_pipeline():
    # Define an input connector that listens for HTTP POST requests containing a stock symbol
    symbol_input = pw.io.http.read(
        "/",
        format="json",
        schema=pw.Schema(symbol=str), # Expects JSON like {"symbol": "AAPL"}
        autocommit_duration_ms=1000,
    )

    # Use a transformation to fetch data from Finnhub for each requested symbol.
    # This is the core of our real-time ETL (Extract, Transform, Load) logic.
    processed_data = symbol_input.select(
        data=pw.apply(fetch_finnhub_data, pw.this.symbol)
    ).filter(pw.this.data is not None) # Filter out any failed requests

    # Unpack the fetched data to create a clean table structure
    stock_data_table = processed_data.select(
        pw.this.data.symbol,
        pw.this.data.currentPrice,
        pw.this.data.change,
        pw.this.data.changePercent,
        pw.this.data.high,
        pw.this.data.low,
        pw.this.data.open,
        pw.this.data.previousClose,
        pw.this.data.companyName,
        pw.this.data.currency,
        pw.this.data.exchange,
        pw.this.data.marketCap,
        pw.this.data.timestamp,
    )

    # Expose the processed data through a REST API endpoint.
    # Our Next.js app will now fetch data from this endpoint.
    pw.io.http.write(stock_data_table, "/stock-data")

    # Run the pipeline. This starts the server.
    print("Starting Pathway pipeline... API will be available at http://localhost:8080")
    pw.run()

if _name_ == "_main_":
    run_pipeline()