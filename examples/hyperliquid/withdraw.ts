import "dotenv/config";

import { HyperliquidBridge } from "../../dist";

const withdraw = async () => {
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const hyperBridge = new HyperliquidBridge(rpcUrl, privateKey);
  const result = await hyperBridge.withdraw({
    amount: 5,
    receiver: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
  });

  console.log("Withdraw result:", result);
};

withdraw();
