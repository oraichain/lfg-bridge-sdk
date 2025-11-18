import {
  BridgeConfig,
  CheckingDepositProgressParams,
  CheckingDepositProgressResult,
  CheckingWithdrawProgressParams,
  CheckingWithdrawProgressResult,
  DepositParams,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
} from "./bridge";

export interface LighterConfig extends BridgeConfig {}

export interface LighterDepositParams extends DepositParams {
  intentAddress?: string;
}

export interface LighterDepositResult extends DepositResult {}

export interface LighterWithdrawParams extends WithdrawParams {
  nonce?: number;
}

export interface LighterWithdrawResult extends WithdrawResult {
  txInfo: string;
}

export interface LighterCheckingDepositProgressParams
  extends CheckingDepositProgressParams {}

export interface LighterCheckingDepositProgressResult
  extends CheckingDepositProgressResult {}

export interface LighterCheckingWithdrawProgressParams
  extends CheckingWithdrawProgressParams {}

export interface LighterCheckingWithdrawProgressResult
  extends CheckingWithdrawProgressResult {}

export interface LighterSubAccount {
  code: number;
  message: string;
  account_type: number;
  index: number;
  l1_address: string;
  cancel_all_time: number;
  total_order_count: number;
  total_isolated_order_count: number;
  pending_order_count: number;
  available_balance: string;
  status: number;
  collateral: string;
}

export interface LighterAccount {
  code: number;
  message: string;
  l1_address: string;
  sub_accounts: LighterSubAccount[];
}

export interface LighterBridgeInfo {
  id: number;
  version: number;
  source: string;
  source_chain_id: string;
  fast_bridge_tx_hash: string;
  batch_claim_tx_hash: string;
  cctp_burn_tx_hash: string;
  amount: string;
  intent_address: string;
  status: string;
  step: string;
  description: string;
  created_at: number;
  updated_at: number;
  is_external_deposit: boolean;
}
