import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the player data structure
interface PlayerData {
  monadAddress?: string;
  username?: string;
  level?: number;
  experience?: number;
  wins?: number;
  losses?: number;
  shards?: number;
  cards?: any[];
  isRegistered?: boolean;
  dailyTrialsRemaining?: number;
  lastTrialTime?: number;
  transactionHistory?: {
    type: string;
    hash: string;
    timestamp: number;
    status: string;
    blockNumber?: number;
  }[];
}

// Define the context type
interface PlayerContextType {
  player: PlayerData;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
}

// Create the context with default values
const PlayerContext = createContext<PlayerContextType>({
  player: {},
  setPlayer: () => {},
});

// Create a provider component
export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<PlayerData>({
    monadAddress: '',
    username: 'Player',
    level: 1,
    experience: 0,
    wins: 0,
    losses: 0,
    shards: 0,
    cards: [],
    isRegistered: false,
    dailyTrialsRemaining: 3,
    lastTrialTime: 0,
    transactionHistory: []
  });

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

// Create a hook to use the player context
export const usePlayer = () => useContext(PlayerContext);
