import { ApiClient } from ".";

export interface NextNonce {
  account_index: number;
  api_key_index: number;
  nonce: number;
}

export interface TxHash {
  hash?: string;
  tx_hash?: string; // API returns tx_hash with underscore
  code?: number;
  message?: string;
  predicted_execution_time_ms?: number;
}

export class TransactionApi {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  public async getNextNonce(
    accountIndex: number,
    apiKeyIndex: number
  ): Promise<NextNonce> {
    const response = await this.client.get<NextNonce>("/api/v1/nextNonce", {
      account_index: accountIndex,
      api_key_index: apiKeyIndex,
    });
    return response.data;
  }

  public async sendTxWithIndices(
    txType: number,
    txInfo: string,
    accountIndex: number,
    apiKeyIndex: number
  ): Promise<TxHash> {
    const params = new URLSearchParams();
    params.append("tx_type", txType.toString());
    params.append("tx_info", txInfo);
    params.append("account_index", accountIndex.toString());
    params.append("api_key_index", apiKeyIndex.toString());

    const response = await this.client.post<TxHash>("/api/v1/sendTx", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  }
}
