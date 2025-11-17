import { ethers } from "ethers";

import { BridgeConfig, DepositParams, DepositResult } from "../types/bridge";

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

  public abstract deposit(params: DepositParams): Promise<DepositResult>;
}
