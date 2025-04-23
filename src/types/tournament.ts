export interface TournamentReward {
  type: 'shards' | 'card' | 'experience' | 'token' | 'nft';
  name: string;
  amount: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl?: string;
  description?: string;
}

export interface TournamentTier {
  name: string;
  position: string; // e.g., "1st Place", "Top 3", "Top 10"
  rewards: TournamentReward[];
  color: string;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  prizePool: number;
  entryFee: number;
  startTime: number;
  endTime: number;
  minLevel: number;
  active: boolean;
  participantCount?: number;
  winner?: string;
  isVerified?: boolean;
  canComplete?: boolean;
  featured?: boolean;
  // Enhanced properties
  tournamentType: 'standard' | 'elimination' | 'quickplay' | 'championship' | 'special' | 'seasonal';
  theme: 'fire' | 'water' | 'earth' | 'air' | 'shadow' | 'light' | 'cosmic' | 'void' | 'tech';
  progress: number; // 0-100
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  maxParticipants?: number;
  entryRequirements?: string[];
  specialRules?: string[];
  tiers: TournamentTier[];
  rewards: {
    shards: number;
    cards: number;
    experience: number;
    specialReward?: string;
  };
  leaderboard?: {
    playerAddress: string;
    playerName?: string;
    playerAvatar?: string;
    rank?: number;
    wins: number;
    score: number;
    isCurrentPlayer?: boolean;
  }[];
  matches?: {
    id: string;
    player1: string;
    player2: string;
    winner?: string;
    timestamp: number;
    score?: [number, number];
  }[];
}
