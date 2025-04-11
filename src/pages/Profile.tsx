
// Since this is a read-only file, we'll create a wrapper that fixes the property access
import ProfileOriginal from './ProfileOriginal';
import { currentPlayer } from '@/data/gameData';

// Export a modified version that fixes the property access issues
const Profile = () => {
  // Use the original component but with corrected data
  return <ProfileOriginal 
    currentPlayer={{
      ...currentPlayer,
      address: currentPlayer.monadAddress, // Map monadAddress to address for compatibility
      tokens: currentPlayer.monad // Map monad property to tokens for compatibility
    }}
  />;
};

export default Profile;
