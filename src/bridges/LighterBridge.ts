import { ethers } from "ethers";
import axios from "axios";

import { LIGHTER_CONFIG } from "../configs";
import {
  BridgeConfig,
  LighterAccount,
  LighterDepositParams,
  LighterDepositResult,
} from "../types";
import { Bridge } from ".";

export class LighterBridge extends Bridge {
  private apiUrl: string;

  constructor(rpcUrl: string, privateKey: string) {
    // init parent class
    super(rpcUrl, privateKey);

    // init api url
    this.apiUrl = LIGHTER_CONFIG.apiUrl;

    // init config
    this.config = {
      usdcContract: LIGHTER_CONFIG.usdcContract,
      chainId: LIGHTER_CONFIG.chainId,
      rpcUrl,
    } as BridgeConfig;

    // init usdc contract
    this.usdcContract = new ethers.Contract(
      this.config.usdcContract,
      LIGHTER_CONFIG.usdcAbi,
      this.provider
    );
  }

  public async deposit(
    params: LighterDepositParams
  ): Promise<LighterDepositResult> {
    try {
      // check min-deposit is 5 USDC
      if (params.amount < 5) {
        throw new Error("Minimum deposit is 5 USDC");
      }

      // check if account is exist
      const account = await this.getLighterAccounts(this.signer.address);
      if (!account) {
        // create lighter intent address
        const intentAddress = await this.createLighterIntentAddress();
        if (!intentAddress) {
          throw new Error("Create lighter intent address failed");
        }

        params.intentAddress = intentAddress;
      }

      // connect contracts to wallet
      const usdcContractWithSigner = this.usdcContract.connect(this.signer);

      // Get USDC decimals
      const decimals = await (usdcContractWithSigner as any).decimals();
      // Convert amount to proper units
      const amountInUnits = ethers.parseUnits(
        params.amount.toString(),
        decimals
      );

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
        params.intentAddress,
        amountInUnits
      );
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      return {
        txHash: tx.hash,
        amount: params.amount.toString(),
        status: "completed",
        blockHeight: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("Deposit failed:", error);

      throw error;
    }
  }

  private async getLighterAccounts(
    address: string
  ): Promise<LighterAccount | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/account`, {
        params: {
          by: "l1_address",
          value: address,
        },
      });

      return response.data;
    } catch (error) {
      return null;
    }
  }

  public async createLighterIntentAddress(): Promise<string | null> {
    try {
      const params = new URLSearchParams();
      params.append("chain_id", this.config.chainId);
      params.append("from_addr", this.signer.address);
      params.append("amount", "5000000");
      params.append("is_external_deposit", "false");

      const response = await axios.post(
        `${this.apiUrl}/createIntentAddress`,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
        }
      );

      return response.data.intent_address;
    } catch (error: any) {
      console.error("Create lighter intent address failed:", error);

      return null;
    }
  }
}
