// Nonce caching system to reduce API calls and improve performance
export interface NonceInfo {
  nonce: number;
  timestamp: number;
  apiKeyIndex: number;
}

export class NonceCache {
  private cache = new Map<number, NonceInfo[]>();
  private lastFetch = 0;
  private maxCacheAge = 30_000; // 30 seconds
  private fetchPromise: Promise<void> | null = null;
  private batchSize = 20; // Pre-fetch 20 nonces at a time (was 10, now 20 for multiple markets)

  constructor(
    private fetchNonceCallback: (
      apiKeyIndex: number,
      count: number
    ) => Promise<number[]>
  ) {}

  async getNextNonce(apiKeyIndex: number): Promise<number> {
    const nonces = this.cache.get(apiKeyIndex);

    // If no cached nonces or cache is empty, fetch new batch
    if (!nonces || nonces.length === 0 || this.isCacheExpired()) {
      await this.refreshNonces(apiKeyIndex);
    }

    const cachedNonces = this.cache.get(apiKeyIndex);
    if (!cachedNonces || cachedNonces.length === 0) {
      throw new Error("Failed to get nonce from cache");
    }

    // Return the first nonce and remove it from cache
    const nonceInfo = cachedNonces.shift()!;

    // Update the cache with the remaining nonces
    this.cache.set(apiKeyIndex, cachedNonces);

    // If cache is getting low, pre-fetch more nonces
    if (cachedNonces.length <= 2) {
      this.refreshNonces(apiKeyIndex).catch(() => {});
    }

    return nonceInfo.nonce;
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.lastFetch > this.maxCacheAge;
  }

  async refreshNonces(apiKeyIndex: number): Promise<void> {
    // Prevent concurrent fetches
    if (this.fetchPromise) {
      await this.fetchPromise;
      return;
    }

    this.fetchPromise = this.doRefreshNonces(apiKeyIndex);

    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async doRefreshNonces(apiKeyIndex: number): Promise<void> {
    try {
      const newNonces = await this.fetchNonceCallback(
        apiKeyIndex,
        this.batchSize
      );

      const nonceInfos: NonceInfo[] = newNonces.map((nonce) => ({
        nonce,
        timestamp: Date.now(),
        apiKeyIndex,
      }));

      this.cache.set(apiKeyIndex, nonceInfos);
      this.lastFetch = Date.now();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Acknowledge failure and rollback nonce
   */
  acknowledgeFailure(apiKeyIndex: number): void {
    const nonces = this.cache.get(apiKeyIndex);
    if (nonces && nonces.length > 0) {
      // Rollback the last used nonce by adding it back to the front
      const lastNonce = nonces[0];
      if (lastNonce) {
        nonces.unshift({
          nonce: lastNonce.nonce - 1,
          timestamp: Date.now(),
          apiKeyIndex,
        });
        this.cache.set(apiKeyIndex, nonces);
      }
    }
  }
}
