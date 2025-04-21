/**
 * Utility functions for NFT image handling
 */

// Map of element types to comic-style image URLs
export const elementToImageMap: Record<string, string> = {
  'Fire': '/nft-images/fire-comic.png',
  'Water': '/nft-images/water-comic.png',
  'Earth': '/nft-images/earth-comic.png',
  'Air': '/nft-images/air-comic.png',
  'Lightning': '/nft-images/lightning-comic.png',
  'Shadow': '/nft-images/shadow-comic.png',
  'Light': '/nft-images/light-comic.png',
  'Unknown': '/nft-images/unknown-comic.png'
};

// Fallback image for elements not in the map
export const fallbackImage = '/nft-images/unknown-comic.png';

/**
 * Get the appropriate comic-style image URL for an NFT element
 * @param element The element type
 * @returns URL to the comic-style image
 */
export const getElementImage = (element: string): string => {
  return elementToImageMap[element] || fallbackImage;
};

/**
 * Get a comic-style image based on NFT quality
 * @param quality NFT quality score (1-100)
 * @returns URL to the quality-appropriate comic image
 */
export const getQualityImage = (quality: number): string => {
  if (quality >= 80) return '/nft-images/legendary-comic.png';
  if (quality >= 60) return '/nft-images/epic-comic.png';
  if (quality >= 40) return '/nft-images/rare-comic.png';
  if (quality >= 20) return '/nft-images/uncommon-comic.png';
  return '/nft-images/common-comic.png';
};

/**
 * Get a comic-style image based on NFT special ability
 * @param ability The special ability name
 * @returns URL to the ability-appropriate comic image
 */
export const getAbilityImage = (ability: string): string => {
  const abilityMap: Record<string, string> = {
    'Chain Reaction': '/nft-images/chain-reaction-comic.png',
    'Parallel Execution': '/nft-images/parallel-execution-comic.png',
    'Monad Boost': '/nft-images/monad-boost-comic.png',
    'Airdrop Strike': '/nft-images/airdrop-strike-comic.png',
    'Block Finality': '/nft-images/block-finality-comic.png',
  };
  
  return abilityMap[ability] || '/nft-images/ability-comic.png';
};
