import { ethers } from "ethers";

import {
  BridgeConfig,
  CheckingDepositProgressParams,
  CheckingDepositProgressResult,
  CheckingWithdrawProgressParams,
  CheckingWithdrawProgressResult,
  DepositParams,
  DepositResult,
  SendParams,
  SendResult,
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
  // api client
  protected rpcUrl: string;

  constructor(rpcUrl: string, privateKey: string) {
    // init ethers provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // init signer wallet
    this.signer = new ethers.Wallet(privateKey, this.provider);

    // init rpc url
    this.rpcUrl = rpcUrl;
  }

  // send USDC for Arbitrum
  public abstract send(params: SendParams): Promise<SendResult>;

  // deposit USDC from Arbitrum to Dex chain
  public abstract deposit(params: DepositParams): Promise<DepositResult>;

  // checking deposit progress
  public abstract checkingDepositProgress(
    params: CheckingDepositProgressParams
  ): Promise<CheckingDepositProgressResult>;

  // withdraw USDC from Dex chain to Arbitrum
  public abstract withdraw(params: WithdrawParams): Promise<WithdrawResult>;

  // checking withdraw progress
  public abstract checkingWithdrawProgress(
    params: CheckingWithdrawProgressParams
  ): Promise<CheckingWithdrawProgressResult>;
}
