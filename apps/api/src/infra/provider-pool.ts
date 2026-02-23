import { IBlockchainProvider } from "./provider-interface";
import { TatumProvider } from "./tatum-provider";
import { AlchemyProvider } from "./alchemy-provider";

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
   * If the first provider fails, it automatically tries the next one.
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
        try {
          const subId = await provider.subscribeAddress(
            address,
            chain,
            webhookUrl,
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

    // Starter: Single provider with fallback
    for (const provider of this.providers) {
      try {
        const subId = await provider.subscribeAddress(
          address,
          chain,
          webhookUrl,
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
      await provider.deleteSubscription(subscriptionId);
    }
  }
}
