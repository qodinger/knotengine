import CircuitBreaker, { Options } from "opossum";

/**
 * ⚡ Circuit Breaker for External Service Calls
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * when external services (blockchain providers, APIs) become unavailable.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests fail immediately
 * - HALF-OPEN: Testing if service has recovered
 */
export class ServiceCircuitBreaker {
  private static circuits: Map<string, CircuitBreaker> = new Map();

  /**
   * Gets or creates a circuit breaker for a specific service.
   *
   * @param serviceName - Unique identifier for the service (e.g., "tatum", "alchemy")
   * @param timeout - Timeout in milliseconds (default: 5000ms)
   * @param errorThreshold - Percentage of failures to trip circuit (default: 50%)
   * @param resetTimeout - Time before attempting reset (default: 30000ms)
   */
  public static getCircuit(
    serviceName: string,
    timeout: number = 5000,
    errorThreshold: number = 50,
    resetTimeout: number = 30000,
  ): CircuitBreaker {
    if (!this.circuits.has(serviceName)) {
      const options: Options = {
        timeout, // If function takes longer than this, it's considered a failure
        errorThresholdPercentage: errorThreshold, // Open circuit after this % failures
        resetTimeout, // Try again after this long
        volumeThreshold: 5, // Minimum requests before tripping
        rollingCountTimeout: 10000, // Window for tracking failures (10s)
      };

      const circuit = new CircuitBreaker(async (fn: () => Promise<any>) => {
        return await fn();
      }, options);

      // Log state changes
      circuit.on("open", () => {
        console.warn(
          `🚫 Circuit OPEN for ${serviceName} - Service unavailable`,
        );
      });

      circuit.on("close", () => {
        console.log(`✅ Circuit CLOSED for ${serviceName} - Service healthy`);
      });

      circuit.on("halfOpen", () => {
        console.log(
          `🟡 Circuit HALF-OPEN for ${serviceName} - Testing recovery`,
        );
      });

      circuit.on("fallback", (_result: any) => {
        console.warn(`🔄 Fallback triggered for ${serviceName}`);
      });

      circuit.on("reject", () => {
        console.warn(
          `⛔ Request rejected for ${serviceName} - Circuit is open`,
        );
      });

      this.circuits.set(serviceName, circuit);
    }

    return this.circuits.get(serviceName)!;
  }

  /**
   * Executes a function with circuit breaker protection.
   *
   * @param serviceName - Unique identifier for the service
   * @param fn - Async function to execute
   * @param fallback - Optional fallback function if circuit is open
   */
  public static async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuit(serviceName);

    try {
      // If fallback is provided, use it
      if (fallback) {
        circuit.fallback(fallback);
      }

      return (await circuit.fire(fn)) as T;
    } catch (error) {
      // Re-throw if it's not a circuit breaker error
      if ((circuit.status as unknown as string) === "CLOSED") {
        throw error;
      }

      // If circuit is open and no fallback, throw specific error
      throw new Error(
        `Service ${serviceName} is unavailable (circuit ${circuit.status})`,
      );
    }
  }

  /**
   * Manually opens a circuit (useful for maintenance or forced failover).
   */
  public static openCircuit(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.open();
      console.warn(`🚫 Manually opened circuit for ${serviceName}`);
    }
  }

  /**
   * Manually closes a circuit (useful for testing recovery).
   */
  public static closeCircuit(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.close();
      console.log(`✅ Manually closed circuit for ${serviceName}`);
    }
  }

  /**
   * Gets the current state of a circuit.
   */
  public static getState(
    serviceName: string,
  ): "OPEN" | "CLOSED" | "HALF_OPEN" | "UNKNOWN" {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return "UNKNOWN";
    return circuit.status as unknown as "OPEN" | "CLOSED" | "HALF_OPEN";
  }

  /**
   * Gets statistics for a circuit.
   */
  public static getStats(serviceName: string): {
    state: string;
    failures: number;
    successes: number;
    rejects: number;
    timeouts: number;
    fallbacks: number;
  } | null {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return null;

    const stats = circuit.stats;
    return {
      state: circuit.status as unknown as string,
      failures: stats.failures,
      successes: stats.successes,
      rejects: stats.rejects,
      timeouts: stats.timeouts,
      fallbacks: stats.fallbacks,
    };
  }

  /**
   * Shuts down all circuits (useful for cleanup).
   */
  public static shutdown(): void {
    for (const [name, circuit] of this.circuits.entries()) {
      circuit.shutdown();
      console.log(`🔌 Circuit shutdown for ${name}`);
    }
    this.circuits.clear();
  }
}
