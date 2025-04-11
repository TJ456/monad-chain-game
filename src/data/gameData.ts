import { Card, CardRarity, CardType, MarketListing, Player, GameState, MonadTransaction } from "../types/game";

// Mock Monad blockchain transactions
export const monadTransactions: MonadTransaction[] = [
  {
    txHash: "0xf762d9e7f4a3e6b9b719e5c422f4c2afc580ef593893a0b2d39a82ae5686ec75",
    fromAddress: "0x0000000000000000000000000000000000000000",
    toAddress: "0xAbCdEfGh1234567890",
    amount: 100,
    timestamp: Date.now() - 1000000,
    blockHeight: 1420053,
    status: 'confirmed',
    type: 'mint'
  },
  {
    txHash: "0x3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    fromAddress: "0xAbCdEfGh1234567890",
    toAddress: "0x1234567890AbCdEfGh",
    amount: 50,
    timestamp: Date.now() - 500000,
    blockHeight: 1420157,
    status: 'confirmed',
    type: 'transfer'
  },
  {
    txHash: "0x9b8a7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3a2b1c0d9e",
    fromAddress: "0x1234567890AbCdEfGh",
    toAddress: "0xAbCdEfGh1234567890",
    amount: 75,
    timestamp: Date.now() - 250000,
    blockHeight: 1420315,
    status: 'confirmed',
    type: 'battle'
  }
];

// Current game state on Monad blockchain
export const monadGameState: GameState = {
  isOnChain: true,
  currentBlockHeight: 1420500,
  lastSyncedBlock: 1420498,
  pendingTransactions: 2,
  networkStatus: 'connected'
};

export const cards: Card[] = [
  {
    id: "card-1",
    name: "Lightning Strike",
    description: "Deal 5 damage to target player",
    image: "/lightning-strike.png",
    rarity: CardRarity.COMMON,
    type: CardType.ATTACK,
    attack: 5,
    mana: 2,
    monadId: "0xMONAD001",
    onChainMetadata: {
      creator: "0xAbCdEfGh1234567890",
      creationBlock: 1419653,
      evolutionStage: 1,
      battleHistory: [1, 0, 1, 1]
    }
  },
  {
    id: "card-2",
    name: "Mystic Shield",
    description: "Prevent the next 4 damage",
    image: "/mystic-shield.png",
    rarity: CardRarity.COMMON,
    type: CardType.DEFENSE,
    defense: 4,
    mana: 2,
    monadId: "0xMONAD002",
    onChainMetadata: {
      creator: "0x8765432109AbCdEfGh",
      creationBlock: 1419701,
      evolutionStage: 1,
      battleHistory: [1, 1, 0, 0]
    }
  },
  {
    id: "card-3",
    name: "Mana Surge",
    description: "Gain 3 mana crystals",
    image: "/mana-surge.png",
    rarity: CardRarity.RARE,
    type: CardType.UTILITY,
    mana: 1,
    monadId: "0xMONAD003",
    onChainMetadata: {
      creator: "0xAbCdEfGh1234567890",
      creationBlock: 1419842,
      evolutionStage: 2,
      battleHistory: [1, 1, 1, 0]
    }
  },
  {
    id: "card-4",
    name: "Dragon's Breath",
    description: "Deal 8 damage to all enemies",
    image: "/dragons-breath.png",
    rarity: CardRarity.EPIC,
    type: CardType.ATTACK,
    attack: 8,
    mana: 6,
    monadId: "0xMONAD004",
    onChainMetadata: {
      creator: "0x23456789AbCdEfGh01",
      creationBlock: 1419910,
      evolutionStage: 2,
      battleHistory: [1, 1, 1, 1]
    }
  },
  {
    id: "card-5",
    name: "Divine Intervention",
    description: "Restore 10 health points",
    image: "/divine-intervention.png",
    rarity: CardRarity.RARE,
    type: CardType.DEFENSE,
    defense: 10,
    mana: 4,
    monadId: "0xMONAD005",
    onChainMetadata: {
      creator: "0x3456789AbCdEfGh012",
      creationBlock: 1420001,
      evolutionStage: 1,
      battleHistory: [0, 1, 0, 1]
    }
  },
  {
    id: "card-6",
    name: "Monad Chainlink",
    description: "Connect to another player's blockchain",
    image: "/mondo-chainlink.png",
    rarity: CardRarity.LEGENDARY,
    type: CardType.UTILITY,
    mana: 5,
    monadId: "0xMONAD006",
    onChainMetadata: {
      creator: "0xCdEfGh0123456789Ab",
      creationBlock: 1420053,
      evolutionStage: 3,
      battleHistory: [1, 1, 1, 1]
    }
  },
  {
    id: "card-7",
    name: "Crypto Crusher",
    description: "Deal damage equal to your MONAD tokens",
    image: "/crypto-crusher.png",
    rarity: CardRarity.EPIC,
    type: CardType.ATTACK,
    attack: 7,
    mana: 5,
    monadId: "0xMONAD007",
    onChainMetadata: {
      creator: "0xEfGh0123456789AbCd",
      creationBlock: 1420105,
      evolutionStage: 2,
      battleHistory: [1, 0, 1, 0]
    }
  },
  {
    id: "card-8",
    name: "Blockchain Barrier",
    description: "Create an immutable shield",
    image: "/blockchain-barrier.png",
    rarity: CardRarity.LEGENDARY,
    type: CardType.DEFENSE,
    defense: 12,
    mana: 7,
    monadId: "0xMONAD008",
    onChainMetadata: {
      creator: "0xGh0123456789AbCdEf",
      creationBlock: 1420201,
      evolutionStage: 3,
      battleHistory: [1, 1, 1, 1]
    }
  }
];

export const players: Player[] = [
  {
    id: "player-1",
    username: "CryptoKing",
    monadAddress: "0x1234...5678",
    avatar: "/avatar-1.png",
    level: 24,
    experience: 2400,
    wins: 145,
    losses: 52,
    cards: [cards[0], cards[3], cards[5], cards[7]],
    monad: 5000,
    shards: 8,
    dailyTrialsRemaining: 2,
    lastTrialTime: Date.now() - 36 * 60 * 60 * 1000, // 36 hours ago
    transactionHistory: [
      {
        txHash: "0xabc123...",
        type: "BATTLE",
        timestamp: Date.now() - 86400000,
        details: "Won battle against BlockchainQueen"
      },
      {
        txHash: "0xdef456...",
        type: "TRADE",
        timestamp: Date.now() - 172800000,
        details: "Purchased Monad Chainlink for 1200 MONAD"
      }
    ]
  },
  {
    id: "player-2",
    username: "BlockchainQueen",
    monadAddress: "0x8765...4321",
    avatar: "/avatar-2.png",
    level: 19,
    experience: 1900,
    wins: 112,
    losses: 43,
    cards: [cards[1], cards[2], cards[6]],
    monad: 3500,
    shards: 3,
    dailyTrialsRemaining: 3,
    transactionHistory: [
      {
        txHash: "0xghi789...",
        type: "MINT",
        timestamp: Date.now() - 43200000,
        details: "Minted Crypto Crusher"
      }
    ]
  },
  {
    id: "player-3",
    username: "MONADMaster",
    monadAddress: "0x9876...1234",
    avatar: "/avatar-3.png",
    level: 30,
    experience: 3200,
    wins: 210,
    losses: 58,
    cards: [cards[0], cards[1], cards[4], cards[5], cards[7]],
    monad: 8200,
    shards: 15,
    dailyTrialsRemaining: 1,
    lastTrialTime: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    transactionHistory: [
      {
        txHash: "0xjkl012...",
        type: "EVOLVE",
        timestamp: Date.now() - 129600000,
        details: "Evolved Blockchain Barrier to stage 3"
      }
    ]
  },
  {
    id: "player-4",
    username: "TokenTrader",
    monadAddress: "0x5678...9012",
    avatar: "/avatar-4.png",
    level: 15,
    experience: 1500,
    wins: 89,
    losses: 67,
    cards: [cards[2], cards[3]],
    monad: 2100,
    shards: 6,
    dailyTrialsRemaining: 3
  },
  {
    id: "player-5",
    username: "NFTNinja",
    monadAddress: "0x3456...7890",
    avatar: "/avatar-5.png",
    level: 27,
    experience: 2700,
    wins: 163,
    losses: 42,
    cards: [cards[1], cards[6], cards[7]],
    monad: 6300,
    shards: 9,
    dailyTrialsRemaining: 3
  }
];

export const marketListings: MarketListing[] = [
  {
    id: "listing-1",
    card: cards[3],
    price: 500,
    seller: "0x1234...5678",
    timestamp: Date.now() - 86400000, // 1 day ago
    monadContract: "0xMONADMarket001",
    monadTxHash: "0x1a2b3c4d5e6f7g8h9i0j"
  },
  {
    id: "listing-2",
    card: cards[5],
    price: 2500,
    seller: "0x8765...4321",
    timestamp: Date.now() - 43200000, // 12 hours ago
    monadContract: "0xMONADMarket001",
    monadTxHash: "0x2b3c4d5e6f7g8h9i0j1a"
  },
  {
    id: "listing-3",
    card: cards[1],
    price: 150,
    seller: "0x9876...1234",
    timestamp: Date.now() - 21600000, // 6 hours ago
    monadContract: "0xMONADMarket001",
    monadTxHash: "0x3c4d5e6f7g8h9i0j1a2b"
  },
  {
    id: "listing-4",
    card: cards[6],
    price: 850,
    seller: "0x5678...9012",
    timestamp: Date.now() - 7200000, // 2 hours ago
    monadContract: "0xMONADMarket001"
  }
];

export const currentPlayer: Player = {
  id: "player-current",
  username: "You",
  monadAddress: "0xAbCd...EfGh",
  avatar: "/avatar-default.png",
  level: 5,
  experience: 500,
  wins: 12,
  losses: 8,
  cards: [cards[0], cards[1], cards[2]],
  monad: 1000,
  shards: 5,
  dailyTrialsRemaining: 3,
  transactionHistory: [
    {
      txHash: "0xmno345...",
      type: "BATTLE",
      timestamp: Date.now() - 3600000,
      details: "Won battle against TokenTrader"
    }
  ]
};
