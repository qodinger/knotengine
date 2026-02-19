import { Currency } from "@knotengine/types";

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
   * Uses CoinGecko API (Free Tier).
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

    // 2. Fetch new price
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API Error: ${response.statusText}`);
      }

      const data = (await response.json()) as PriceData;
      const price = data[coinId]?.usd;

      if (!price) {
        throw new Error(`Price not found for ${coinId}`);
      }

      // 3. Update Cache
      this.cache[coinId] = { price, timestamp: now };
      return price;
    } catch (error) {
      console.error("PriceOracle Error:", error);
      // Fallback: If cache exists (even if stale), return it.
      if (this.cache[coinId]) {
        console.warn("Returning stale price due to API failure.");
        return this.cache[coinId].price;
      }
      throw error;
    }
  }

  private static mapCurrencyToCoinGeckoId(currency: Currency): string {
    switch (currency) {
      case "BTC":
        return "bitcoin";
      case "LTC":
        return "litecoin";
      case "USDT_ERC20":
      case "USDT_POLYGON":
        return "tether";
      default:
        throw new Error(`Unsupported currency: ${currency}`);
    }
  }
}
