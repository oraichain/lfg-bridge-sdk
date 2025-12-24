import { ethers } from "ethers";

import { HYPERLIQUID_CONFIG } from "../configs/hyperliquid";
import {
  CheckingDepositProgressParams,
  CheckingDepositProgressResult,
  CheckingWithdrawProgressParams,
  CheckingWithdrawProgressResult,
  WithdrawParams,
  WithdrawResult,
  HyperliquidConfig,
  HyperliquidDepositParams,
  HyperliquidDepositResult,
  HyperliquidSendInternalResult,
  HyperliquidSendParams,
  HyperliquidSendResult,
} from "../types";
import { Bridge } from "./Bridge";

export class HyperliquidBridge extends Bridge {
  constructor(rpcUrl: string, privateKey: string) {
    super(rpcUrl, privateKey);

    // init hyperliquid config
    this.config = {
      usdcContract: HYPERLIQUID_CONFIG.usdcContract,
      chainId: HYPERLIQUID_CONFIG.chainId,
      rpcUrl,
      bridgeContract: HYPERLIQUID_CONFIG.bridgeContract,
    } as HyperliquidConfig;

    // init usdc contract
    this.usdcContract = new ethers.Contract(
      this.config.usdcContract,
      HYPERLIQUID_CONFIG.usdcAbi,
      this.provider
    );
  }

  public async send(
    params: HyperliquidSendParams
  ): Promise<HyperliquidSendResult> {
    try {
      const result = await this.sendInternal(params.toAddress, params.amount);

      return result;
    } catch (error) {
      console.error("Send failed:", error);

      throw error;
    }
  }

  public async deposit(
    params: HyperliquidDepositParams
  ): Promise<HyperliquidDepositResult> {
    try {
      // check min-deposit is 5 USDC
      if (params.amount < 5) {
        throw new Error("Minimum deposit is 5 USDC");
      }

      // send usdc to bridge contract
      const result = await this.sendInternal(
        (this.config as HyperliquidConfig).bridgeContract,
        params.amount
      );

      return {
        ...result,
        status: "completed",
      };
    } catch (error) {
      console.error("Deposit failed:", error);

      throw error;
    }
  }

  public async checkingDepositProgress(
    params: CheckingDepositProgressParams
  ): Promise<CheckingDepositProgressResult> {
    return;
  }

  public async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    return;
  }

  public async checkingWithdrawProgress(
    params: CheckingWithdrawProgressParams
  ): Promise<CheckingWithdrawProgressResult> {
    return;
  }

  private async sendInternal(
    toAddress: string,
    amount: number
  ): Promise<HyperliquidSendInternalResult> {
    try {
      // connect contracts to wallet
      const usdcContractWithSigner = this.usdcContract.connect(this.signer);

      // Get USDC decimals
      const decimals = await (usdcContractWithSigner as any).decimals();
      // Convert amount to proper units
      const amountInUnits = ethers.parseUnits(amount.toString(), decimals);

      // Check USDC balance
      const balance = await (usdcContractWithSigner as any).balanceOf(
        this.signer.address
      );
      if (balance < amountInUnits) {
        throw new Error(
          `Insufficient USDC balance. Required: ${ethers.formatUnits(
            amountInUnits,
            decimals
          )}, Available: ${ethers.formatUnits(balance, decimals)}`
        );
      }

      // send USDC to intent address
      const tx = await (usdcContractWithSigner as any).transfer(
        toAddress,
        amountInUnits
      );
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      return {
        txHash: tx.hash,
        amount: amount.toString(),
        blockHeight: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("Send internal failed:", error);

      throw error;
    }
  }
}
