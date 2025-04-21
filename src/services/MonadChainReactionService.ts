import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { toast } from "sonner";
import ChainReactionContractABI from '../contracts/ChainReactionContract.json';
import { ChainEffect, ChainReactionResult } from './ChainReactionService';

// Chain Reaction Contract address on Monad Testnet
const CHAIN_REACTION_CONTRACT_ADDRESS = '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf';

class MonadChainReactionService {
  private provider: Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private chainReactionContract: ethers.Contract | null = null;
  private isConnected: boolean = false;

  // Monad Testnet Configuration - using the same config as MonadGameService
  private readonly MONAD_TESTNET_CONFIG = {
    chainId: '0x279f', // 10143 in decimal
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz/'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com/']
  };

  /**
   * Initialize the connection to Monad blockchain
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

      console.log('Connected wallet address for Chain Reactions:', walletAddress);

      // Handle network switching/adding
      await this.ensureCorrectNetwork();

      // Initialize contract
      await this.initializeContract();

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Monad for Chain Reactions:', error);
      this.resetState();
      return false;
    }
  }

  private async ensureCorrectNetwork(): Promise<void> {
    if (!this.provider) throw new Error("Provider not initialized");

    const currentNetwork = await this.provider.getNetwork();
    const requiredChainId = this.MONAD_TESTNET_CONFIG.chainId;
    const requiredChainIdHex = requiredChainId.startsWith('0x') ? requiredChainId : `0x${parseInt(requiredChainId).toString(16)}`;

    console.log('Current network:', currentNetwork.chainId, 'Required network:', parseInt(requiredChainIdHex, 16));

    if (currentNetwork.chainId !== parseInt(requiredChainIdHex, 16)) {
      try {
        console.log('Attempting to switch to Monad Testnet...');
        // First try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: requiredChainIdHex }],
        });
      } catch (switchError: any) {
        console.log('Switch error:', switchError.code, switchError.message);
        // If the network is not added (error code 4902), add it
        if (switchError.code === 4902) {
          try {
            console.log('Adding Monad network to MetaMask with config:', {
              ...this.MONAD_TESTNET_CONFIG,
              chainId: requiredChainIdHex
            });

            // Try to add the network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                ...this.MONAD_TESTNET_CONFIG,
                chainId: requiredChainIdHex
              }],
            });

            console.log('Network added successfully');
          } catch (addError: any) {
            console.error('Failed to add Monad Testnet:', addError);
            throw new Error(`Failed to add Monad Testnet: ${addError.message}`);
          }
        } else {
          console.error('Failed to switch network:', switchError);
          throw new Error(`Failed to switch to Monad Testnet: ${switchError.message}`);
        }
      }

      // Verify the connection after switching/adding network
      const verifyNetwork = await this.provider.getNetwork();
      if (verifyNetwork.chainId !== parseInt(requiredChainIdHex, 16)) {
        throw new Error('Failed to connect to Monad Testnet. Please try again.');
      }
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.signer) throw new Error("Signer not initialized");

    try {
      console.log('Initializing Chain Reaction contract with address:', CHAIN_REACTION_CONTRACT_ADDRESS);

      // Ensure the contract address is properly formatted
      const formattedAddress = ethers.utils.getAddress(CHAIN_REACTION_CONTRACT_ADDRESS);

      // Create the contract instance
      this.chainReactionContract = new ethers.Contract(
        formattedAddress,
        ChainReactionContractABI.abi,
        this.signer
      );

      console.log('Chain Reaction contract initialized successfully');
    } catch (error) {
      console.error('Error initializing Chain Reaction contract:', error);
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
   * Trigger a chain reaction on the Monad blockchain
   * @param effectId The ID of the effect to trigger
   * @param targetId The ID of the target (card, player, etc.)
   * @param magnitude The magnitude of the effect
   * @param duration The duration of the effect
   * @returns Chain reaction result
   */
  async triggerChainReaction(
    effectId: string,
    targetId: string = 'global',
    magnitude: number = 1,
    duration: number = 1
  ): Promise<ChainReactionResult> {
    const startTime = Date.now();
    const toastId = toast.loading('Initiating chain reaction on Monad...');

    try {
      // Initialize connection if not already connected
      const connected = await this.initialize();
      if (!connected) {
        toast.error('Failed to connect to Monad blockchain', { id: toastId });
        return {
          success: false,
          effects: [],
          totalEffectsTriggered: 0,
          executionTimeMs: Date.now() - startTime
        };
      }

      if (!this.chainReactionContract) {
        toast.error('Chain Reaction contract not initialized', { id: toastId });
        return {
          success: false,
          effects: [],
          totalEffectsTriggered: 0,
          executionTimeMs: Date.now() - startTime
        };
      }

      // Call the contract method
      console.log(`Triggering chain reaction for effect ${effectId} on target ${targetId}`);
      const tx = await this.chainReactionContract.triggerChainReaction(
        effectId,
        targetId,
        magnitude,
        duration
      );

      toast.loading(`Transaction submitted to Monad blockchain...`, { id: toastId });
      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Parse events from the receipt to get chain reaction details
      const chainReactionId = this.parseChainReactionId(receipt);
      if (!chainReactionId) {
        throw new Error('Failed to parse chain reaction ID from transaction receipt');
      }

      // Get chain reaction details from the contract
      const chainReactionDetails = await this.chainReactionContract.getChainReactionDetails(chainReactionId);
      console.log('Chain reaction details:', chainReactionDetails);

      // Get effects triggered during the chain reaction
      const effectsData = await this.chainReactionContract.getChainReactionEffects(chainReactionId);
      console.log('Chain reaction effects:', effectsData);

      // Format the effects data
      const effects = effectsData.map((effect: any) => ({
        effectId: effect.effectId,
        targetId: effect.targetId,
        success: effect.success,
        result: {
          magnitude: effect.magnitude.toNumber(),
          duration: effect.duration.toNumber()
        },
        executionTimeMs: effect.executionTime.toNumber()
      }));

      const executionTime = Date.now() - startTime;
      const totalEffectsTriggered = effects.length;

      // Calculate additional metrics
      const networkLatency = Math.min(50, executionTime * 0.1); // Estimate network latency as 10% of total time
      const gasUsed = receipt.gasUsed.toNumber();
      const sequentialTime = totalEffectsTriggered * 300; // Estimate sequential execution time
      const parallelSpeedup = sequentialTime / (executionTime - networkLatency);

      toast.success(`Chain reaction completed on Monad`, {
        id: toastId,
        description: `${totalEffectsTriggered} effects triggered in ${executionTime}ms`
      });

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        effects,
        totalEffectsTriggered,
        executionTimeMs: executionTime,
        parallelSpeedup: parseFloat(parallelSpeedup.toFixed(2)),
        gasUsed,
        networkLatency: Math.floor(networkLatency)
      };
    } catch (error: any) {
      console.error('Error triggering chain reaction on Monad:', error);
      
      toast.error('Chain reaction failed', {
        id: toastId,
        description: error.message || 'Error executing chain reaction on Monad'
      });

      return {
        success: false,
        effects: [],
        totalEffectsTriggered: 0,
        executionTimeMs: Date.now() - startTime,
        networkLatency: 30,
        gasUsed: 25000 // Base gas for failed transaction
      };
    }
  }

  /**
   * Parse the chain reaction ID from the transaction receipt
   * @param receipt Transaction receipt
   * @returns Chain reaction ID or null if not found
   */
  private parseChainReactionId(receipt: ethers.providers.TransactionReceipt): string | null {
    try {
      // Find the ChainReactionInitiated event
      const abi = ChainReactionContractABI.abi;
      const iface = new ethers.utils.Interface(abi);
      
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === 'ChainReactionInitiated') {
            return parsedLog.args.chainReactionId;
          }
        } catch (e) {
          // Skip logs that can't be parsed with this interface
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing chain reaction ID:', error);
      return null;
    }
  }

  /**
   * Get the explorer URL for a transaction
   * @param txHash Transaction hash
   * @returns Explorer URL
   */
  getExplorerUrl(txHash: string): string {
    if (!txHash || txHash.length < 10) {
      console.warn('Invalid transaction hash:', txHash);
      return this.MONAD_TESTNET_CONFIG.blockExplorerUrls[0];
    }

    return `${this.MONAD_TESTNET_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
  }

  /**
   * Register a new effect on the Monad blockchain
   * @param effect The effect to register
   * @returns Transaction hash
   */
  async registerEffect(effect: ChainEffect): Promise<string> {
    try {
      // Initialize connection if not already connected
      const connected = await this.initialize();
      if (!connected) {
        throw new Error('Failed to connect to Monad blockchain');
      }

      if (!this.chainReactionContract) {
        throw new Error('Chain Reaction contract not initialized');
      }

      // Convert effect type to uint8
      const targetTypeMap: Record<string, number> = {
        'card': 0,
        'player': 1,
        'nft': 2,
        'global': 3
      };

      const effectTypeMap: Record<string, number> = {
        'buff': 0,
        'debuff': 1,
        'transform': 2,
        'mint': 3,
        'burn': 4,
        'transfer': 5
      };

      const targetType = targetTypeMap[effect.targetType] || 3;
      const effectType = effectTypeMap[effect.effectType] || 0;

      // Call the contract method
      const tx = await this.chainReactionContract.registerEffect(
        effect.id,
        effect.name,
        effect.description,
        targetType,
        effectType,
        Math.floor(effect.triggerProbability * 100), // Convert to percentage (0-100)
        effect.chainable,
        effect.chainedEffects || []
      );

      console.log('Effect registration transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Effect registration confirmed in block:', receipt.blockNumber);

      return tx.hash;
    } catch (error) {
      console.error('Error registering effect on Monad:', error);
      throw error;
    }
  }

  /**
   * Get user's chain reaction history
   * @returns Array of chain reaction IDs
   */
  async getUserChainReactions(): Promise<string[]> {
    try {
      // Initialize connection if not already connected
      const connected = await this.initialize();
      if (!connected) {
        throw new Error('Failed to connect to Monad blockchain');
      }

      if (!this.chainReactionContract || !this.signer) {
        throw new Error('Chain Reaction contract not initialized');
      }

      const address = await this.signer.getAddress();
      const chainReactionIds = await this.chainReactionContract.getUserChainReactions(address);
      
      return chainReactionIds;
    } catch (error) {
      console.error('Error getting user chain reactions:', error);
      return [];
    }
  }
}

export const monadChainReactionService = new MonadChainReactionService();
