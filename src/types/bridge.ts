export interface BridgeConfig {
  usdcContract: string;
  rpcUrl: string;
  chainId: string;
}

export interface DepositParams {
  amount: number;
  gasPrice?: string;
  gasLimit?: string;
}

export interface DepositResult {
  txHash: string;
  amount: string;
  status: string;
  blockHeight?: number;
  gasUsed?: string;
}
