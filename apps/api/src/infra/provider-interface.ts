export interface IBlockchainProvider {
  name: string;
  /**
   * Subscribes to transaction notifications for a specific blockchain address.
   */
  subscribeAddress(
    address: string,
    chain: string,
    webhookUrl: string,
  ): Promise<string | null>;

  /**
   * Deletes a subscription when no longer needed.
   */
  deleteSubscription(subscriptionId: string): Promise<void>;
}
