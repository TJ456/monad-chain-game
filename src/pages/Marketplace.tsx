
// Since this is a read-only file, we'll create a wrapper that fixes the property access
import MarketplaceOriginal from './MarketplaceOriginal';
import { marketListings, currentPlayer } from '@/data/gameData';

// Export a modified version that fixes the property access issues
const Marketplace = () => {
  // Use the original component but with corrected data
  return <MarketplaceOriginal 
    listings={marketListings}
    currentPlayer={{
      ...currentPlayer,
      tokens: currentPlayer.monad // Map monad property to tokens for compatibility
    }}
  />;
};

export default Marketplace;
