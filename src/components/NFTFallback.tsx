import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { monadNFTService } from '@/services/MonadNFTService';
import { MintedNFT } from '@/services/MonadNFTService';
import NFTCard from '@/components/NFTCard';
import { Info } from 'lucide-react';

interface NFTFallbackProps {
  address: string;
  autoGenerate?: boolean;
}

/**
 * A fallback component that generates mock NFTs when the Alchemy API fails
 */
const NFTFallback: React.FC<NFTFallbackProps> = ({ address, autoGenerate = false }) => {
  const [mockNFTs, setMockNFTs] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-generate NFTs if requested
  useEffect(() => {
    if (autoGenerate && mockNFTs.length === 0) {
      generateMockNFTs();
    }
  }, [autoGenerate]);

  const generateMockNFTs = () => {
    setLoading(true);

    try {
      // Generate 4 mock NFTs
      const nfts: MintedNFT[] = [];
      for (let i = 0; i < 4; i++) {
        nfts.push(monadNFTService.simulateMintedNFT());
      }

      setMockNFTs(nfts);
      toast.success(`Generated ${nfts.length} mock NFTs for testing`);
    } catch (error) {
      console.error('Error generating mock NFTs:', error);
      toast.error('Failed to generate mock NFTs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glassmorphism border-yellow-500/30 mb-8">
      <CardHeader>
        <CardTitle className="text-white">NFT Fallback Solution</CardTitle>
        <CardDescription className="text-gray-400">
          <div className="flex items-center gap-2 mt-1">
            <Info className="h-4 w-4 text-blue-400" />
            <span>This uses simulated NFTs for testing since Alchemy API might not fully support Monad yet</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-yellow-400">
            Having trouble with the Alchemy API? Use this fallback to generate mock NFTs for testing.
          </p>

          <Button
            variant="outline"
            className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            onClick={generateMockNFTs}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Mock NFTs'}
          </Button>

          {mockNFTs.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-white mb-3">Mock NFTs for {address.substring(0, 6)}...{address.substring(address.length - 4)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockNFTs.map((nft, index) => (
                  <NFTCard key={index} nft={nft} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTFallback;
