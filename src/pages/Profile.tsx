
// Since this is a read-only file, we'll create a wrapper that fixes the property access
import { useEffect, useState } from 'react';
import ProfileOriginal from './ProfileOriginal';
import { currentPlayer } from '@/data/gameData';
import { monadGameService } from '@/services/MonadGameService';

// Export a modified version that fixes the property access issues
const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Check wallet connection when component mounts
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // If wallet address is not set, try to reconnect
        if (!currentPlayer.monadAddress && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];

          if (accounts && accounts.length > 0) {
            console.log('Reconnecting wallet in Profile:', accounts[0]);
            currentPlayer.monadAddress = accounts[0];
          } else {
            // Try to connect wallet if not already connected
            try {
              const address = await monadGameService.connectWallet();
              currentPlayer.monadAddress = address;
              console.log('Connected wallet in Profile:', address);
            } catch (error) {
              console.error('Failed to connect wallet in Profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection in Profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletConnection();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading profile...</div>
    </div>;
  }

  // Use the original component but with corrected data
  return <ProfileOriginal
    currentPlayer={{
      ...currentPlayer,
      address: currentPlayer.monadAddress || '0x0000000000000000000000000000000000000000', // Map monadAddress to address for compatibility
      tokens: currentPlayer.monad // Map monad property to tokens for compatibility
    }}
  />;
};

export default Profile;
