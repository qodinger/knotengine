import { IBlockchainProvider } from "./provider-interface.js";
import { TatumProvider } from "./tatum-provider.js";
import { AlchemyProvider } from "./alchemy-provider.js";
import { ServiceCircuitBreaker } from "./circuit-breaker.js";

export class BlockchainProviderPool {
  private static instance: BlockchainProviderPool;
  private providers: IBlockchainProvider[] = [];

  private constructor() {
    this.providers.push(new TatumProvider());
    this.providers.push(new AlchemyProvider());
  }

  public static getInstance(): BlockchainProviderPool {
    if (!this.instance) {
      this.instance = new BlockchainProviderPool();
    }
    return this.instance;
  }

  /**
   * Attempts to subscribe to an address using available providers in the pool.
   * Uses circuit breakers to prevent cascading failures.
   *
   * @param useDualProvider - If true, subscribes to BOTH providers for redundancy (Pro/Enterprise)
   */
  public async subscribeAddress(
    address: string,
    chain: string,
    webhookUrl: string,
    useDualProvider: boolean = false,
  ): Promise<{ providerName: string; subscriptionId: string } | null> {
    if (useDualProvider) {
      // Professional/Enterprise: Subscribe to ALL providers for redundancy
      const subscriptions: Array<{
        providerName: string;
        subscriptionId: string;
      }> = [];

      for (const provider of this.providers) {
        const circuitState = ServiceCircuitBreaker.getState(provider.name);

        // Skip if circuit is open (service is unhealthy)
        if (circuitState === "OPEN") {
          console.warn(`⚠️ Skipping ${provider.name} - circuit is OPEN`);
          continue;
        }

        try {
          const subId = await ServiceCircuitBreaker.execute(
            provider.name,
            async () => {
              return await provider.subscribeAddress(
                address,
                chain,
                webhookUrl,
              );
            },
            async () => {
              // Fallback: return null if circuit is open
              return null;
            },
          );

          if (subId) {
            subscriptions.push({
              providerName: provider.name,
              subscriptionId: subId,
            });
            console.log(
              `✓ Dual-provider: ${provider.name} subscribed to ${address}`,
            );
          }
        } catch (err) {
          console.warn(
            `Provider ${provider.name} failed to subscribe (dual-mode):`,
            err,
          );
        }
      }

      // Return primary subscription (first successful one)
      return subscriptions.length > 0 ? subscriptions[0] : null;
    }

    // Starter: Single provider with fallback and circuit breaker
    for (const provider of this.providers) {
      const circuitState = ServiceCircuitBreaker.getState(provider.name);

      // Skip if circuit is open
      if (circuitState === "OPEN") {
        console.warn(`⚠️ Skipping ${provider.name} - circuit is OPEN`);
        continue;
      }

      try {
        const subId = await ServiceCircuitBreaker.execute(
          provider.name,
          async () => {
            return await provider.subscribeAddress(address, chain, webhookUrl);
          },
          async () => null, // Fallback
        );

        if (subId) {
          return { providerName: provider.name, subscriptionId: subId };
        }
      } catch {
        console.warn(
          `Provider ${provider.name} failed to subscribe. Trying next...`,
        );
      }
    }
    return null;
  }

  /**
   * Deletes a subscription from a specific provider.
   */
  public async deleteSubscription(
    providerName: string,
    subscriptionId: string,
  ) {
    const provider = this.providers.find((p) => p.name === providerName);
    if (provider) {
      try {
        await ServiceCircuitBreaker.execute(
          `${providerName}-delete`,
          async () => await provider.deleteSubscription(subscriptionId),
          async () => {}, // Fallback: silently succeed
        );
      } catch (err) {
        console.warn(
          `Failed to delete subscription from ${providerName}:`,
          err,
        );
      }
    }
  }

  /**
   * Gets health status for all providers.
   */
  public getProviderHealth(): Array<{
    name: string;
    state: string;
    stats: {
      state: string;
      failures: number;
      successes: number;
      rejects: number;
      timeouts: number;
      fallbacks: number;
    } | null;
  }> {
    return this.providers.map((provider) => ({
      name: provider.name,
      state: ServiceCircuitBreaker.getState(provider.name),
      stats: ServiceCircuitBreaker.getStats(provider.name),
    }));
  }
}
