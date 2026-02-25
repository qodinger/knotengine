import { Currency } from "@qodinger/knot-types";

interface PriceData {
  [currency: string]: {
    usd: number;
  };
}

export class PriceOracle {
  private static CACHE_TTL_MS = 60 * 1000; // 1 minute cache
  private static cache: {
    [key: string]: { price: number; timestamp: number };
  } = {};

  /**
   * Fetches the current price of a cryptocurrency in USD.
   * Primary: CoinGecko
   * Secondary (Failover): Binance
   */
  public static async getPrice(currency: Currency): Promise<number> {
    const coinId = this.mapCurrencyToCoinGeckoId(currency);
    const now = Date.now();

    // 1. Check Cache
    if (
      this.cache[coinId] &&
      now - this.cache[coinId].timestamp < this.CACHE_TTL_MS
    ) {
      return this.cache[coinId].price;
    }

    // 2. Fetch new price with Failover Logic
    try {
      // Try Source 1: CoinGecko
      return await this.fetchFromCoinGecko(currency);
    } catch (geckoError) {
      console.warn("CoinGecko failed, falling back to Binance...", geckoError);

      try {
        // Try Source 2: Binance
        return await this.fetchFromBinance(currency);
      } catch (binanceError) {
        console.error("Binance also failed:", binanceError);

        // Final Fallback: If cache exists (even if stale), return it.
        if (this.cache[coinId]) {
          console.warn("Returning stale price as absolute last resort.");
          return this.cache[coinId].price;
        }

        throw new Error(
          "Critical: All price feed providers are currently unavailable.",
        );
      }
    }
  }

  private static async fetchFromCoinGecko(currency: Currency): Promise<number> {
    const coinId = this.mapCurrencyToCoinGeckoId(currency);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API Error: ${response.statusText}`);
    }

    const data = (await response.json()) as PriceData;
    const price = data[coinId]?.usd;

    if (!price) {
      throw new Error(`Price not found for ${coinId} on CoinGecko`);
    }

    this.updateCache(coinId, price);
    return price;
  }

  private static async fetchFromBinance(currency: Currency): Promise<number> {
    const symbol = this.mapCurrencyToBinanceSymbol(currency);
    if (!symbol)
      throw new Error(`Currency ${currency} not supported on Binance`);

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    );

    if (!response.ok) {
      throw new Error(`Binance API Error: ${response.statusText}`);
    }

    const data = (await response.json()) as { symbol: string; price: string };
    const price = parseFloat(data.price);

    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price received from Binance: ${data.price}`);
    }

    const coinId = this.mapCurrencyToCoinGeckoId(currency);
    this.updateCache(coinId, price);
    return price;
  }

  private static updateCache(id: string, price: number) {
    this.cache[id] = { price, timestamp: Date.now() };
  }

  private static mapCurrencyToCoinGeckoId(currency: Currency): string {
    switch (currency) {
      case "BTC":
        return "bitcoin";
      case "LTC":
        return "litecoin";
      case "ETH":
        return "ethereum";
      case "USDT_ERC20":
      case "USDT_POLYGON":
        return "tether";
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  private static mapCurrencyToBinanceSymbol(currency: Currency): string | null {
    switch (currency) {
      case "BTC":
        return "BTCUSDT";
      case "LTC":
        return "LTCUSDT";
      case "ETH":
        return "ETHUSDT";
      case "USDT_ERC20":
      case "USDT_POLYGON":
        return "USDCUSDT"; // Use USDC/USDT for Tether relative price or just 1.0
      default:
        return null;
    }
  }
}
