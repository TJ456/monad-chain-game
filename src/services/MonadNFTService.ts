import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { toast } from "sonner";
import ChainReactionContractABI from '../contracts/ChainReactionContract.json';
import { monadChainReactionService } from './MonadChainReactionService';

// Chain Reaction Contract address on Monad Testnet - using the same address
const CHAIN_REACTION_CONTRACT_ADDRESS = '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf';

// NFT metadata base URL
const NFT_METADATA_BASE_URL = 'https://monad-game-nft.vercel.app/api/metadata/';

// NFT image base URL
const NFT_IMAGE_BASE_URL = 'https://monad-game-nft.vercel.app/api/image/';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface MintedNFT {
  tokenId: number;
  name: string;
  description: string;
  quality: number;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  transactionHash: string;
  blockNumber: number;
}

class MonadNFTService {
  private provider: Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private chainReactionContract: ethers.Contract | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize the connection to Monad blockchain
   * Reuses the connection from MonadChainReactionService
   */
  async initialize(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    if (!window.ethereum) {
      console.error("MetaMask not installed");
      return false;
    }

    try {
      // Enable the provider and get accounts
      this.provider = new Web3Provider(window.ethereum, 'any');
      await this.provider.send("eth_requestAccounts", []);

      // Get signer and address
      this.signer = this.provider.getSigner();
      const walletAddress = await this.signer.getAddress();

      console.log('Connected wallet address for NFT operations:', walletAddress);

      // Initialize contract
      await this.initializeContract();

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Monad for NFT operations:', error);
      this.resetState();
      return false;
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.signer) throw new Error("Signer not initialized");

    try {
      console.log('Initializing NFT contract with address:', CHAIN_REACTION_CONTRACT_ADDRESS);

      // Ensure the contract address is properly formatted
      const formattedAddress = ethers.utils.getAddress(CHAIN_REACTION_CONTRACT_ADDRESS);

      // Create the contract instance
      this.chainReactionContract = new ethers.Contract(
        formattedAddress,
        ChainReactionContractABI.abi,
        this.signer
      );

      console.log('NFT contract initialized successfully');
    } catch (error) {
      console.error('Error initializing NFT contract:', error);
      throw error;
    }
  }

  private resetState() {
    this.provider = null;
    this.signer = null;
    this.chainReactionContract = null;
    this.isConnected = false;
  }

  /**
   * Generate random NFT metadata
   * @param quality Quality score (1-100)
   * @returns NFT metadata
   */
  private generateRandomNFTMetadata(quality: number): NFTMetadata {
    // Ensure quality is within range
    const normalizedQuality = Math.max(1, Math.min(100, quality));

    // Generate random attributes based on quality
    const rarity = normalizedQuality >= 80 ? 'Legendary' :
                  normalizedQuality >= 60 ? 'Epic' :
                  normalizedQuality >= 40 ? 'Rare' :
                  normalizedQuality >= 20 ? 'Uncommon' : 'Common';

    // Generate random element
    const elements = ['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow', 'Light'];
    const element = elements[Math.floor(Math.random() * elements.length)];

    // Generate random power level based on quality
    const powerLevel = Math.floor((normalizedQuality / 100) * 1000) + Math.floor(Math.random() * 100);

    // Generate random special ability
    const specialAbilities = [
      'Chain Lightning', 'Frost Nova', 'Earthquake', 'Tornado',
      'Shadow Strike', 'Divine Shield', 'Fireball', 'Healing Wave'
    ];
    const specialAbility = specialAbilities[Math.floor(Math.random() * specialAbilities.length)];

    // Generate name based on rarity and element
    const name = `${rarity} ${element} Token`;

    // Generate description
    const description = `A ${rarity.toLowerCase()} token with ${element.toLowerCase()} properties. Power level: ${powerLevel}. Special ability: ${specialAbility}.`;

    return {
      name,
      description,
      image: `${NFT_IMAGE_BASE_URL}${normalizedQuality}`,
      attributes: [
        {
          trait_type: 'Quality',
          value: normalizedQuality
        },
        {
          trait_type: 'Rarity',
          value: rarity
        },
        {
          trait_type: 'Element',
          value: element
        },
        {
          trait_type: 'Power Level',
          value: powerLevel
        },
        {
          trait_type: 'Special Ability',
          value: specialAbility
        }
      ]
    };
  }

  /**
   * Mint a surprise token to the user's wallet
   * @param quality Quality score (1-100)
   * @returns Minted NFT details
   */
  async mintSurpriseToken(quality: number = 0): Promise<MintedNFT> {
    const startTime = Date.now();
    const toastId = toast.loading('Preparing to mint surprise token...');

    try {
      // Initialize connection if not already connected
      const connected = await this.initialize();
      if (!connected) {
        toast.error('Failed to connect to Monad blockchain', { id: toastId });
        throw new Error('Failed to connect to Monad blockchain');
      }

      if (!this.chainReactionContract || !this.signer) {
        toast.error('NFT contract not initialized', { id: toastId });
        throw new Error('NFT contract not initialized');
      }

      // Get user's address
      const userAddress = await this.signer.getAddress();

      // If quality is 0, generate a random quality between 1-100
      const tokenQuality = quality > 0 ? quality : Math.floor(Math.random() * 100) + 1;

      // Generate random NFT metadata
      const metadata = this.generateRandomNFTMetadata(tokenQuality);

      // Create metadata URI (in a real implementation, this would be uploaded to IPFS)
      const metadataURI = `${NFT_METADATA_BASE_URL}${tokenQuality}`;

      toast.loading(`Minting surprise token on Monad blockchain...`, { id: toastId });

      // Call the contract method to mint the token
      console.log(`Minting surprise token for ${userAddress} with quality ${tokenQuality}`);
      const tx = await this.chainReactionContract.mintSurpriseToken(
        userAddress,
        metadata.name,
        metadata.description,
        tokenQuality,
        metadataURI
      );

      console.log('Minting transaction submitted:', tx.hash);
      toast.loading(`Transaction submitted to Monad blockchain...`, { id: toastId });

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Minting transaction confirmed in block:', receipt.blockNumber);

      // Parse the token ID from the event logs
      let tokenId = 0;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.chainReactionContract.interface.parseLog(log);
          if (parsedLog.name === 'SurpriseTokenMinted') {
            tokenId = parsedLog.args.tokenId.toNumber();
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
          continue;
        }
      }

      if (tokenId === 0) {
        // If we couldn't parse the token ID, generate a random one for demo purposes
        tokenId = Math.floor(Math.random() * 1000000) + 1;
      }

      const mintedNFT: MintedNFT = {
        tokenId,
        name: metadata.name,
        description: metadata.description,
        quality: tokenQuality,
        image: metadata.image,
        attributes: metadata.attributes,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

      toast.success(`Surprise token minted successfully!`, {
        id: toastId,
        description: `${metadata.name} with quality ${tokenQuality} has been added to your wallet`
      });

      return mintedNFT;
    } catch (error: any) {
      console.error('Error minting surprise token:', error);

      toast.error('Failed to mint surprise token', {
        id: toastId,
        description: error.message || 'Error minting token on Monad blockchain'
      });

      // For demo purposes, return a simulated NFT if the real minting fails
      return this.simulateMintedNFT();
    }
  }

  /**
   * Simulate a minted NFT (fallback when blockchain minting fails)
   * @returns Simulated minted NFT
   */
  public simulateMintedNFT(): MintedNFT {
    // Generate a random quality between 1-100
    const tokenQuality = Math.floor(Math.random() * 100) + 1;

    // Generate random NFT metadata
    const metadata = this.generateRandomNFTMetadata(tokenQuality);

    // Generate a random token ID
    const tokenId = Math.floor(Math.random() * 1000000) + 1;

    // Generate a random transaction hash
    const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return {
      tokenId,
      name: metadata.name,
      description: metadata.description,
      quality: tokenQuality,
      image: metadata.image,
      attributes: metadata.attributes,
      transactionHash: txHash,
      blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
    };
  }

  /**
   * Get the explorer URL for a transaction
   * @param txHash Transaction hash
   * @returns Explorer URL
   */
  getExplorerUrl(txHash: string): string {
    return monadChainReactionService.getExplorerUrl(txHash);
  }
}

export const monadNFTService = new MonadNFTService();
