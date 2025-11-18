import {
  BridgeConfig,
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
