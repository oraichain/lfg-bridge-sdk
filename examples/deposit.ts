import "dotenv/config";

import { LighterBridge } from "../dist";

const deposit = async () => {
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const lighterBridge = new LighterBridge(rpcUrl, privateKey);
  const result = await lighterBridge.deposit({
    amount: 5,
  });

  console.log("Deposit result:", result);

  // const depositProgress = await lighterBridge.checkingDepositProgress({
  //   address: lighterBridge.signerAddress,
  // });
  // console.log("Deposit progress:", depositProgress);
};

deposit();
