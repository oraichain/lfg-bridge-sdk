import "dotenv/config";

import { LighterBridge } from "../../dist";

const send = async () => {
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const lighterBridge = new LighterBridge(rpcUrl, privateKey);
  const result = await lighterBridge.send({
    toAddress: lighterBridge.signerAddress,
    amount: 0.1,
  });

  console.log("Send result:", result);
};

send();
