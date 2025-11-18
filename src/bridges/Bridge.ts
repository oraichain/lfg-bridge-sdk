import { ethers } from "ethers";

import {
  BridgeConfig,
  DepositParams,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
} from "../types";

export abstract class Bridge {
  // config for bridge, now only support bridge from Arbitrum
  protected config: BridgeConfig;
  // ethers provider
  protected provider: ethers.Provider;
  // usdc contract
  protected usdcContract: ethers.Contract;
  // signer wallet
  protected signer: ethers.Wallet;

  constructor(rpcUrl: string, privateKey: string) {
    // init ethers provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // init signer wallet
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  // deposit USDC from Arbitrum to Dex chain
  public abstract deposit(params: DepositParams): Promise<DepositResult>;

  // withdraw USDC from Dex chain to Arbitrum
  public abstract withdraw(params: WithdrawParams): Promise<WithdrawResult>;
}
