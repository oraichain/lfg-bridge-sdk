import { LighterWasmSignerClient } from "./wasmSigner";

export class LighterWasmManager {
  private static instance: LighterWasmManager | null = null;
  private isInitialized = false;
  private lighterWasmSignerClient: LighterWasmSignerClient | null = null;

  private constructor() {}

  static getInstance(): LighterWasmManager {
    if (!LighterWasmManager.instance) {
      LighterWasmManager.instance = new LighterWasmManager();
    }

    return LighterWasmManager.instance;
  }

  isReady(): boolean {
    return this.isInitialized && this.lighterWasmSignerClient !== null;
  }

  getWasmClient(): LighterWasmSignerClient {
    if (!this.isInitialized || !this.lighterWasmSignerClient) {
      throw new Error("WASM client not initialized. Call initialize() first.");
    }

    return this.lighterWasmSignerClient;
  }
}
