import {
  BridgeConfig,
  SendInternalResult,
  SendParams,
  SendResult,
} from "./bridge";

export interface HyperliquidConfig extends BridgeConfig {}

export interface HyperliquidSendParams extends SendParams {}

export interface HyperliquidSendResult extends SendResult {}

export interface HyperliquidSendInternalResult extends SendInternalResult {}
