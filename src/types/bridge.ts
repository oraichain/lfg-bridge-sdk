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

export interface WithdrawParams {
  amount: number;
}

export interface WithdrawResult {
  txHash: string;
  amount: string;
}

export interface CheckingDepositProgressParams {
  address: string;
}

export interface CheckingDepositProgressResult {
  status: string;
}

export interface CheckingWithdrawProgressParams {
  txHash: string;
}

export interface CheckingWithdrawProgressResult {
  status: number | "pending" | "confirmed" | "failed";
  hash: string;
  nonce: number;
  message: string;
}
