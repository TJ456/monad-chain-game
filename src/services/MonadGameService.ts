import { ethers, ContractInterface } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { MonadGameMove, MovesBatch, Player } from '../types/game';

export class MonadGameService {
  private provider: Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private walletAddress: string | null = null;
  private monadGameContract: ethers.Contract | null = null;
  private isConnected: boolean = false;

  async connectWallet(): Promise<string> {
    if (this.isConnected && this.walletAddress) {
      return this.walletAddress;
    }

    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    try {
      this.provider = new Web3Provider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []); // Request wallet connection
      this.signer = this.provider.getSigner();
      this.walletAddress = await this.signer.getAddress();

      // Validate network
      const requiredNetwork = import.meta.env.VITE_NETWORK_ID;
      const currentNetwork = await this.provider.getNetwork();
      
      if (currentNetwork.chainId !== parseInt(requiredNetwork, 16)) {
        // Attempt to switch network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredNetwork }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Chain not added, prompt user to add it
            throw new Error(`Please add the ${import.meta.env.VITE_NETWORK_NAME} network to your wallet`);
          }
          throw switchError;
        }
      }

      // Initialize contract
      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Monad contract address not configured");
      }

      const contractABI = (await import('../contracts/MonadGame.json')).default.abi as ContractInterface;
      this.monadGameContract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.signer
      );

      this.isConnected = true;
      return this.walletAddress;
    } catch (error) {
      this.resetState();
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

  async registerPlayer(): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.registerPlayer();
    await tx.wait();
  }

  async getPlayerData(address: string): Promise<Player | null> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const playerData = await this.monadGameContract?.getPlayerData(address);
    return playerData;
  }

  async executeParallelMoves(moves: MonadGameMove[]): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }
    
    // Submit moves batch for parallel execution
    const batch: MovesBatch = {
      batchId: Date.now().toString(),
      moves,
      stateRoot: "0x" + Math.random().toString(16).slice(2),
      zkProof: "0x" + Math.random().toString(16).slice(2),
      verificationTime: 0.023,
      submittedInBlock: 0
    };

    const tx = await this.monadGameContract?.submitMovesBatch(batch);
    await tx.wait();
  }

  async submitMovesBatch(batch: MovesBatch): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }
    
    const tx = await this.monadGameContract?.submitMovesBatch(batch);
    await tx.wait();
  }

  async claimShards(batchId: string): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.claimShards(batchId);
    await tx.wait();
  }

  async redeemNFT(): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.redeemNFT();
    await tx.wait();
  }

  async mintCard(cardData: any): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.mintCard(cardData);
    await tx.wait();
  }
}

export const monadGameService = new MonadGameService();