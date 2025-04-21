import { raptorCastService } from '../services/RaptorCastService';
import { monadNFTService } from '../services/MonadNFTService';
import { nftPropagationService } from '../services/NFTPropagationService';

describe('RaptorCast NFT Integration', () => {
  beforeAll(async () => {
    // Initialize services
    await raptorCastService.initialize();
    await nftPropagationService.initialize();
  });

  test('should propagate an NFT through RaptorCast', async () => {
    // Create a test NFT
    const testNFT = monadNFTService.simulateMintedNFT();
    
    // Propagate the NFT
    const propagationResult = await raptorCastService.propagateNFT(testNFT);
    
    // Verify the result
    expect(propagationResult).toBeDefined();
    expect(propagationResult.nft).toEqual(testNFT);
    expect(propagationResult.success).toBe(true);
    expect(propagationResult.receivingNodes.length).toBeGreaterThan(0);
    expect(propagationResult.propagationPath.length).toBeGreaterThan(0);
  });

  test('should evolve an NFT based on propagation', async () => {
    // Create a test NFT
    const testNFT = monadNFTService.simulateMintedNFT();
    
    // Propagate the NFT with forced evolution
    const propagationResult = await raptorCastService.propagateNFT(testNFT, {
      redundancyFactor: 7 // High redundancy to ensure evolution
    });
    
    // Force evolution factor
    (propagationResult as any).evolutionFactor = 0.2;
    
    // Evolve the NFT
    const evolvedNFT = await raptorCastService.evolveNFTFromPropagation(propagationResult.messageId);
    
    // Verify the evolved NFT
    expect(evolvedNFT).toBeDefined();
    if (evolvedNFT) {
      expect(evolvedNFT.quality).toBeGreaterThan(testNFT.quality);
      expect(evolvedNFT.name).toContain('Evolved');
      
      // Check for propagation attributes
      const evolvedFromAttr = evolvedNFT.attributes.find(attr => attr.trait_type === 'Evolved From');
      expect(evolvedFromAttr).toBeDefined();
      expect(evolvedFromAttr?.value).toBe(testNFT.tokenId);
    }
  });

  test('should store propagation data in MonadDb', async () => {
    // Create a test NFT
    const testNFT = monadNFTService.simulateMintedNFT();
    
    // Propagate the NFT
    const propagationResult = await nftPropagationService.propagateNFT(testNFT);
    
    // Verify the propagation is stored
    const storedPropagation = nftPropagationService.getNFTPropagation(testNFT.tokenId);
    expect(storedPropagation).toBeDefined();
    expect(storedPropagation?.nft.tokenId).toBe(testNFT.tokenId);
  });
});
