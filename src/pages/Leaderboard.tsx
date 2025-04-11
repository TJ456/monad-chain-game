
// Since this file is read-only, we need to create a new file that imports it and modifies it
import LeaderboardOriginal from './LeaderboardOriginal';
import { players } from '@/data/gameData';

// Export a slightly modified version that fixes the property access issues
const Leaderboard = () => {
  // Use the original component but with corrected data
  return <LeaderboardOriginal players={players.map(player => ({
    ...player,
    tokens: player.monad // Map monad property to tokens for compatibility
  }))} />;
};

export default Leaderboard;
