import { NonceCache } from ".";
import { ApiClient, TransactionApi } from "../services";

export interface NonceManagerConfig {
  accountIndex: number;
  apiKeyIndex: number;
  batchSize?: number;
  maxCacheAge?: number;
}

export class NonceManager {
  private nonceCache: NonceCache;
  private transactionApi: TransactionApi;
  private config: NonceManagerConfig;

  constructor(apiClient: ApiClient, config: NonceManagerConfig) {
    this.config = {
      batchSize: 20,
      maxCacheAge: 30_000, // 30 seconds
      ...config,
    };

    this.transactionApi = new TransactionApi(apiClient);

    this.nonceCache = new NonceCache(
      async (apiKeyIndex: number, count: number) => {
        const firstNonceResult = await this.transactionApi.getNextNonce(
          this.config.accountIndex,
          apiKeyIndex
        );

        const nonces: number[] = [];
        for (let i = 0; i < count; i++) {
          nonces.push(firstNonceResult.nonce + i);
        }
        return nonces;
      }
    );
  }

  /**
   * Acknowledge transaction failure and rollback nonce
   * This prevents nonce gaps when transactions fail
   */
  acknowledgeFailure(apiKeyIndex: number): void {
    this.nonceCache.acknowledgeFailure(apiKeyIndex);
  }
}
