import { ethers } from "ethers";
import axios from "axios";
import { SignerClient } from "@oraichain/lighter-ts-sdk";

import { LIGHTER_CONFIG } from "../configs";
import {
  BridgeConfig,
  LighterAccount,
  LighterApiKeys,
  LighterBridgeInfo,
  LighterCheckingDepositProgressParams,
  LighterCheckingDepositProgressResult,
  LighterCheckingWithdrawProgressParams,
  LighterCheckingWithdrawProgressResult,
  LighterDepositParams,
  LighterDepositResult,
  LighterSendInternalResult,
  LighterSendParams,
  LighterSendResult,
  LighterWithdrawParams,
  LighterWithdrawResult,
} from "../types";
import { Bridge } from ".";

export class LighterBridge extends Bridge {
  private apiUrl: string;
  private signerClient: SignerClient;
  private isInitSignerClient: boolean = false;
  private privateKey: string;

  get signerAddress(): string {
    return this.signer.address;
  }

  constructor(rpcUrl: string, privateKey: string) {
    // init parent class
    super(rpcUrl, privateKey);
    this.privateKey = privateKey;
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

  public async send(params: LighterSendParams): Promise<LighterSendResult> {
    try {
      const result = await this.sendInternal(params.toAddress, params.amount);

      return result;
    } catch (error) {
      console.error("Send failed:", error);

      throw error;
    }
  }

  public async deposit(
    params: LighterDepositParams
  ): Promise<LighterDepositResult> {
    try {
      // check min-deposit is 5 USDC
      if (params.amount < 5) {
        throw new Error("Minimum deposit is 5 USDC");
      }

      // get intent address for receiver or signer
      const intentAddress = await this.createLighterIntentAddress(
        params.receiver || this.signer.address
      );
      if (!intentAddress) {
        throw new Error("Create lighter intent address failed");
      }

      // send usdc to intent address
      const result = await this.sendInternal(intentAddress, params.amount);

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
    params: LighterCheckingDepositProgressParams
  ): Promise<LighterCheckingDepositProgressResult> {
    try {
      // polling to check deposit progress
      while (true) {
        const bridgeInfos = await this.getBridgeInfos(params.address);
        if (!bridgeInfos) {
          throw new Error("Get bridge infos failed");
        }

        const bridgeInfo = bridgeInfos[0];
        if (bridgeInfo.status === "completed") {
          return {
            status: "completed",
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 5_000));
      }
    } catch (error) {
      console.error("Checking deposit progress failed:", error);

      throw error;
    }
  }

  public async initializeSignerClient({
    apiPrivateKey,
    apiKeyIndex,
  }: {
    apiPrivateKey?: `0x${string}`;
    apiKeyIndex?: number;
  }): Promise<{ apiPrivateKey: `0x${string}`; apiKeyIndex: number } | null> {
    try {
      if (this.isInitSignerClient) {
        return {
          apiPrivateKey: apiPrivateKey || "0x",
          apiKeyIndex: apiKeyIndex || 0,
        };
      }

      const l1Account = await this.getLighterAccounts(this.signer.address);
      const accountIndex = l1Account?.accounts[0]?.account_index;
      if (!accountIndex) {
        throw new Error("Account index not found");
      }

      let finalApiPrivateKey = apiPrivateKey;
      let finalApiKeyIndex = apiKeyIndex;

      if (!finalApiPrivateKey || !finalApiKeyIndex) {
        // init signer client temporarily to generate api key
        this.signerClient = new SignerClient({
          url: this.apiUrl,
          privateKey: " ",
          accountIndex,
          apiKeyIndex: 0,
        });

        let apiKeys = await this.getApiKeysInfos(accountIndex);
        const { privateKey, publicKey } =
          await this.signerClient.generateAPIKey();

        finalApiPrivateKey = privateKey as `0x${string}`;
        // for simplicity, use the last api key index
        finalApiKeyIndex =
          apiKeys?.api_keys[apiKeys?.api_keys.length - 1]?.api_key_index;
        // this means this user is new and has no custom api key yet -> by default use finalApiKeyIndex = 2
        if (!finalApiKeyIndex || finalApiKeyIndex <= 1) {
          finalApiKeyIndex = 2;
        }

        // init 2nd time with newly gen api priv key to initialize and change api key
        this.signerClient = new SignerClient({
          url: this.apiUrl,
          privateKey: privateKey,
          accountIndex,
          apiKeyIndex: 0,
        });

        await this.signerClient.initialize();
        await this.signerClient.ensureWasmClient();

        const changeApiKeyResult = await this.signerClient.changeApiKey({
          ethPrivateKey: this.privateKey,
          newPubkey: publicKey,
          newApiKeyIndex: finalApiKeyIndex,
        });
        if (changeApiKeyResult[2]) {
          throw new Error(`Change api key failed: ${changeApiKeyResult[2]}`);
        }
      }

      // init signer client
      this.signerClient = new SignerClient({
        url: this.apiUrl,
        privateKey: finalApiPrivateKey,
        accountIndex,
        apiKeyIndex: finalApiKeyIndex,
      });

      await this.signerClient.initialize();
      await this.signerClient.ensureWasmClient();

      this.isInitSignerClient = true;
      return {
        apiPrivateKey: finalApiPrivateKey || "0x",
        apiKeyIndex: finalApiKeyIndex || 0,
      };
    } catch (error) {
      console.error("Init signer client failed:", error);

      throw error;
    }
  }

  public async withdraw(
    params: LighterWithdrawParams
  ): Promise<LighterWithdrawResult> {
    try {
      // make sure signer client is initialized
      if (!this.isInitSignerClient) {
        throw new Error("Signer client is not initialized");
      }

      // Create withdraw transaction
      const [tx, txHash, error] = await this.signerClient.withdraw({
        usdcAmount: parseFloat(params.amount.toString()),
        nonce: params.nonce || -1,
      });
      if (error) {
        throw new Error(`Create withdraw transaction failed: ${error}`);
      }

      return {
        txHash: txHash,
        amount: params.amount.toString(),
        txInfo: tx,
      };
    } catch (error) {
      console.error("Withdraw failed:", error);

      throw error;
    }
  }

  public async checkingWithdrawProgress(
    params: LighterCheckingWithdrawProgressParams
  ): Promise<LighterCheckingWithdrawProgressResult> {
    try {
      const { status, nonce, hash, message } =
        await this.signerClient.waitForTransaction(
          params.txHash,
          160_000,
          5_000
        );

      return {
        status,
        nonce,
        hash,
        message,
      };
    } catch (error) {
      console.error("Checking withdraw progress failed:", error);

      throw error;
    }
  }

  private async sendInternal(
    toAddress: string,
    amount: number
  ): Promise<LighterSendInternalResult> {
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

  private async getLighterAccounts(
    address: string
  ): Promise<LighterAccount | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/account`, {
        params: {
          by: "l1_address",
          value: address,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Get lighter accounts failed:", error);
      return null;
    }
  }

  private async getApiKeysInfos(
    accountIndex: number
  ): Promise<LighterApiKeys | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/apikeys`, {
        params: {
          account_index: accountIndex,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Get api keys infos failed:", error);
      return null;
    }
  }

  private async createLighterIntentAddress(
    address: string
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams();
      params.append("chain_id", this.config.chainId);
      params.append("from_addr", address);
      params.append("amount", "5000000");
      params.append("is_external_deposit", "false");

      const response = await axios.post(
        `${this.apiUrl}/api/v1/createIntentAddress`,
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

  private async getBridgeInfos(
    address: string
  ): Promise<LighterBridgeInfo[] | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/v1/bridges`, {
        params: {
          l1_address: address,
        },
      });

      return response.data.bridges;
    } catch (error) {
      return null;
    }
  }

  public async fastWithdraw(
    params: LighterWithdrawParams
  ): Promise<LighterWithdrawResult> {
    try {
      // make sure signer client is initialized
      if (!this.isInitSignerClient) {
        throw new Error("Signer client is not initialized");
      }

      // Create withdraw transaction
      const [tx, txHash, error] = await this.signerClient.fastWithdraw(
        {
          usdcAmount: parseFloat(params.amount.toString()),
          nonce: params.nonce || -1,
        },
        this.privateKey,
        params.receiver || this.signer.address
      );
      if (error) {
        throw new Error(`Create fast withdraw transaction failed: ${error}`);
      }

      return {
        txHash: txHash,
        amount: params.amount.toString(),
        txInfo: tx,
      };
    } catch (error) {
      console.error("Fast withdraw failed:", error);

      throw error;
    }
  }
}
