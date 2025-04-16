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
      await this.provider.send("eth_requestAccounts", []);
      this.signer = this.provider.getSigner();
      this.walletAddress = await this.signer.getAddress();

      const requiredNetwork = import.meta.env.VITE_NETWORK_ID;
      const currentNetwork = await this.provider.getNetwork();
      
      if (currentNetwork.chainId !== parseInt(requiredNetwork, 16)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredNetwork }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            throw new Error(`Please add the ${import.meta.env.VITE_NETWORK_NAME} network to your wallet`);
          }
          throw switchError;
        }
      }

      const contractAddress = import.meta.env.VITE_MONAD_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Monad contract address not configured");
      }

      const contractABI = (await import('../contracts/MonadGame.json')).default.abi;
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

    const playerData = await this.monadGameContract?.getPlayer(address);
    return playerData;
  }

  async executeParallelMoves(moves: MonadGameMove[]): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }
    
    // Now submits each move individually to maintain proper chain of verification
    for (const move of moves) {
      const signature = await this.signMove(move);
      const tx = await this.monadGameContract?.submitMove(
        move.gameId,
        move.cardId,
        move.moveType,
        signature
      );
      await tx.wait();
    }
  }

  private async signMove(move: MonadGameMove): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const message = ethers.utils.solidityKeccak256(
      ["uint256", "string", "address", "string", "uint8", "uint256"],
      [move.gameId, move.moveId, move.playerAddress, move.cardId, move.moveType, move.timestamp]
    );
    
    return await this.signer.signMessage(ethers.utils.arrayify(message));
  }

  async submitMovesBatch(batch: MovesBatch): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }
    
    // Submit and verify each move in the batch
    for (const move of batch.moves) {
      const signature = await this.signMove(move);
      const tx = await this.monadGameContract?.submitMove(
        batch.gameId,
        move.cardId,
        move.moveType,
        signature
      );
      await tx.wait();

      // Verify the move
      const verifyTx = await this.monadGameContract?.verifyMove(batch.gameId, move.moveId);
      await verifyTx.wait();
    }
  }

  async claimShards(gameId: string): Promise<void> {
    if (!this.checkConnection()) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.monadGameContract?.claimReward(gameId);
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

    const tx = await this.monadGameContract?.mintCard(
      cardData.name,
      cardData.rarity,
      cardData.cardType,
      cardData.attack,
      cardData.defense,
      cardData.mana,
      { value: ethers.utils.parseEther("0.01") }
    );
    await tx.wait();
  }
}

export const monadGameService = new MonadGameService();