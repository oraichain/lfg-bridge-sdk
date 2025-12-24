import "dotenv/config";

import { HyperliquidBridge } from "../../dist";

const deposit = async () => {
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const hyperBridge = new HyperliquidBridge(rpcUrl, privateKey);
  const result = await hyperBridge.deposit({
    amount: 5,
  });

  console.log("Deposit result:", result);
};

deposit();
