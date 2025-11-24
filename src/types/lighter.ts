import {
  BridgeConfig,
  CheckingDepositProgressParams,
  CheckingDepositProgressResult,
  CheckingWithdrawProgressParams,
  CheckingWithdrawProgressResult,
  DepositParams,
  DepositResult,
  SendInternalResult,
  SendParams,
  SendResult,
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

export interface LighterSendInternalResult extends SendInternalResult {}

export interface LighterSendParams extends SendParams {}

export interface LighterSendResult extends SendResult {}

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
  account_index: number;
  collateral: string;
  cross_asset_value: string;
  description: string;
  name: string;
}

export interface LighterAccount {
  code: number;
  message: string;
  l1_address: string;
  accounts: LighterSubAccount[];
}

export interface LighterApiKeys {
  code: number;
  api_keys: LighterApiKeyInfo[];
}

export interface LighterApiKeyInfo {
  account_index: number;
  api_key_index: number;
  nonce: number;
  public_key: string;
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
