import path from "path";
import fs from "fs";

import { WithdrawParams } from ".";

export interface LighterWasmSignerConfig {
  wasmPath?: string; // Path to the WASM binary (optional; defaults to bundled)
  wasmExecPath?: string; // Path to wasm_exec.js (optional, defaults to bundled)
}

export interface CreateClientParams {
  url: string;
  privateKey: string;
  chainId: number;
  apiKeyIndex: number;
  accountIndex: number;
}

export class LighterWasmSignerClient {
  private config: LighterWasmSignerConfig;
  private isInitialized = false;
  // @ts-ignore - Keep reference to prevent GC even though not directly accessed
  private wasmInstance: any = null;
  private wasmModule: any = null;

  constructor(config: LighterWasmSignerConfig) {
    this.config = config;
  }

  /**
   * Initialize the WASM module
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.initializeNode();

      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize WASM signer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Node.js-specific initialization
   */
  private async initializeNode(): Promise<void> {
    // Resolve WASM paths relative to package root if they're relative paths
    const resolvedWasmPath = this.resolveWasmPath(
      this.config.wasmPath || "../wasm/lighter-signer.wasm"
    );
    let wasmExecPath = this.config.wasmExecPath;

    // Use bundled wasm_exec.js directly (no need for Go runtime)
    if (!wasmExecPath) {
      const bundledPath = this.resolveWasmPath("../wasm/wasm_exec.js");
      if (fs.existsSync(bundledPath)) {
        wasmExecPath = bundledPath;
      } else {
        throw new Error(
          "Bundled wasm_exec.js not found. Please ensure wasm/wasm_exec.js exists."
        );
      }
    } else {
      wasmExecPath = this.resolveWasmPath(wasmExecPath);
    }

    if (!wasmExecPath) {
      throw new Error(
        "Unable to locate wasm_exec runtime. Bundled files not found and Go not installed. Please ensure ../wasm/wasm_exec.js exists in the package."
      );
    }

    await this.loadWasmExec(wasmExecPath);

    // Load the WASM binary
    const wasmBytes = await this.loadWasmBinary(resolvedWasmPath);

    // Initialize the WASM runtime
    const Go = (global as any).Go;
    const go = new Go();

    // Build a compatible import object for both 'go' and 'gojs' module names
    const baseImport = go.importObject as any;
    const goModule = baseImport.go || baseImport.gojs;

    // Ensure aliases expected by our WASM are present
    if (
      goModule &&
      !goModule["syscall/js.copyBytesToGo"] &&
      goModule["syscall/js.valueCopyBytesToGo"]
    ) {
      goModule["syscall/js.copyBytesToGo"] =
        goModule["syscall/js.valueCopyBytesToGo"];
    }
    if (
      goModule &&
      !goModule["syscall/js.copyBytesToJS"] &&
      goModule["syscall/js.valueCopyBytesToJS"]
    ) {
      goModule["syscall/js.copyBytesToJS"] =
        goModule["syscall/js.valueCopyBytesToJS"];
    }
    const compatImportObject = {
      ...baseImport,
      go: goModule,
      gojs: goModule,
    } as any;

    const result = await WebAssembly.instantiate(wasmBytes, compatImportObject);

    // Set up the WASM runtime environment before running
    // Only pass essential environment variables to avoid exceeding WASM limits
    const essentialEnvVars: Record<string, string> = {
      TMPDIR: require("os").tmpdir(),
      HOME: process.env["HOME"] || "",
      PATH: process.env["PATH"] || "",
      // Add any specific vars your signer needs here
    };
    go.env = essentialEnvVars;
    // Limit argv to avoid exceeding length limits
    go.argv = ["js"]; // Minimal argv
    go.exit = process.exit;

    // Minimal globals (official runtime sets most as needed)
    (global as any).process = process;
    (global as any).console = console;
    (global as any).Buffer = Buffer;

    // Keep a reference to the instance to prevent garbage collection
    this.wasmInstance = result.instance;
    // Also store globally to prevent GC
    (global as any).wasmInstance = result.instance;
    // Store the memory buffer globally to prevent detachment
    (global as any).wasmMemory = result.instance.exports["mem"];

    // Run the WASM module using the standard runtime approach
    try {
      go.run(result.instance);
    } catch (runError) {
      throw new Error(
        `WASM runtime failed: ${
          runError instanceof Error ? runError.message : String(runError)
        }`
      );
    }

    // Wait for functions to be registered
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    // Try multiple ways to access the functions (Go exports are capitalized)
    this.wasmModule = {
      generateAPIKey:
        (global as any).GenerateAPIKey ||
        (global as any).generateAPIKey ||
        (global as any).lighterWasmFunctions?.generateAPIKey,
      getPublicKey:
        (global as any).GetPublicKey ||
        (global as any).getPublicKey ||
        (global as any).lighterWasmFunctions?.getPublicKey,
      createClient:
        (global as any).CreateClient ||
        (global as any).createClient ||
        (global as any).lighterWasmFunctions?.createClient,
      signChangePubKey:
        (global as any).SignChangePubKey ||
        (global as any).signChangePubKey ||
        (global as any).lighterWasmFunctions?.signChangePubKey,
      signCreateOrder:
        (global as any).SignCreateOrder ||
        (global as any).signCreateOrder ||
        (global as any).lighterWasmFunctions?.signCreateOrder,
      signCancelOrder:
        (global as any).SignCancelOrder ||
        (global as any).signCancelOrder ||
        (global as any).lighterWasmFunctions?.signCancelOrder,
      signCancelAllOrders:
        (global as any).SignCancelAllOrders ||
        (global as any).signCancelAllOrders ||
        (global as any).lighterWasmFunctions?.signCancelAllOrders,
      signTransfer:
        (global as any).SignTransfer ||
        (global as any).signTransfer ||
        (global as any).lighterWasmFunctions?.signTransfer,
      signWithdraw:
        (global as any).SignWithdraw ||
        (global as any).signWithdraw ||
        (global as any).lighterWasmFunctions?.signWithdraw,
      signUpdateLeverage:
        (global as any).SignUpdateLeverage ||
        (global as any).signUpdateLeverage ||
        (global as any).lighterWasmFunctions?.signUpdateLeverage,
      createAuthToken:
        (global as any).CreateAuthToken ||
        (global as any).createAuthToken ||
        (global as any).lighterWasmFunctions?.createAuthToken,
      checkClient:
        (global as any).CheckClient ||
        (global as any).checkClient ||
        (global as any).lighterWasmFunctions?.checkClient,
    };

    // Verify that the functions are available
    if (!this.wasmModule.generateAPIKey) {
      throw new Error("WASM functions not properly registered");
    }
  }

  /**
   * Create a client for signing transactions
   */
  async createClient(params: CreateClientParams): Promise<void> {
    await this.ensureInitialized();

    // Standalone signer: CreateClient(apiKeyPrivateKey, accountIndex, apiKeyIndex, chainId)
    const result = this.wasmModule.createClient(
      params.privateKey,
      params.accountIndex,
      params.apiKeyIndex,
      params.chainId
    );

    if (result.error) {
      throw new Error(`Failed to create client: ${result.error}`);
    }
  }

  /**
   * Ensure the WASM module is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Resolve WASM path relative to package root
   */
  private resolveWasmPath(wasmPath: string): string {
    // If path is already absolute, return as-is
    if (path.isAbsolute(wasmPath)) {
      return wasmPath;
    }

    // Try to resolve relative to package root first
    try {
      // Look for the package root by finding node_modules/lighter-ts-sdk
      const packageRoot = this.findPackageRoot();
      if (packageRoot) {
        const resolvedPath = path.join(packageRoot, wasmPath);

        if (fs.existsSync(resolvedPath)) {
          return resolvedPath;
        }
      }
    } catch {}

    // Fallback to current working directory
    return require("path").resolve(process.cwd(), path);
  }

  /**
   * Find the package root directory
   */
  private findPackageRoot(): string | null {
    try {
      // Try to resolve the package.json of lfg-bridge-sdk
      const packageJsonPath = require.resolve("lfg-bridge-sdk/package.json");

      return path.dirname(packageJsonPath);
    } catch {
      // Fallback: look for node_modules/lfg-bridge-sdk in current or parent directories
      let currentDir = process.cwd();
      const maxDepth = 10; // Prevent infinite loops
      let depth = 0;

      while (currentDir && depth < maxDepth) {
        const packagePath = path.join(
          currentDir,
          "node_modules",
          "lfg-bridge-sdk"
        );

        if (fs.existsSync(packagePath)) {
          return packagePath;
        }

        currentDir = path.dirname(currentDir);
        depth++;
      }
    }

    return null;
  }

  /**
   * Load wasm_exec.js for Node.js
   */
  private async loadWasmExec(wasmExecPath: string): Promise<void> {
    try {
      let absolutePath: string = wasmExecPath;

      if (!absolutePath.startsWith("/") && !absolutePath.includes(":")) {
        try {
          absolutePath = require.resolve(wasmExecPath, {
            paths: [process.cwd()],
          });
        } catch {
          absolutePath = path.resolve(process.cwd(), wasmExecPath);
        }
      }

      // Directly require the wasm_exec.js file
      delete require.cache[absolutePath];
      const wasmExec = require(absolutePath);

      // Set Go class on global object
      if (wasmExec && wasmExec.Go) {
        (global as any).Go = wasmExec.Go;
      } else if ((global as any).Go) {
        // already provided by official runtime
      } else {
        throw new Error("Go class not found in wasm_exec.js");
      }
    } catch (error) {
      throw new Error(
        `Failed to load wasm_exec.js: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Load WASM binary for Node.js
   */
  private async loadWasmBinary(wasmPath: string): Promise<ArrayBuffer> {
    // Node.js path
    const buffer = fs.readFileSync(wasmPath);

    // Return the buffer as an ArrayBuffer
    return buffer.buffer.slice(
      buffer.byteOffset,
      (buffer.byteOffset + buffer.byteLength) as any
    ) as ArrayBuffer;
  }

  /**
   * Sign a withdraw transaction
   */
  async signWithdraw(
    params: WithdrawParams
  ): Promise<{ txInfo: string; error?: string }> {
    await this.ensureInitialized();

    const result = this.wasmModule.signWithdraw(
      params.usdcAmount,
      params.nonce
    );

    if (result.error) {
      return { txInfo: "", error: result.error };
    }

    return { txInfo: result.txInfo };
  }
}

/**
 * Create a unified WASM signer client instance
 */
export const createLighterWasmSignerClient = (
  config: LighterWasmSignerConfig
): LighterWasmSignerClient => {
  return new LighterWasmSignerClient(config);
};
