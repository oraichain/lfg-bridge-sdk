import "dotenv/config";

import { LighterBridge } from "../../src";

const withdraw = async () => {
  // const apiPrivateKey = process.env.API_PRIVATE_KEY || "";
  const privateKey = process.env.PRIVATE_KEY || "";
  const rpcUrl = process.env.RPC_URL || "";

  const lighterBridge = new LighterBridge(rpcUrl, privateKey);

  // initialize signer client
  await lighterBridge.initializeSignerClient({});

  // withdraw USDC
  const result = await lighterBridge.withdraw({ amount: 1 });
  console.log("Withdraw result:", result);

  // checking withdraw progress
  const withdrawProgress = await lighterBridge.checkingWithdrawProgress({
    txHash: result.txHash,
  });
  console.log("Withdraw progress:", withdrawProgress);
};

withdraw();
