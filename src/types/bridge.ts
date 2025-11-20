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

export interface FastWithdrawParams {
  fromAccountIndex: number;
  apiKeyIndex: number;
  toAccountIndex: number;
  usdcAmount: number; // Amount in micro-USDC (6 decimals)
  fee: number; // Fee in micro-USDC (6 decimals)
  toAddress: string; // Ethereum address (will be converted to memo)
  expiredAt: number; // Unix timestamp in milliseconds
  nonce: number;
  sig: string; // Base64 encoded signature
  l1Sig: string; // Ethereum signature (hex string with 0x prefix)
  authorization: string; // Authorization token
}