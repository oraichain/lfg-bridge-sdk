export const HYPERLIQUID_CONFIG = {
  usdcContract: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  chainId: "42161",
  usdcAbi: [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address account) external view returns (uint256)",
  ],
  bridgeContract: "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7",
};
