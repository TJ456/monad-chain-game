import { ethers } from 'ethers';

/**
 * Service for interacting with Alchemy API to fetch NFTs
 */
export class AlchemyNFTService {
  private apiKey: string;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private monadRpcUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.monadRpcUrl = `https://monad-testnet.g.alchemy.com/v2/${this.apiKey}`;
  }

  /**
   * Initialize the connection to Monad testnet
   */
  async initialize(): Promise<boolean> {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(this.monadRpcUrl);

      // Test the connection by getting the latest block
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`Successfully connected to Monad testnet. Latest block: ${blockNumber}`);

      return true;
    } catch (error) {
      console.error('Error initializing Alchemy NFT service:', error);
      this.provider = null;
      return false;
    }
  }

  /**
   * Get a provider for Monad testnet using Alchemy
   * This can be used for wallet connections and other blockchain interactions
   */
  getProvider(): ethers.providers.JsonRpcProvider {
    if (!this.provider) {
      this.provider = new ethers.providers.JsonRpcProvider(this.monadRpcUrl);
    }
    return this.provider;
  }

  /**
   * Get the Monad RPC URL
   */
  getMonadRpcUrl(): string {
    return this.monadRpcUrl;
  }

  /**
   * Get the latest block number from Monad testnet
   */
  async getLatestBlockNumber(): Promise<number> {
    if (!this.provider) {
      await this.initialize();
    }

    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.getBlockNumber();
  }

  /**
   * Get NFTs owned by an address
   * @param ownerAddress The address to fetch NFTs for
   * @returns Array of NFTs
   */
  async getNFTsForOwner(ownerAddress: string): Promise<any> {
    try {
      // First verify the connection to Monad
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize provider');
        }
      }

      // Get the latest block to verify connection
      const blockNumber = await this.getLatestBlockNumber();
      console.log(`Connected to Monad. Latest block: ${blockNumber}`);

      // Use the Alchemy NFT API to fetch NFTs
      // Use the Monad testnet endpoint for NFT API
      const alchemyNftUrl = `https://monad-testnet.g.alchemy.com/v2/${this.apiKey}/getNFTs?owner=${ownerAddress}&withMetadata=true&pageSize=100`;
      const response = await fetch(alchemyNftUrl, {
        method: "GET",
        headers: { accept: "application/json" }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw error;
    }
  }

  /**
   * Get a specific NFT by contract address and token ID
   * @param contractAddress The NFT contract address
   * @param tokenId The token ID
   * @returns NFT data
   */
  async getNFT(contractAddress: string, tokenId: string): Promise<any> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const alchemyNftUrl = `https://monad-testnet.g.alchemy.com/v2/${this.apiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
      const response = await fetch(alchemyNftUrl, {
        method: "GET",
        headers: { accept: "application/json" }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching NFT:', error);
      throw error;
    }
  }
}

// Create a singleton instance with a default API key
// In a real app, you would get this from environment variables
const DEFAULT_API_KEY = "NNYuXorTouLnVBTTcq241yTwQDfzK8OE";
export const alchemyNFTService = new AlchemyNFTService(
  import.meta.env.VITE_ALCHEMY_API_KEY || DEFAULT_API_KEY
);
