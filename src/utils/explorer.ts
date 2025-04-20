/**
 * Utility functions for blockchain explorer URLs
 */

/**
 * Get the transaction explorer URL for a given transaction hash
 * @param txHash The transaction hash
 * @returns The explorer URL
 */
export const getTransactionExplorerUrl = (txHash: string): string => {
  // For Monad testnet
  return `https://testnet.monadexplorer.com/tx/${txHash}`;
};

/**
 * Get the address explorer URL for a given address
 * @param address The address to view
 * @returns The explorer URL
 */
export const getAddressExplorerUrl = (address: string): string => {
  // For Monad testnet
  return `https://testnet.monadexplorer.com/address/${address}`;
};

/**
 * Get the block explorer URL for a given block number
 * @param blockNumber The block number
 * @returns The explorer URL
 */
export const getBlockExplorerUrl = (blockNumber: number): string => {
  // For Monad testnet
  return `https://testnet.monadexplorer.com/block/${blockNumber}`;
};

/**
 * Get the token explorer URL for a given token address
 * @param tokenAddress The token contract address
 * @returns The explorer URL
 */
export const getTokenExplorerUrl = (tokenAddress: string): string => {
  // For Monad testnet
  return `https://testnet.monadexplorer.com/token/${tokenAddress}`;
};

/**
 * Get the NFT explorer URL for a given NFT contract address and token ID
 * @param contractAddress The NFT contract address
 * @param tokenId The token ID
 * @returns The explorer URL
 */
export const getNftExplorerUrl = (contractAddress: string, tokenId: string): string => {
  // For Monad testnet
  return `https://testnet.monadexplorer.com/token/${contractAddress}?a=${tokenId}`;
};
