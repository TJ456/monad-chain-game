
// Since this is a read-only file, we'll create a wrapper that fixes the property access
import { useEffect, useState } from 'react';
import ProfileOriginal from './ProfileOriginal';
import { currentPlayer } from '@/data/gameData';
import { monadGameService } from '@/services/MonadGameService';

// Export a modified version that fixes the property access issues
const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [monadBalance, setMonadBalance] = useState<number | null>(null);

  // Check wallet connection and load player data when component mounts
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Load cards from localStorage
        const savedCards = localStorage.getItem('playerCards');
        if (savedCards) {
          try {
            const parsedCards = JSON.parse(savedCards);
            currentPlayer.cards = parsedCards;
            console.log('Loaded cards from localStorage:', parsedCards.length);
          } catch (e) {
            console.error('Error parsing cards from localStorage:', e);
          }
        }

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

        // Try to get the actual MONAD balance from the blockchain
        if (currentPlayer.monadAddress) {
          try {
            // Connect wallet if not already connected
            await monadGameService.connectWallet();

            // Get the actual MONAD balance
            const balance = await monadGameService.getMonadBalance();
            setMonadBalance(balance);

            // Update the currentPlayer object
            currentPlayer.monad = balance;

            // Save to localStorage
            localStorage.setItem('playerMonad', balance.toString());

            console.log('Updated MONAD balance from blockchain:', balance);
          } catch (error) {
            console.error('Failed to get MONAD balance:', error);

            // Fall back to localStorage if available
            const savedMonad = localStorage.getItem('playerMonad');
            if (savedMonad) {
              const parsedMonad = parseInt(savedMonad, 10);
              if (!isNaN(parsedMonad)) {
                currentPlayer.monad = parsedMonad;
                setMonadBalance(parsedMonad);
                console.log('Loaded MONAD balance from localStorage:', parsedMonad);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
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
