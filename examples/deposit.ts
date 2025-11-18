import "dotenv/config";

import { LighterBridge } from "../dist";

const deposit = async () => {
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const lighterBridge = new LighterBridge(rpcUrl, privateKey);
  const result = await lighterBridge.deposit({ amount: 5 });

  console.log("Deposit result:", result);

  const depositProgress = await lighterBridge.checkingDepositProgress({
    address: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
  });
  console.log("Deposit progress:", depositProgress);
};

deposit();
