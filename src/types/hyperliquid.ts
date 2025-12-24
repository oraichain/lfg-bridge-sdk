import {
  BridgeConfig,
  DepositParams,
  DepositResult,
  SendInternalResult,
  SendParams,
  SendResult,
} from "./bridge";

export interface HyperliquidConfig extends BridgeConfig {
  bridgeContract: string;
}

export interface HyperliquidSendParams extends SendParams {}

export interface HyperliquidSendResult extends SendResult {}

export interface HyperliquidSendInternalResult extends SendInternalResult {}

export interface HyperliquidDepositParams
  extends Omit<DepositParams, "receiver"> {}

export interface HyperliquidDepositResult extends DepositResult {}
