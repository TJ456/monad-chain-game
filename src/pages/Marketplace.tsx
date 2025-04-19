
// Since this is a read-only file, we'll create a wrapper that fixes the property access
import { useEffect, useState } from 'react';
import MarketplaceOriginal from './MarketplaceOriginal';
import { marketListings, currentPlayer } from '@/data/gameData';
import { monadGameService } from '@/services/MonadGameService';

// Export a modified version that fixes the property access issues
const Marketplace = () => {
  const [playerData, setPlayerData] = useState(currentPlayer);
  const [isLoading, setIsLoading] = useState(true);

  // Load player data from localStorage if available
  useEffect(() => {
    const initializeMarketplace = async () => {
      try {
        // Load cards from localStorage
        const savedCards = localStorage.getItem('playerCards');
        if (savedCards) {
          const parsedCards = JSON.parse(savedCards);
          currentPlayer.cards = parsedCards;
        }

        // Try to get the actual MONAD balance from the blockchain
        if (window.ethereum) {
          try {
            // Connect wallet if not already connected
            await monadGameService.connectWallet();

            // Get the actual MONAD balance
            const balance = await monadGameService.getMonadBalance();

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
                console.log('Loaded MONAD balance from localStorage:', parsedMonad);
              }
            }
          }
        }

        setPlayerData({...currentPlayer});
      } catch (error) {
        console.error('Error loading player data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMarketplace();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading marketplace...</div>
    </div>;
  }

  // Use the original component but with corrected data
  return <MarketplaceOriginal
    listings={marketListings}
    currentPlayer={{
      ...playerData,
      tokens: playerData.monad // Map monad property to tokens for compatibility
    }}
  />;
};

export default Marketplace;
