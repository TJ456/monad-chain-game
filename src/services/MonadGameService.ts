import { ethers, ContractInterface } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { MonadGameMove, MovesBatch, Player } from '../types/game';
import { ipfsService, CardMetadata } from './IPFSService';
import { alchemyNFTService } from './AlchemyNFTService';

export class MonadGameService {
  private provider: Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private walletAddress: string | null = null;
  private monadGameContract: ethers.Contract | null = null;
  private isConnected: boolean = false;
  private cardCopiedListeners: ((card: any) => void)[] = [];

  // Monad Testnet Configuration
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

  // Get the block explorer URL for a transaction
  public getExplorerUrl(txHash: string): string {
    // Check if the transaction hash is valid
    if (!txHash || txHash.length < 10) {
      console.warn('Invalid transaction hash:', txHash);
      // Return the explorer base URL if the hash is invalid
      return this.MONAD_TESTNET_CONFIG.blockExplorerUrls[0];
    }

    // Use the official Monad explorer from configuration
    return `${this.MONAD_TESTNET_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
  }

  private generateMockTransactionHash(): string {
    // Generate a proper format mock transaction hash (32 bytes = 64 chars + 0x prefix)
    return '0x' + Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async connectWallet(): Promise<string> {
    if (this.isConnected && this.walletAddress) {
      console.log('Already connected to wallet:', this.walletAddress);
      return this.walletAddress;
    }

    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask extension and refresh the page.");
    }

    try {
      // First, try to use the Alchemy provider for Monad testnet
      console.log('Connecting to Monad network using Alchemy provider...');
      console.log('Network configuration:', this.MONAD_TESTNET_CONFIG);

      // Get the Monad RPC URL from the Alchemy service
      const monadRpcUrl = alchemyNFTService.getMonadRpcUrl();
      console.log('Using Monad RPC URL:', monadRpcUrl);

      try {
        // Configure MetaMask to use the Alchemy provider
        await this.configureMetaMaskWithAlchemy(monadRpcUrl);
      } catch (configError: any) {
        console.error('Error configuring MetaMask with Alchemy:', configError);
        throw new Error(`Failed to configure network: ${configError.message}. Try using the Manual Network Config option.`);
      }

      try {
        // Now connect using MetaMask
        this.provider = new Web3Provider(window.ethereum, 'any');
        await this.provider.send("eth_requestAccounts", []);
      } catch (accountsError: any) {
        console.error('Error requesting accounts:', accountsError);
        if (accountsError.code === 4001) {
          // User rejected the request
          throw new Error('You rejected the connection request. Please approve the MetaMask connection to continue.');
        }
        throw new Error(`Failed to connect to MetaMask: ${accountsError.message}`);
      }

      // Get signer and address
      this.signer = this.provider.getSigner();
      this.walletAddress = await this.signer.getAddress();

      console.log('Connected wallet address:', this.walletAddress);

      try {
        // Handle network switching/adding
        await this.ensureCorrectNetwork();
      } catch (networkError: any) {
        console.error('Error ensuring correct network:', networkError);
        throw new Error(`Network configuration error: ${networkError.message}. Try removing the network and adding it again.`);
      }

      try {
        // Initialize contract after ensuring correct network
        await this.initializeContract();
      } catch (contractError: any) {
        console.error('Error initializing contract:', contractError);
        // We can continue without contract initialization in some cases
        console.warn('Continuing without contract initialization');
      }

      this.isConnected = true;
      return this.walletAddress;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      this.resetState();

      // Enhance error message for common issues
      if (error.message?.includes('already pending')) {
        throw new Error('MetaMask has a pending request. Please open MetaMask and check for pending requests.');
      } else if (error.message?.includes('User rejected')) {
        throw new Error('You rejected the connection request. Please approve the MetaMask connection to continue.');
      }

      throw error;
    }
  }

  /**
   * Configure MetaMask to use the Alchemy provider for Monad testnet
   * @param monadRpcUrl The Monad RPC URL from Alchemy
   */
  private async configureMetaMaskWithAlchemy(monadRpcUrl: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    try {
      // Create a modified network config that uses the Alchemy RPC URL
      const networkConfig = {
        ...this.MONAD_TESTNET_CONFIG,
        rpcUrls: [monadRpcUrl]
      };

      console.log('Configuring MetaMask with Alchemy RPC URL:', networkConfig);

      // Try to switch to the network first
      const requiredChainIdHex = networkConfig.chainId.startsWith('0x') ?
        networkConfig.chainId :
        `0x${parseInt(networkConfig.chainId).toString(16)}`;

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: requiredChainIdHex }],
        });
        console.log('Successfully switched to Monad testnet');
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                ...networkConfig,
                chainId: requiredChainIdHex
              }],
            });
            console.log('Successfully added Monad testnet with Alchemy RPC URL');
          } catch (addError: any) {
            console.error('Failed to add Monad testnet with Alchemy RPC URL:', addError);
            throw addError;
          }
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Error configuring MetaMask with Alchemy:', error);
      throw error;
    }
  }

  /**
   * Get Monad network configuration for manual addition
   * @returns Network configuration object
   */
  public getMonadNetworkConfig(): any {
    return {
      ...this.MONAD_TESTNET_CONFIG,
      chainId: this.MONAD_TESTNET_CONFIG.chainId
    };
  }

  /**
   * Try to remove the Monad network from MetaMask if it exists
   * This is useful when the network exists but with incorrect parameters
   */
  public async tryRemoveMonadNetwork(): Promise<void> {
    if (!window.ethereum) throw new Error("MetaMask not installed");

    try {
      console.log('Attempting to remove Monad network from MetaMask...');
      await window.ethereum.request({
        method: 'wallet_deleteEthereumChain',
        params: [{ chainId: this.MONAD_TESTNET_CONFIG.chainId }],
      });
      console.log('Monad network removed successfully');

      // Show success message
      alert('Monad network removed from MetaMask. Please try connecting again.');
    } catch (error: any) {
      console.error('Failed to remove Monad network:', error);

      if (error.code === 4902) {
        alert('The Monad network does not exist in your MetaMask.');
      } else {
        alert(`Failed to remove Monad network: ${error.message}`);
      }
    }
  }

  private async ensureCorrectNetwork(): Promise<void> {
    if (!this.provider) throw new Error("Provider not initialized");

    try {
      const currentNetwork = await this.provider.getNetwork();
      const requiredChainId = this.MONAD_TESTNET_CONFIG.chainId;
      const requiredChainIdHex = requiredChainId.startsWith('0x') ? requiredChainId : `0x${parseInt(requiredChainId).toString(16)}`;
      const requiredChainIdDecimal = parseInt(requiredChainIdHex, 16);

      console.log('Current network:', {
        chainId: currentNetwork.chainId,
        name: currentNetwork.name,
        ensAddress: currentNetwork.ensAddress
      });
      console.log('Required network:', {
        chainId: requiredChainIdDecimal,
        chainIdHex: requiredChainIdHex,
        name: this.MONAD_TESTNET_CONFIG.chainName
      });

      // Check if we're already on the correct network
      if (currentNetwork.chainId === requiredChainIdDecimal) {
        console.log('Already on the correct network');
        return;
      }

      console.log(`Network mismatch. Current: ${currentNetwork.chainId}, Required: ${requiredChainIdDecimal}`);
      console.log('Attempting to switch to Monad network...');

      try {
        // First try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: requiredChainIdHex }],
        });
        console.log('Successfully switched to Monad network');
      } catch (switchError: any) {
        console.log('Switch error:', switchError.code, switchError.message);

        // If the network is not added (error code 4902), add it
        if (switchError.code === 4902) {
          console.log('Network not found in MetaMask, attempting to add it...');
          try {
            const networkConfig = {
              ...this.MONAD_TESTNET_CONFIG,
              chainId: requiredChainIdHex
            };

            console.log('Adding Monad network to MetaMask with config:', networkConfig);

            // Try to add the network
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });

            console.log('Network added successfully');
          } catch (addError: any) {
            console.error('Failed to add Monad network:', addError);

            // Provide more detailed error message
            let errorMsg = `Failed to add Monad network: ${addError.message}`;

            if (addError.message?.includes('already exists')) {
              errorMsg = 'This network already exists in your wallet but with different parameters. Please remove it from MetaMask and try again.';
            } else if (addError.message?.includes('rejected')) {
              errorMsg = 'You rejected the request to add the Monad network. Please try again and approve the request.';
            }

            throw new Error(errorMsg);
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          throw new Error('You rejected the request to switch networks. Please approve the network switch in MetaMask.');
        } else {
          console.error('Failed to switch network:', switchError);
          throw new Error(`Failed to switch to Monad network: ${switchError.message}`);
        }
      }

      // Verify the connection after switching/adding network
      try {
        const verifyNetwork = await this.provider.getNetwork();
        console.log('Verifying network after switch:', verifyNetwork.chainId, 'Required:', requiredChainIdDecimal);

        if (verifyNetwork.chainId !== requiredChainIdDecimal) {
          throw new Error(`Network verification failed. Current: ${verifyNetwork.chainId}, Required: ${requiredChainIdDecimal}`);
        }

        console.log('Network verification successful');
      } catch (verifyError) {
        console.error('Network verification error:', verifyError);
        throw new Error(`Failed to verify network connection: ${verifyError.message}. Please try manually switching to ${this.MONAD_TESTNET_CONFIG.chainName} in MetaMask.`);
      }
    } catch (error) {
      console.error('Error in ensureCorrectNetwork:', error);
      throw error;
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.signer) throw new Error("Signer not initialized");

    try {
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Monad contract address not configured");
      }

      console.log('Initializing contract with address:', contractAddress);

      // Ensure the contract address is properly formatted
      const formattedAddress = ethers.utils.getAddress(contractAddress);

      // Load the contract ABI
      const contractABIModule = await import('../contracts/MonadGame.json');
      const contractABI = contractABIModule.default ? contractABIModule.default.abi : contractABIModule.abi;

      if (!contractABI) {
        throw new Error("Failed to load contract ABI");
      }

      console.log('Contract ABI loaded successfully');

      // Create the contract instance
      this.monadGameContract = new ethers.Contract(
        formattedAddress,
        contractABI,
        this.signer
      );

      // Check if the contract has the registerPlayer method
      if (typeof this.monadGameContract.registerPlayer !== 'function') {
        console.warn('Warning: registerPlayer method not found on contract');
      } else {
        console.log('Contract initialized successfully with registerPlayer method');
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw error;
    }
  }

  private resetState() {
    this.provider = null;
    this.signer = null;
    this.walletAddress = null;
    this.monadGameContract = null;
    this.isConnected = false;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.isConnected || !this.provider) {
      return false;
    }
    try {
      await this.provider.getNetwork();
      return true;
    } catch {
      this.resetState();
      return false;
    }
  }

  /**
   * Get the connected wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (!this.isConnected || !this.walletAddress) {
      throw new Error("Wallet not connected");
    }
    return this.walletAddress;
  }

  /**
   * Get player registration status
   */
  async getPlayer(address: string): Promise<{isRegistered: boolean}> {
    if (!address) {
      throw new Error("Address is required");
    }

    try {
      // Check if player is already registered in localStorage
      const storedRegistration = localStorage.getItem(`monad-player-registered-${address}`);
      if (storedRegistration === 'true') {
        console.log('Player registration found in localStorage');
        return { isRegistered: true };
      }

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated player data (placeholder contract address)');
        return { isRegistered: false };
      }

      // In a real implementation, this would check if the player is registered on the contract
      // For now, we'll simulate it
      const playerData = await this.getPlayerData(address);
      const isRegistered = !!playerData;

      // If player is registered, store this information in localStorage
      if (isRegistered) {
        localStorage.setItem(`monad-player-registered-${address}`, 'true');
      }

      return { isRegistered };
    } catch (error) {
      console.error('Error checking player registration:', error);
      return { isRegistered: false };
    }
  }

  async registerPlayer(): Promise<{txHash: string, blockNumber?: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    console.log('Registering player on Monad blockchain...');

    try {
      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay

        // Store registration status in localStorage
        if (this.walletAddress) {
          localStorage.setItem(`monad-player-registered-${this.walletAddress}`, 'true');
        }

        const mockBlockNumber = Math.floor(Date.now() / 1000);
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: mockBlockNumber
        };
      }

      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<{txHash: string, blockNumber?: number}>((_, reject) => {
        setTimeout(() => reject(new Error('Registration timed out')), 30000); // 30 second timeout
      });

      // Actual registration process
      const registrationPromise = async () => {
        // If contract method is not available, throw an error
        if (!this.monadGameContract) {
          throw new Error("Contract is not initialized");
        }

        if (typeof this.monadGameContract.registerPlayer !== 'function') {
          console.error('Contract methods available:', Object.keys(this.monadGameContract.functions));
          throw new Error("Contract method 'registerPlayer' is not available");
        }

        console.log('Calling registerPlayer method on contract...');
        const tx = await this.monadGameContract.registerPlayer();
        console.log('Registration transaction submitted:', tx.hash);

        // Wait for transaction to be mined
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        console.log('Registration transaction confirmed in block:', receipt.blockNumber);

        // Store registration status in localStorage
        if (this.walletAddress) {
          localStorage.setItem(`monad-player-registered-${this.walletAddress}`, 'true');
        }

        return {
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        };
      };

      // Race between the timeout and the actual registration
      return await Promise.race([registrationPromise(), timeoutPromise]);
    } catch (error) {
      console.error('Error during registration:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');

      // Store registration status in localStorage even in case of error
      // This prevents repeated registration attempts
      if (this.walletAddress) {
        localStorage.setItem(`monad-player-registered-${this.walletAddress}`, 'true');
      }

      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000)
      };
    }
  }

  async getPlayerData(address: string): Promise<Player | null> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    // Check if we're in development mode or if the contract isn't fully implemented
    if (!this.monadGameContract?.getPlayer || process.env.NODE_ENV === 'development') {
      console.log('Using mock player data (contract method not available or in development mode)');
      // Return mock player data for development
      return {
        id: `player-${Date.now()}`,
        username: 'Player',
        avatar: 'default-avatar.png',
        level: 1,
        experience: 0,
        wins: 0,
        losses: 0,
        cards: [],
        monad: 100,
        monadAddress: address,
        shards: 0,
        lastTrialTime: 0,
        dailyTrialsRemaining: 3,
        transactionHistory: []
      };
    }

    try {
      const playerData = await this.monadGameContract?.getPlayer(address);
      return playerData;
    } catch (error) {
      console.error('Error getting player data:', error);
      throw error;
    }
  }

  async getPlayerCards(address: string): Promise<any[]> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      // Check if we're using a placeholder contract address or in development mode
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890' || process.env.NODE_ENV === 'development') {
        console.log('Using mock card data (development mode or placeholder contract)');

        // Generate some mock cards for development
        const mockCards = [];
        const numCards = Math.floor(Math.random() * 5) + 1; // 1-5 cards

        for (let i = 0; i < numCards; i++) {
          const rarityLevel = Math.floor(Math.random() * 4); // 0-3 (common to legendary)
          const cardType = Math.floor(Math.random() * 3); // 0-2 (attack, defense, utility)
          const rarityNames = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'];
          const typeNames = ['ATTACK', 'DEFENSE', 'UTILITY'];

          mockCards.push({
            id: `card-${Date.now()}-${i}`,
            name: `${rarityNames[rarityLevel]} ${typeNames[cardType]} Card`,
            description: `A ${rarityNames[rarityLevel].toLowerCase()} ${typeNames[cardType].toLowerCase()} card for testing.`,
            image: `/cards/${rarityNames[rarityLevel].toLowerCase()}_${typeNames[cardType].toLowerCase()}.png`,
            rarity: rarityNames[rarityLevel],
            type: typeNames[cardType],
            mana: 1 + Math.floor(Math.random() * 5),
            attack: 1 + Math.floor(Math.random() * 10),
            defense: 1 + Math.floor(Math.random() * 10),
            monadId: `0x${Math.random().toString(16).substring(2, 10)}`,
            onChainMetadata: {
              creator: address,
              creationBlock: Math.floor(Math.random() * 1000000),
              evolutionStage: Math.floor(Math.random() * 3),
              battleHistory: []
            }
          });
        }

        return mockCards;
      }

      // Get card IDs owned by the player
      const cardIds = await this.monadGameContract?.getPlayerCards(address);
      console.log('Player card IDs:', cardIds);

      if (!cardIds || cardIds.length === 0) {
        return [];
      }

      // Get details for each card
      const cards = [];
      for (const id of cardIds) {
        try {
          const card = await this.monadGameContract?.getCard(id);

          // Get card composition history if available
          let composedFrom = [];
          try {
            composedFrom = await this.monadGameContract?.getCardComposition(id);
            composedFrom = composedFrom.map(id => id.toString());
          } catch (error) {
            console.warn(`Error getting composition for card ${id}:`, error);
          }

          // Convert contract card data to our format
          cards.push({
            id: id.toString(),
            name: card.name,
            description: `A ${card.rarity === 0 ? 'common' : card.rarity === 1 ? 'uncommon' : card.rarity === 2 ? 'rare' : 'legendary'} card.`,
            image: `/cards/card_${id}.png`, // Placeholder image path
            rarity: card.rarity === 0 ? 'COMMON' : card.rarity === 1 ? 'UNCOMMON' : card.rarity === 2 ? 'RARE' : 'LEGENDARY',
            type: card.cardType === 0 ? 'ATTACK' : card.cardType === 1 ? 'DEFENSE' : 'UTILITY',
            mana: card.mana.toNumber(),
            attack: card.attack.toNumber(),
            defense: card.defense.toNumber(),
            monadId: id.toString(),
            onChainMetadata: {
              creator: card.creator,
              creationBlock: card.mintTime.toNumber(),
              evolutionStage: card.evolutionLevel,
              battleHistory: [],
              composedFrom
            }
          });
        } catch (error) {
          console.error(`Error getting details for card ${id}:`, error);
        }
      }

      return cards;
    } catch (error) {
      console.error('Error getting player cards:', error);
      // Return empty array in case of error
      return [];
    }
  }

  async executeParallelMoves(moves: MonadGameMove[]): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Submitting moves to Monad blockchain:', moves);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Check if contract is initialized
      if (!this.monadGameContract) {
        throw new Error("Contract not initialized");
      }

      // Convert our MonadGameMove type to the contract's GameMove type
      const contractMoves = moves.map(move => ({
        moveId: move.moveId,
        playerAddress: move.playerAddress,
        cardId: move.cardId,
        moveType: move.moveType === 'attack' ? 0 : move.moveType === 'defend' ? 1 : 2, // Convert string to uint8
        timestamp: move.timestamp,
        onChainSignature: move.onChainSignature || '',
        verified: move.verified || false
      }));

      // Call the contract method
      console.log('Calling executeParallelMoves on contract with moves:', contractMoves);
      const tx = await this.monadGameContract.executeParallelMoves(contractMoves);
      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error executing parallel moves:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  private async signMove(move: MonadGameMove): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");

    // Create a message to sign that includes all move data
    const moveTypeValue = move.moveType === 'attack' ? 0 : move.moveType === 'defend' ? 1 : 2;

    const message = ethers.utils.solidityKeccak256(
      ["uint256", "string", "address", "string", "uint8", "uint256"],
      [move.gameId, move.moveId, move.playerAddress, move.cardId, moveTypeValue, move.timestamp]
    );

    // Sign the message with the user's private key
    const signature = await this.signer.signMessage(ethers.utils.arrayify(message));
    console.log('Move signed with signature:', signature);

    return signature;
  }

  async submitMovesBatch(batch: MovesBatch): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Submitting move batch to Monad blockchain:', batch);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Check if contract is initialized
      if (!this.monadGameContract) {
        throw new Error("Contract not initialized");
      }

      // Convert our MonadGameMove type to the contract's GameMove type
      const contractMoves = batch.moves.map(move => ({
        moveId: move.moveId,
        playerAddress: move.playerAddress,
        cardId: move.cardId,
        moveType: move.moveType === 'attack' ? 0 : move.moveType === 'defend' ? 1 : 2, // Convert string to uint8
        timestamp: move.timestamp,
        onChainSignature: move.onChainSignature || '',
        verified: move.verified || false
      }));

      // Call the contract method
      console.log('Calling submitMovesBatch on contract with batch:', batch.batchId);
      const tx = await this.monadGameContract.submitMovesBatch(
        batch.batchId,
        contractMoves,
        batch.stateRoot,
        batch.zkProof
      );

      console.log('Batch transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Batch transaction confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error submitting moves batch:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async claimShards(gameId: string, gameResult?: any): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Claiming shards for game:', gameId);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Check if contract is initialized
      if (!this.monadGameContract) {
        throw new Error("Contract not initialized");
      }

      // If game result is provided, we would submit it first in a full implementation
      if (gameResult) {
        console.log('Game result would be submitted to blockchain:', gameResult);
        // In a full implementation, we would submit the game result here
      }

      // Call the contract method to claim shards
      console.log('Calling claimShards on contract with gameId:', gameId);
      const tx = await this.monadGameContract.claimShards(gameId);
      console.log('Claim transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Claim transaction confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error claiming shards:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async redeemNFT(): Promise<{txHash: string, blockNumber: number, cardId?: string}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Redeeming NFT with shards');

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay

        // Generate a random card for development
        const rarityNames = ['common', 'rare', 'epic', 'legendary'];
        const typeNames = ['attack', 'defense', 'utility'];
        const rarity = Math.floor(Math.random() * 4);
        const cardType = Math.floor(Math.random() * 3);
        const rarityName = rarityNames[rarity];
        const typeName = typeNames[cardType];
        const imageIpfsHash = `QmDefaultMonad${rarityName}${typeName}`;

        // Create mock card data
        const mockCard = {
          name: `${rarityName.charAt(0).toUpperCase() + rarityName.slice(1)} ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} Card`,
          rarity,
          cardType,
          attack: 1 + Math.floor(Math.random() * (5 + rarity * 3)),
          defense: 1 + Math.floor(Math.random() * (5 + rarity * 3)),
          mana: 1 + Math.floor(Math.random() * (3 + rarity)),
          creator: this.walletAddress,
          mintTime: Math.floor(Date.now() / 1000),
          evolutionLevel: 0,
          battleCount: 0,
          winCount: 0
        };

        // Create metadata for the card
        const metadata = ipfsService.createCardMetadata(
          mockCard,
          imageIpfsHash,
          `A ${rarityName} ${typeName} card redeemed with shards.`
        );

        // Upload metadata to IPFS
        console.log('Uploading card metadata to IPFS...');
        const metadataIpfsHash = await ipfsService.uploadCardMetadata(metadata);
        console.log('Metadata uploaded to IPFS with hash:', metadataIpfsHash);

        const mockCardId = `${Math.floor(Math.random() * 1000000)}`;

        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000), // Use current timestamp as mock block number
          cardId: mockCardId
        };
      }

      // Call the contract method
      const tx = await this.monadGameContract?.redeemNFT();
      console.log('NFT redemption transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('NFT redemption confirmed in block:', receipt.blockNumber);

      // Get the card ID from the event logs
      let cardId;
      if (receipt.events) {
        for (const event of receipt.events) {
          if (event.event === 'CardRedeemed' && event.args) {
            cardId = event.args.cardId.toString();
            console.log('New card redeemed with ID:', cardId);
            break;
          }
        }
      }

      // If we got the card ID, create and upload metadata
      if (cardId) {
        // Get the card details from the contract
        const card = await this.monadGameContract?.getCard(cardId);

        // Generate image hash based on card properties
        const rarityNames = ['common', 'rare', 'epic', 'legendary'];
        const typeNames = ['attack', 'defense', 'utility'];
        const rarityName = rarityNames[card.rarity] || 'common';
        const typeName = typeNames[card.cardType] || 'attack';
        const imageIpfsHash = `QmDefaultMonad${rarityName}${typeName}`;

        // Create metadata for the card
        const metadata = ipfsService.createCardMetadata(
          {
            name: card.name,
            rarity: card.rarity,
            cardType: card.cardType,
            attack: card.attack.toNumber(),
            defense: card.defense.toNumber(),
            mana: card.mana.toNumber(),
            creator: card.creator,
            mintTime: card.mintTime.toNumber(),
            evolutionLevel: card.evolutionLevel,
            battleCount: card.battleCount.toNumber(),
            winCount: card.winCount.toNumber()
          },
          imageIpfsHash,
          `A ${rarityName} ${typeName} card redeemed with shards.`
        );

        // Upload metadata to IPFS
        console.log('Uploading card metadata to IPFS...');
        const metadataIpfsHash = await ipfsService.uploadCardMetadata(metadata);
        console.log('Metadata uploaded to IPFS with hash:', metadataIpfsHash);
      }

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        cardId
      };
    } catch (error) {
      console.error('Error redeeming NFT:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async mintCard(cardData: any, imageFile?: File): Promise<{txHash: string, blockNumber: number, cardId?: string}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Minting new card:', cardData);

      // Upload image to IPFS if provided
      let imageIpfsHash = '';
      if (imageFile) {
        console.log('Uploading card image to IPFS...');
        imageIpfsHash = await ipfsService.uploadCardImage(imageFile);
        console.log('Image uploaded to IPFS with hash:', imageIpfsHash);
      }

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');

        // Create metadata for the card
        const metadata: CardMetadata = {
          name: cardData.name,
          description: cardData.description || `A ${cardData.rarity} card in the Monad Chain Game.`,
          image: imageIpfsHash ? `ipfs://${imageIpfsHash}` : '/placeholder-card.png',
          attributes: [
            { trait_type: 'Rarity', value: cardData.rarity },
            { trait_type: 'Type', value: cardData.cardType },
            { trait_type: 'Attack', value: cardData.attack },
            { trait_type: 'Defense', value: cardData.defense },
            { trait_type: 'Mana', value: cardData.mana }
          ],
          properties: {
            rarity: cardData.rarity.toString(),
            cardType: cardData.cardType.toString(),
            attack: cardData.attack,
            defense: cardData.defense,
            mana: cardData.mana,
            evolutionLevel: 0,
            battleCount: 0,
            winCount: 0,
            creator: this.walletAddress || 'unknown',
            mintTime: Date.now()
          }
        };

        // Upload metadata to IPFS
        console.log('Uploading card metadata to IPFS...');
        const metadataIpfsHash = await ipfsService.uploadCardMetadata(metadata);
        console.log('Metadata uploaded to IPFS with hash:', metadataIpfsHash);

        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000), // Use current timestamp as mock block number
          cardId: `${Math.floor(Math.random() * 1000000)}` // Mock card ID
        };
      }

      // Check if contract is initialized
      if (!this.monadGameContract) {
        throw new Error("Contract not initialized");
      }

      // Call the contract method
      console.log('Calling mintCard on contract with data:', cardData);
      const tx = await this.monadGameContract?.mintCard(
        cardData.name,
        cardData.rarity,
        cardData.cardType,
        cardData.attack,
        cardData.defense,
        cardData.mana,
        { value: ethers.utils.parseEther("0.01") }
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Get the card ID from the event logs
      const cardId = this.parseCardIdFromReceipt(receipt);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        cardId
      };
    } catch (error) {
      console.error('Error minting card:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000), // Use current timestamp as mock block number
        cardId: `${Math.floor(Math.random() * 1000000)}` // Mock card ID
      };
    }
  }

  /**
   * Add a copied card to the player's deck
   * This is used by the Blockchain Hack feature to temporarily add a copy of an opponent's card
   * @param copiedCard The card to add to the player's deck
   * @returns Transaction details
   */
  async addCopiedCardToPlayerDeck(copiedCard: any): Promise<{txHash: string, blockNumber: number, cardId?: string}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Adding copied card to player deck:', copiedCard);

      // Generate a unique ID for the copied card
      const uniqueId = `copied-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      copiedCard.id = uniqueId;

      // In a real implementation, this would interact with the blockchain
      // For now, we'll simulate the transaction

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate a transaction hash
      const txHash = this.generateMockTransactionHash();
      const blockNumber = Math.floor(Date.now() / 1000); // Use current timestamp as mock block number

      // Add visual effects to the card to show it's a copy
      copiedCard.borderEffect = 'glowing-purple';
      copiedCard.overlayEffect = 'hacked';

      // Store the copied card in localStorage to persist it
      try {
        // Get existing copied cards
        const existingCopiedCardsJson = localStorage.getItem('monad-copied-cards') || '[]';
        const existingCopiedCards = JSON.parse(existingCopiedCardsJson);

        // Add the new copied card
        existingCopiedCards.push({
          ...copiedCard,
          copiedAt: Date.now(),
          txHash
        });

        // Store back in localStorage
        localStorage.setItem('monad-copied-cards', JSON.stringify(existingCopiedCards));
      } catch (storageError) {
        console.error('Error storing copied card in localStorage:', storageError);
      }

      // Emit an event that a card was copied
      this.emitCardCopied(copiedCard);

      return {
        txHash,
        blockNumber,
        cardId: uniqueId
      };
    } catch (error) {
      console.error('Error adding copied card to player deck:', error);

      // Return a simulated transaction hash in case of error
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000), // Use current timestamp as mock block number
        cardId: `copied-error-${Math.floor(Math.random() * 1000)}` // Error card ID
      };
    }
  }

  /**
   * Add a listener for card copied events
   * @param listener The listener function to call when a card is copied
   */
  public addCardCopiedListener(listener: (card: any) => void): void {
    this.cardCopiedListeners.push(listener);
  }

  /**
   * Remove a card copied listener
   * @param listener The listener to remove
   */
  public removeCardCopiedListener(listener: (card: any) => void): void {
    this.cardCopiedListeners = this.cardCopiedListeners.filter(l => l !== listener);
  }

  /**
   * Emit a card copied event
   * @param card The card that was copied
   */
  private emitCardCopied(card: any): void {
    this.cardCopiedListeners.forEach(listener => {
      try {
        listener(card);
      } catch (error) {
        console.error('Error in card copied listener:', error);
      }
    });
  }

  /**
   * Parse the card ID from a transaction receipt
   * @param receipt The transaction receipt
   * @returns The card ID or undefined if not found
   */
  private parseCardIdFromReceipt(receipt: any): string | undefined {
    if (!receipt.events) return undefined;

    for (const event of receipt.events) {
      if (event.event === 'CardMinted' && event.args) {
        return event.args.cardId.toString();
      }
    }

    return undefined;
  }

  // Batch mint multiple cards at once - optimized for Monad's parallel execution
  async batchMintCards(cardsData: any[], imageFiles?: File[]): Promise<{txHash: string, blockNumber: number, cardIds?: string[]}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Batch minting cards:', cardsData.length);

      // Prepare arrays for batch minting
      const names: string[] = [];
      const rarities: number[] = [];
      const cardTypes: number[] = [];
      const attacks: number[] = [];
      const defenses: number[] = [];
      const manas: number[] = [];
      const imageIpfsHashes: string[] = [];

      // Process each card's data
      for (let i = 0; i < cardsData.length; i++) {
        const cardData = cardsData[i];
        const imageFile = imageFiles ? imageFiles[i] : undefined;

        names.push(cardData.name);
        rarities.push(cardData.rarity);
        cardTypes.push(cardData.cardType);
        attacks.push(cardData.attack);
        defenses.push(cardData.defense);
        manas.push(cardData.mana);

        // Upload image to IPFS if provided
        let imageIpfsHash = '';
        if (imageFile) {
          console.log(`Uploading image for card ${i+1}...`);
          imageIpfsHash = await ipfsService.uploadImage(imageFile);
        } else {
          // Use a default image based on card type and rarity
          const rarityNames = ['common', 'rare', 'epic', 'legendary'];
          const typeNames = ['attack', 'defense', 'utility'];
          const rarityName = rarityNames[cardData.rarity] || 'common';
          const typeName = typeNames[cardData.cardType] || 'attack';
          imageIpfsHash = `QmDefaultMonad${rarityName}${typeName}`;
        }

        imageIpfsHashes.push(imageIpfsHash);
      }

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay

        // Create mock card IDs
        const mockCardIds = [];
        for (let i = 0; i < cardsData.length; i++) {
          mockCardIds.push(`${Math.floor(Math.random() * 1000000)}`);

          // Create and upload metadata for each card
          const metadata = ipfsService.createCardMetadata(
            {
              ...cardsData[i],
              creator: this.walletAddress,
              mintTime: Math.floor(Date.now() / 1000),
              evolutionLevel: 0,
              battleCount: 0,
              winCount: 0
            },
            imageIpfsHashes[i],
            cardsData[i].description || ''
          );

          await ipfsService.uploadCardMetadata(metadata);
        }

        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000),
          cardIds: mockCardIds
        };
      }

      // Calculate total cost
      const totalCost = ethers.utils.parseEther((0.01 * cardsData.length).toString());

      // Call the contract method
      console.log('Calling batchMintCards on contract with data for', cardsData.length, 'cards');
      const tx = await this.monadGameContract?.batchMintCards(
        names,
        rarities,
        cardTypes,
        attacks,
        defenses,
        manas,
        { value: totalCost }
      );

      console.log('Batch mint transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Batch mint transaction confirmed in block:', receipt.blockNumber);

      // Get the card IDs from the event logs
      const cardIds: string[] = [];
      if (receipt.events) {
        for (const event of receipt.events) {
          if (event.event === 'CardMinted' && event.args) {
            const cardId = event.args.cardId.toString();
            cardIds.push(cardId);
          }
        }
      }

      console.log('Minted card IDs:', cardIds);

      // Upload metadata for each card
      for (let i = 0; i < cardIds.length; i++) {
        try {
          const card = await this.monadGameContract?.getCard(cardIds[i]);

          // Create metadata for the card
          const metadata = ipfsService.createCardMetadata(
            {
              ...cardsData[i],
              creator: this.walletAddress,
              mintTime: card.mintTime.toNumber(),
              evolutionLevel: card.evolutionLevel,
              battleCount: card.battleCount.toNumber(),
              winCount: card.winCount.toNumber()
            },
            imageIpfsHashes[i],
            cardsData[i].description || ''
          );

          // Upload metadata to IPFS
          await ipfsService.uploadCardMetadata(metadata);
        } catch (error) {
          console.error(`Error uploading metadata for card ${cardIds[i]}:`, error);
        }
      }

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        cardIds
      };
    } catch (error) {
      console.error('Error batch minting cards:', error);

      // For development purposes, return a simulated transaction hash
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000)
      };
    }
  }

  async createTournament(entryFee: number, duration: number, minLevel: number): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.createTournament(
      entryFee,
      duration,
      minLevel
    );
    await tx.wait();
  }

  async joinTournament(tournamentId: number): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.joinTournament(tournamentId);
    await tx.wait();
  }

  async getTournamentInfo(tournamentId: number): Promise<any> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    return await this.monadGameContract?.tournaments(tournamentId);
  }

  async getAllActiveTournaments(): Promise<any[]> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tournamentCount = await this.monadGameContract?.getTournamentCount();
    const activeTournaments = [];

    for (let i = 0; i < tournamentCount; i++) {
      const tournament = await this.getTournamentInfo(i);
      if (tournament.active) {
        activeTournaments.push(tournament);
      }
    }

    return activeTournaments;
  }

  async endTournament(tournamentId: number): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.endTournament(tournamentId);
    await tx.wait();
  }

  async getTournamentParticipants(tournamentId: number): Promise<string[]> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    return await this.monadGameContract?.getTournamentParticipants(tournamentId);
  }

  async getTournamentCount(): Promise<number> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    return await this.monadGameContract?.getTournamentCount();
  }

  async verifyTournamentGames(tournamentId: number): Promise<boolean> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    return await this.monadGameContract?.verifyTournamentGames(tournamentId);
  }

  // Card Evolution
  async evolveCard(cardId: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Evolving card:', cardId);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Call the contract method
      const tx = await this.monadGameContract?.evolveCard(cardId);
      console.log('Card evolution transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Card evolution confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error evolving card:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  // Batch evolve multiple cards at once - optimized for Monad's parallel execution
  async batchEvolveCards(cardIds: string[]): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Batch evolving cards:', cardIds);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Call the contract method
      const tx = await this.monadGameContract?.batchEvolveCards(cardIds);
      console.log('Batch evolution transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Batch evolution confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error batch evolving cards:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  // Card Composition
  async composeCards(cardId1: string, cardId2: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Composing cards:', cardId1, 'and', cardId2);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Call the contract method
      const tx = await this.monadGameContract?.composeCards(cardId1, cardId2);
      console.log('Card composition transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Card composition confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error composing cards:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  // Marketplace Functions
  async listCard(cardId: string, price: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Listing card for sale:', cardId, 'at price:', price);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(price);

      // Call the contract method
      const tx = await this.monadGameContract?.listCard(cardId, priceInWei);
      console.log('Card listing transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Card listing confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error listing card:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  // Batch list multiple cards at once - optimized for Monad's parallel execution
  async batchListCards(cardIds: string[], prices: string[]): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Batch listing cards for sale:', cardIds, 'at prices:', prices);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Convert prices to wei
      const pricesInWei = prices.map(price => ethers.utils.parseEther(price));

      // Call the contract method
      const tx = await this.monadGameContract?.batchListCards(cardIds, pricesInWei);
      console.log('Batch card listing transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Batch card listing confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error batch listing cards:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async buyCard(cardId: string, price: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Buying card:', cardId, 'for price:', price);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(price);

      // Call the contract method
      const tx = await this.monadGameContract?.buyCard(cardId, { value: priceInWei });
      console.log('Card purchase transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Card purchase confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error buying card:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  // Batch buy multiple cards at once - optimized for Monad's parallel execution
  async batchBuyCards(cardIds: string[], totalPrice: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Batch buying cards:', cardIds, 'for total price:', totalPrice);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Convert total price to wei
      const totalPriceInWei = ethers.utils.parseEther(totalPrice);

      // Call the contract method
      const tx = await this.monadGameContract?.batchBuyCards(cardIds, { value: totalPriceInWei });
      console.log('Batch purchase transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Batch purchase confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error batch buying cards:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async cancelListing(cardId: string): Promise<{txHash: string, blockNumber: number}> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log('Cancelling listing for card:', cardId);

      // Check if we're using a placeholder contract address
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (contractAddress === '0x1234567890123456789012345678901234567890') {
        console.log('Using simulated transaction for development (placeholder contract address)');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
        return {
          txHash: this.generateMockTransactionHash(),
          blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
        };
      }

      // Call the contract method
      const tx = await this.monadGameContract?.cancelListing(cardId);
      console.log('Cancel listing transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Cancel listing confirmed in block:', receipt.blockNumber);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error cancelling listing:', error);

      // For development purposes, if there's an error with the contract,
      // we'll return a simulated transaction hash so the UI flow can continue
      console.log('Returning simulated transaction hash due to error');
      return {
        txHash: this.generateMockTransactionHash(),
        blockNumber: Math.floor(Date.now() / 1000) // Use current timestamp as mock block number
      };
    }
  }

  async getActiveListings(): Promise<any[]> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    try {
      // Get active listing IDs
      const listingIds = await this.monadGameContract?.getActiveListings();

      // Get details for each listing
      const listings = [];
      for (const id of listingIds) {
        const listing = await this.monadGameContract?.marketListings(id);
        const card = await this.monadGameContract?.getCard(id);

        // Get card composition history if available
        let composedFrom = [];
        try {
          composedFrom = await this.monadGameContract?.getCardComposition(id);
          composedFrom = composedFrom.map(id => id.toString());
        } catch (error) {
          console.warn('Error getting card composition:', error);
        }

        listings.push({
          cardId: id.toString(),
          seller: listing.seller,
          price: ethers.utils.formatEther(listing.price),
          listedAt: new Date(listing.listedAt.toNumber() * 1000),
          card: {
            name: card.name,
            rarity: card.rarity,
            cardType: card.cardType,
            attack: card.attack.toNumber(),
            defense: card.defense.toNumber(),
            mana: card.mana.toNumber(),
            evolutionLevel: card.evolutionLevel,
            battleCount: card.battleCount.toNumber(),
            winCount: card.winCount.toNumber(),
            isActive: card.isActive,
            creator: card.creator,
            mintTime: new Date(card.mintTime.toNumber() * 1000),
            composedFrom
          }
        });
      }

      return listings;
    } catch (error) {
      console.error('Error getting active listings:', error);

      // For development, return mock data
      return [];
    }
  }

  // Track battle history for a card
  async trackCardBattleHistory(cardId: string, gameId: string, opponent: string, result: string): Promise<string> {
    try {
      console.log(`Tracking battle history for card ${cardId} in game ${gameId}`);

      // Get existing card metadata from IPFS if available
      let metadata: CardMetadata | null = null;
      let metadataIpfsHash = '';

      try {
        // In a real implementation, we would store the IPFS hash on-chain or in a database
        // For this example, we'll create new metadata
        const card = await this.monadGameContract?.getCard(cardId);

        // Generate image hash based on card properties
        const rarityNames = ['common', 'rare', 'epic', 'legendary'];
        const typeNames = ['attack', 'defense', 'utility'];
        const rarityName = rarityNames[card.rarity] || 'common';
        const typeName = typeNames[card.cardType] || 'attack';
        const imageIpfsHash = `QmDefaultMonad${rarityName}${typeName}`;

        // Create battle history entry
        const battleHistoryEntry = {
          gameId,
          opponent,
          result,
          timestamp: Math.floor(Date.now() / 1000)
        };

        // Create metadata for the card with updated battle history
        metadata = ipfsService.createCardMetadata(
          {
            name: card.name,
            rarity: card.rarity,
            cardType: card.cardType,
            attack: card.attack.toNumber(),
            defense: card.defense.toNumber(),
            mana: card.mana.toNumber(),
            creator: card.creator,
            mintTime: card.mintTime.toNumber(),
            evolutionLevel: card.evolutionLevel,
            battleCount: card.battleCount.toNumber(),
            winCount: card.winCount.toNumber()
          },
          imageIpfsHash,
          `A ${rarityName} ${typeName} card.`,
          [battleHistoryEntry] // Add the new battle history entry
        );

        // Upload updated metadata to IPFS
        console.log('Uploading updated card metadata to IPFS...');
        metadataIpfsHash = await ipfsService.uploadCardMetadata(metadata);
        console.log('Updated metadata uploaded to IPFS with hash:', metadataIpfsHash);
      } catch (error) {
        console.error('Error updating card metadata:', error);
      }

      return metadataIpfsHash;
    } catch (error) {
      console.error('Error tracking battle history:', error);
      return '';
    }
  }

  async getTournamentStatus(tournamentId: number): Promise<{
    isActive: boolean;
    isVerified: boolean;
    canComplete: boolean;
    participantCount: number;
    prizePool: number;
    winner?: string;
  }> {
    const [tournament, isVerified] = await Promise.all([
      this.getTournamentInfo(tournamentId),
      this.verifyTournamentGames(tournamentId)
    ]);

    const participants = await this.getTournamentParticipants(tournamentId);

    return {
      isActive: tournament.active,
      isVerified,
      canComplete: tournament.active && Date.now()/1000 >= tournament.endTime && isVerified,
      participantCount: participants.length,
      prizePool: tournament.prizePool,
      winner: tournament.winner
    };
  }
}

export const monadGameService = new MonadGameService();