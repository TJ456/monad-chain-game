import axios from 'axios';

// IPFS Gateway URLs
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

export interface CardMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  properties: {
    rarity: string;
    cardType: string;
    attack: number;
    defense: number;
    mana: number;
    evolutionLevel: number;
    battleCount: number;
    winCount: number;
    creator: string;
    mintTime: number;
    composedFrom?: string[];
    battleHistory?: {
      gameId: string;
      result: string;
      opponent: string;
      timestamp: number;
    }[];
  };
  animation_url?: string;
  background_color?: string;
}

export class IPFSService {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private defaultGateway: string = IPFS_GATEWAYS[0];

  constructor(apiKey?: string, apiSecret?: string) {
    if (apiKey) this.apiKey = apiKey;
    if (apiSecret) this.apiSecret = apiSecret;
  }

  /**
   * Set the IPFS API credentials
   */
  setCredentials(apiKey: string, apiSecret: string): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Set the default IPFS gateway
   */
  setDefaultGateway(gateway: string): void {
    this.defaultGateway = gateway;
  }

  /**
   * Upload card metadata to IPFS
   */
  async uploadCardMetadata(metadata: CardMetadata): Promise<string> {
    try {
      // For development, simulate IPFS upload
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulating IPFS upload in development mode');
        console.log('Metadata:', metadata);
        
        // Generate a fake IPFS hash
        const fakeHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        return fakeHash;
      }
      
      // In production, use Pinata or other IPFS service
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('IPFS API credentials not set');
      }
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.apiKey,
            'pinata_secret_api_key': this.apiSecret
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload an image to IPFS
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // For development, simulate IPFS upload
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulating IPFS image upload in development mode');
        
        // Generate a fake IPFS hash
        const fakeHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        return fakeHash;
      }
      
      // In production, use Pinata or other IPFS service
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('IPFS API credentials not set');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': this.apiKey,
            'pinata_secret_api_key': this.apiSecret
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading image to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get metadata from IPFS
   */
  async getMetadata(ipfsHash: string): Promise<CardMetadata> {
    try {
      // Try each gateway until one works
      for (const gateway of IPFS_GATEWAYS) {
        try {
          const response = await axios.get(`${gateway}${ipfsHash}`);
          return response.data;
        } catch (error) {
          console.warn(`Failed to fetch from ${gateway}, trying next gateway...`);
        }
      }
      
      throw new Error('Failed to fetch metadata from all IPFS gateways');
    } catch (error) {
      console.error('Error getting metadata from IPFS:', error);
      throw error;
    }
  }

  /**
   * Get image URL from IPFS hash
   */
  getImageUrl(ipfsHash: string): string {
    return `${this.defaultGateway}${ipfsHash}`;
  }

  /**
   * Create card metadata object
   */
  createCardMetadata(
    card: any,
    imageIpfsHash: string,
    description: string = '',
    battleHistory: any[] = []
  ): CardMetadata {
    // Map rarity number to string
    const rarityMap = ['Common', 'Rare', 'Epic', 'Legendary'];
    const cardTypeMap = ['Attack', 'Defense', 'Utility'];
    
    // Create attributes array
    const attributes = [
      {
        trait_type: 'Rarity',
        value: rarityMap[card.rarity] || 'Unknown'
      },
      {
        trait_type: 'Type',
        value: cardTypeMap[card.cardType] || 'Unknown'
      },
      {
        trait_type: 'Attack',
        value: card.attack
      },
      {
        trait_type: 'Defense',
        value: card.defense
      },
      {
        trait_type: 'Mana',
        value: card.mana
      },
      {
        trait_type: 'Evolution Level',
        value: card.evolutionLevel
      },
      {
        trait_type: 'Battle Count',
        value: card.battleCount
      },
      {
        trait_type: 'Win Count',
        value: card.winCount
      }
    ];
    
    // Create metadata object
    const metadata: CardMetadata = {
      name: card.name,
      description: description || `A ${rarityMap[card.rarity]} ${cardTypeMap[card.cardType]} card in the Monad Chain Game.`,
      image: `ipfs://${imageIpfsHash}`,
      attributes,
      properties: {
        rarity: rarityMap[card.rarity] || 'Unknown',
        cardType: cardTypeMap[card.cardType] || 'Unknown',
        attack: card.attack,
        defense: card.defense,
        mana: card.mana,
        evolutionLevel: card.evolutionLevel,
        battleCount: card.battleCount,
        winCount: card.winCount,
        creator: card.creator,
        mintTime: card.mintTime,
        battleHistory: battleHistory.map(battle => ({
          gameId: battle.gameId,
          result: battle.result,
          opponent: battle.opponent,
          timestamp: battle.timestamp
        }))
      }
    };
    
    // Add composed from if available
    if (card.composedFrom && card.composedFrom.length > 0) {
      metadata.properties.composedFrom = card.composedFrom.map(id => id.toString());
    }
    
    return metadata;
  }
}

export const ipfsService = new IPFSService();
