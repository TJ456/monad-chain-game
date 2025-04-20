import { monadGameService } from '@/services/MonadGameService';

/**
 * Get the explorer URL for a transaction
 * @param txHash Transaction hash
 * @returns Full URL to the transaction in the block explorer
 */
export function getTransactionExplorerUrl(txHash: string): string {
  // Check if the transaction hash is valid (starts with 0x and is at least 8 chars long)
  if (!txHash || !txHash.startsWith('0x') || txHash.length < 8) {
    console.warn('Invalid transaction hash:', txHash);
    // Return the explorer base URL if the hash is invalid
    return monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  }

  // Get the base URL from the configuration
  const baseUrl = monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  // Ensure baseUrl doesn't end with a slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Format: baseUrl/tx/transactionHash
  return `${cleanBaseUrl}/tx/${txHash}`;
}

/**
 * Get the explorer URL for a block
 * @param blockNumber Block number
 * @returns Full URL to the block in the block explorer
 */
export function getBlockExplorerUrl(blockNumber: number | string): string {
  // Check if the block number is valid
  if (blockNumber === undefined || blockNumber === null || blockNumber === '') {
    console.warn('Invalid block number:', blockNumber);
    // Return the explorer base URL if the block number is invalid
    return monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  }

  // Get the base URL from the configuration directly
  const baseUrl = monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  return `${baseUrl}/block/${blockNumber}`;
}

/**
 * Get the explorer URL for an address
 * @param address Blockchain address
 * @returns Full URL to the address in the block explorer
 */
export function getAddressExplorerUrl(address: string): string {
  // Check if the address is valid
  if (!address || address.length < 10) {
    console.warn('Invalid address:', address);
    // Return the explorer base URL if the address is invalid
    return monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  }

  // Get the base URL from the configuration directly
  const baseUrl = monadGameService.getMonadNetworkConfig().blockExplorerUrls[0];
  return `${baseUrl}/address/${address}`;
}

/**
 * Truncate a blockchain hash for display
 * @param hash The hash to truncate
 * @param prefixLength Number of characters to keep at the beginning
 * @param suffixLength Number of characters to keep at the end
 * @returns Truncated hash with ellipsis in the middle
 */
export function truncateHash(hash: string, prefixLength = 6, suffixLength = 4): string {
  if (!hash) return '';
  if (hash.length <= prefixLength + suffixLength) return hash;
  return `${hash.substring(0, prefixLength)}...${hash.substring(hash.length - suffixLength)}`;
}
