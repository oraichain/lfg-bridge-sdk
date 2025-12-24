import {
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
import { Bridge } from "./Bridge";

export class HyperliquidBridge extends Bridge {
  constructor(rpcUrl: string, privateKey: string) {
    super(rpcUrl, privateKey);
  }

  public async send(params: SendParams): Promise<SendResult> {
    return;
  }

  public async deposit(params: DepositParams): Promise<DepositResult> {
    return;
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
}
