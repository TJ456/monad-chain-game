import { Tournament } from '../types/tournament';

// Helper function to generate random player names
export const generatePlayerName = () => {
  const prefixes = ['Crypto', 'Monad', 'Chain', 'Block', 'Pixel', 'Neon', 'Cyber', 'Quantum', 'Void', 'Stellar'];
  const suffixes = ['Warrior', 'Hunter', 'Master', 'Knight', 'Wizard', 'Ninja', 'Samurai', 'Titan', 'Legend', 'Phoenix'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
};

// Generate a random avatar URL
export const generateAvatarUrl = () => {
  const avatarIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  return `/avatars/avatar-${avatarIds[Math.floor(Math.random() * avatarIds.length)]}.png`;
};

// Generate mock tournaments with interesting features
export const generateMockTournaments = (): Tournament[] => {
  const now = Math.floor(Date.now() / 1000);
  const tournamentTypes = ['standard', 'elimination', 'quickplay', 'championship', 'special', 'seasonal'] as const;
  const themes = ['fire', 'water', 'earth', 'air', 'shadow', 'light', 'cosmic', 'void', 'tech'] as const;
  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert', 'master'] as const;
  
  const tournaments: Tournament[] = [
    {
      id: 1,
      name: "Monad Masters Championship",
      description: "The premier tournament for elite players. Compete for massive shard rewards and exclusive NFTs.",
      prizePool: 5.0,
      entryFee: 0.25,
      startTime: now - 86400,
      endTime: now + 432000, // 5 days from now
      minLevel: 10,
      active: true,
      participantCount: 64,
      isVerified: true,
      canComplete: false,
      featured: true,
      tournamentType: 'championship',
      theme: 'cosmic',
      progress: 15,
      difficulty: 'master',
      maxParticipants: 128,
      entryRequirements: ['Level 10+', 'At least 3 legendary cards'],
      specialRules: ['Double elimination', 'Parallel execution bonus'],
      tiers: [
        {
          name: "Champion",
          position: "1st Place",
          color: "from-amber-400 to-yellow-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 5000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Cosmic Overlord', amount: 1, rarity: 'legendary', imageUrl: '/cards/cosmic_overlord.png', description: 'Exclusive legendary card with unique abilities' },
            { type: 'nft', name: 'Champion\'s Trophy', amount: 1, rarity: 'legendary', imageUrl: '/nfts/champions_trophy.png', description: 'Proof of your championship victory' },
            { type: 'token', name: 'MONAD Tokens', amount: 50, description: 'Blockchain tokens with real value' }
          ]
        },
        {
          name: "Finalist",
          position: "2nd Place",
          color: "from-slate-300 to-slate-500",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 2500, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Void Manipulator', amount: 1, rarity: 'epic', imageUrl: '/cards/void_manipulator.png', description: 'Powerful epic card with unique abilities' },
            { type: 'token', name: 'MONAD Tokens', amount: 25, description: 'Blockchain tokens with real value' }
          ]
        },
        {
          name: "Semi-Finalist",
          position: "Top 4",
          color: "from-amber-700 to-amber-900",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Astral Conjurer', amount: 1, rarity: 'rare', imageUrl: '/cards/astral_conjurer.png', description: 'Rare card with unique abilities' },
            { type: 'token', name: 'MONAD Tokens', amount: 10, description: 'Blockchain tokens with real value' }
          ]
        }
      ],
      rewards: {
        shards: 5000,
        cards: 3,
        experience: 2000,
        specialReward: "Exclusive Champion's Trophy NFT"
      },
      leaderboard: Array(10).fill(0).map((_, i) => ({
        playerAddress: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        playerName: generatePlayerName(),
        playerAvatar: generateAvatarUrl(),
        rank: i + 1,
        wins: Math.floor(Math.random() * 10) + (10 - i),
        score: Math.floor(Math.random() * 500) + (1000 - i * 100),
        isCurrentPlayer: i === 2 // Make the player in 3rd place
      }))
    },
    {
      id: 2,
      name: "Parallel Execution Challenge",
      description: "Test your skills with Monad's parallel execution mechanics. Fast-paced matches with quick rewards.",
      prizePool: 2.0,
      entryFee: 0.1,
      startTime: now - 43200,
      endTime: now + 86400, // 1 day from now
      minLevel: 5,
      active: true,
      participantCount: 32,
      isVerified: true,
      canComplete: false,
      tournamentType: 'quickplay',
      theme: 'tech',
      progress: 35,
      difficulty: 'intermediate',
      maxParticipants: 64,
      specialRules: ['Speed bonus', 'Parallel execution multiplier'],
      tiers: [
        {
          name: "Speed Champion",
          position: "1st Place",
          color: "from-blue-400 to-cyan-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 2000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Quantum Accelerator', amount: 1, rarity: 'epic', imageUrl: '/cards/quantum_accelerator.png', description: 'Speed-focused epic card' }
          ]
        },
        {
          name: "Runner-Up",
          position: "Top 3",
          color: "from-blue-600 to-blue-800",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1000, description: 'Premium currency for special purchases' },
            { type: 'experience', name: 'Bonus XP', amount: 500, description: 'Level up faster' }
          ]
        }
      ],
      rewards: {
        shards: 2000,
        cards: 1,
        experience: 1000
      }
    },
    {
      id: 3,
      name: "Elemental Showdown",
      description: "Master the elements in this themed tournament. Each round features a different elemental challenge.",
      prizePool: 3.0,
      entryFee: 0.15,
      startTime: now - 21600,
      endTime: now + 259200, // 3 days from now
      minLevel: 3,
      active: true,
      participantCount: 48,
      isVerified: true,
      canComplete: false,
      tournamentType: 'standard',
      theme: 'fire',
      progress: 25,
      difficulty: 'intermediate',
      tiers: [
        {
          name: "Elemental Master",
          position: "1st Place",
          color: "from-red-500 to-orange-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 3000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Elemental Fury', amount: 1, rarity: 'epic', imageUrl: '/cards/elemental_fury.png', description: 'Control all elements with this powerful card' }
          ]
        },
        {
          name: "Elemental Adept",
          position: "Top 5",
          color: "from-red-700 to-red-900",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1500, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Flame Conjurer', amount: 1, rarity: 'rare', imageUrl: '/cards/flame_conjurer.png', description: 'Harness the power of fire' }
          ]
        }
      ],
      rewards: {
        shards: 3000,
        cards: 2,
        experience: 1500
      }
    },
    {
      id: 4,
      name: "Newcomer's Arena",
      description: "Perfect for beginners! Learn the ropes and earn your first tournament rewards.",
      prizePool: 1.0,
      entryFee: 0.05,
      startTime: now - 10800,
      endTime: now + 172800, // 2 days from now
      minLevel: 1,
      active: true,
      participantCount: 24,
      isVerified: true,
      canComplete: false,
      tournamentType: 'standard',
      theme: 'light',
      progress: 20,
      difficulty: 'beginner',
      entryRequirements: ['Level 1-5 only'],
      tiers: [
        {
          name: "Promising Talent",
          position: "1st Place",
          color: "from-green-400 to-emerald-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Novice Champion', amount: 1, rarity: 'rare', imageUrl: '/cards/novice_champion.png', description: 'Your first tournament victory card' }
          ]
        },
        {
          name: "Rising Star",
          position: "Top 10",
          color: "from-green-600 to-green-800",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 500, description: 'Premium currency for special purchases' },
            { type: 'experience', name: 'Bonus XP', amount: 300, description: 'Level up faster' }
          ]
        }
      ],
      rewards: {
        shards: 1000,
        cards: 1,
        experience: 800
      }
    },
    {
      id: 5,
      name: "Shadow Realm Conquest",
      description: "Enter the shadow realm where dark magic rules. High risk, high reward tournament with unique mechanics.",
      prizePool: 4.0,
      entryFee: 0.2,
      startTime: now - 32400,
      endTime: now + 345600, // 4 days from now
      minLevel: 8,
      active: true,
      participantCount: 40,
      isVerified: true,
      canComplete: false,
      tournamentType: 'elimination',
      theme: 'shadow',
      progress: 30,
      difficulty: 'advanced',
      specialRules: ['Shadow cards get +2 power', 'Light cards are weakened'],
      tiers: [
        {
          name: "Shadow Lord",
          position: "1st Place",
          color: "from-purple-500 to-violet-700",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 4000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Void Reaper', amount: 1, rarity: 'legendary', imageUrl: '/cards/void_reaper.png', description: 'Command the shadows with this legendary card' }
          ]
        },
        {
          name: "Shadow Adept",
          position: "Top 3",
          color: "from-purple-700 to-purple-900",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 2000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Umbral Assassin', amount: 1, rarity: 'epic', imageUrl: '/cards/umbral_assassin.png', description: 'Strike from the shadows' }
          ]
        }
      ],
      rewards: {
        shards: 4000,
        cards: 2,
        experience: 1800,
        specialReward: "Shadow Realm Access Pass"
      }
    },
    {
      id: 6,
      name: "Weekend Warrior Clash",
      description: "Quick weekend tournament with fast matches and immediate rewards. Perfect for casual players.",
      prizePool: 1.5,
      entryFee: 0.08,
      startTime: now - 7200,
      endTime: now + 172800, // 2 days from now
      minLevel: 2,
      active: true,
      participantCount: 56,
      isVerified: true,
      canComplete: false,
      tournamentType: 'quickplay',
      theme: 'earth',
      progress: 10,
      difficulty: 'beginner',
      tiers: [
        {
          name: "Weekend Champion",
          position: "1st Place",
          color: "from-amber-400 to-amber-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1500, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Weekend Warrior', amount: 1, rarity: 'rare', imageUrl: '/cards/weekend_warrior.png', description: 'Limited edition weekend tournament card' }
          ]
        },
        {
          name: "Honorable Mention",
          position: "Top 10",
          color: "from-amber-600 to-amber-800",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 750, description: 'Premium currency for special purchases' },
            { type: 'experience', name: 'Bonus XP', amount: 400, description: 'Level up faster' }
          ]
        }
      ],
      rewards: {
        shards: 1500,
        cards: 1,
        experience: 1000
      }
    },
    {
      id: 7,
      name: "Celestial Convergence",
      description: "A rare cosmic event has opened portals to other dimensions. Harness cosmic energy in this special tournament.",
      prizePool: 6.0,
      entryFee: 0.3,
      startTime: now - 54000,
      endTime: now + 518400, // 6 days from now
      minLevel: 12,
      active: true,
      participantCount: 32,
      isVerified: true,
      canComplete: false,
      featured: true,
      tournamentType: 'special',
      theme: 'cosmic',
      progress: 8,
      difficulty: 'expert',
      maxParticipants: 64,
      entryRequirements: ['Level 12+', 'Own at least 1 cosmic card'],
      specialRules: ['Cosmic cards get double mana', 'Portal mechanics active'],
      tiers: [
        {
          name: "Cosmic Overlord",
          position: "1st Place",
          color: "from-indigo-400 via-purple-500 to-pink-500",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 6000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Celestial Archon', amount: 1, rarity: 'legendary', imageUrl: '/cards/celestial_archon.png', description: 'The most powerful cosmic entity' },
            { type: 'nft', name: 'Cosmic Convergence Trophy', amount: 1, rarity: 'legendary', imageUrl: '/nfts/cosmic_trophy.png', description: 'Extremely rare commemorative NFT' }
          ]
        },
        {
          name: "Astral Master",
          position: "Top 3",
          color: "from-blue-400 via-indigo-500 to-purple-600",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 3000, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Nebula Weaver', amount: 1, rarity: 'epic', imageUrl: '/cards/nebula_weaver.png', description: 'Manipulate the fabric of space' }
          ]
        },
        {
          name: "Star Voyager",
          position: "Top 10",
          color: "from-blue-500 to-blue-700",
          rewards: [
            { type: 'shards', name: 'Monad Shards', amount: 1500, description: 'Premium currency for special purchases' },
            { type: 'card', name: 'Cosmic Shard', amount: 1, rarity: 'rare', imageUrl: '/cards/cosmic_shard.png', description: 'A fragment of cosmic power' }
          ]
        }
      ],
      rewards: {
        shards: 6000,
        cards: 3,
        experience: 2500,
        specialReward: "Celestial Dimension Access"
      }
    }
  ];
  
  return tournaments;
};
