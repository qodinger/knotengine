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
   */
  public async subscribeAddress(
    address: string,
    chain: string,
    webhookUrl: string,
  ): Promise<{ providerName: string; subscriptionId: string } | null> {
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
