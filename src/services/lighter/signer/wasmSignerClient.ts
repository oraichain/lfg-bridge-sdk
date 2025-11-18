import path from "path";

import {
  createLighterWasmSignerClient,
  LighterWasmManager,
  LighterWasmSignerClient,
} from ".";
import { NonceCache, NonceManager } from "../../../utils";
import { ApiClient, TransactionApi } from "../apis";

export interface LighterSignerConfig {
  /** Lighter Protocol API URL */
  url: string;
  /** Private key for signing transactions */
  privateKey: string;
  /** Account index (0 for master account) */
  accountIndex: number;
  /** API key index for authentication */
  apiKeyIndex: number;
  /** Optional WASM signer configuration */
  wasmConfig?: {
    wasmPath: string;
    wasmExecPath?: string;
  };
}

export interface WithdrawParams {
  usdcAmount: number;
  nonce?: number;
}

export class LighterSignerClient {
  // config
  private config: LighterSignerConfig;
  // lighter wasm signer client
  private wallet: LighterWasmSignerClient;
  private clientCreated: boolean = false;

  // nonce cache
  private nonceCache: NonceCache | null = null;
  // nonce manager
  private nonceManager?: NonceManager;

  // api services
  private apiClient: ApiClient;
  private transactionApi: TransactionApi;

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  static readonly USDC_TICKER_SCALE = 1e6;

  //tx type constants
  static readonly TX_TYPE_WITHDRAW = 13;

  constructor(config: LighterSignerConfig) {
    // validate config
    this.validateConfig(config);

    // init config
    this.config = config;

    // initialize api services
    this.apiClient = new ApiClient({ host: config.url });
    this.transactionApi = new TransactionApi(this.apiClient);

    // init nonce manager for automatic error recovery
    this.nonceManager = new NonceManager(this.apiClient, {
      accountIndex: config.accountIndex,
      apiKeyIndex: config.apiKeyIndex,
    });

    // init lighter wasm signer using manager
    if (config.wasmConfig) {
      const lighterWasmManager = LighterWasmManager.getInstance();

      if (lighterWasmManager.isReady()) {
        this.wallet = lighterWasmManager.getWasmClient();
      } else {
        this.wallet = createLighterWasmSignerClient(config.wasmConfig);
      }
    } else {
      throw new Error("wasmConfig must be provided.");
    }

    // Initialize optimization components
    this.initializeOptimizations();
  }

  private validateConfig(config: LighterSignerConfig): void {
    if (!config.url || typeof config.url !== "string") {
      throw new Error("URL is required and must be a string");
    }

    if (!config.privateKey || typeof config.privateKey !== "string") {
      throw new Error("Private key is required and must be a string");
    }

    if (typeof config.accountIndex !== "number" || config.accountIndex < 0) {
      throw new Error("Account index must be a non-negative number");
    }

    if (typeof config.apiKeyIndex !== "number" || config.apiKeyIndex < 0) {
      throw new Error("API key index must be a non-negative number");
    }

    if (!config.wasmConfig) {
      // Auto-fill defaults so consumers don't need to pass paths
      config.wasmConfig = {
        wasmPath: path.join(__dirname, "../wasm/lighter-signer.wasm"),
      } as any;
    }
  }

  /**
   * Initialize the signer (required for WASM signers)
   */
  async initialize(): Promise<void> {
    await (this.wallet as LighterWasmSignerClient).initialize();
  }

  async ensureWasmClient(): Promise<void> {
    if (this.clientCreated) {
      return;
    }

    await (this.wallet as LighterWasmSignerClient).createClient({
      url: this.config.url,
      privateKey: this.config.privateKey?.startsWith("0x")
        ? this.config.privateKey
        : `0x${this.config.privateKey}`,
      chainId: 304,
      apiKeyIndex: this.config.apiKeyIndex,
      accountIndex: this.config.accountIndex,
    } as any);

    this.clientCreated = true;
  }

  private initializeOptimizations(): void {
    // Initialize nonce cache first
    this.nonceCache = new NonceCache(
      async (apiKeyIndex: number, count: number) => {
        // Get a single nonce and then calculate sequential nonces
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
   * Withdraw USDC from L2 to L1 (L2-to-L1 withdrawal)
   * @param params - Withdraw parameters
   * @returns Promise resolving to [withdrawInfo, transactionHash, error]
   */
  async withdraw(
    params: WithdrawParams
  ): Promise<[any, string, string | null]> {
    try {
      // Get next nonce if not provided
      const nextNonce =
        params.nonce === undefined || params.nonce === -1
          ? await this.getNextNonce()
          : { nonce: params.nonce };

      const scaledAmount = Math.floor(
        params.usdcAmount * LighterSignerClient.USDC_TICKER_SCALE
      );

      // Use WASM signer
      const txInfo = await (
        this.wallet as LighterWasmSignerClient
      ).signWithdraw({
        usdcAmount: scaledAmount,
        nonce: nextNonce.nonce,
      });
      if (txInfo.error) {
        return [null, "", txInfo.error];
      }

      const txHash = await this.transactionApi.sendTxWithIndices(
        LighterSignerClient.TX_TYPE_WITHDRAW,
        txInfo.txInfo,
        this.config.accountIndex,
        this.config.apiKeyIndex
      );

      // Check for immediate errors in the response
      if (txHash.code && txHash.code !== 200) {
        this.acknowledgeFailure();
        return [null, "", txHash.message || "Transaction failed"];
      }

      return [
        JSON.parse(txInfo.txInfo),
        txHash.tx_hash || txHash.hash || "",
        null,
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return [null, "", errorMessage];
    }
  }

  private async getNextNonce(): Promise<{ nonce: number }> {
    // Use the pre-initialized nonce cache
    if (!this.nonceCache) {
      throw new Error("Nonce cache not initialized");
    }

    const nonce = await this.nonceCache.getNextNonce(this.config.apiKeyIndex);
    return { nonce };
  }

  /**
   * Acknowledge transaction failure
   */
  private acknowledgeFailure(): void {
    if (this.nonceManager) {
      this.nonceManager.acknowledgeFailure(this.config.apiKeyIndex);
    }
  }
}
