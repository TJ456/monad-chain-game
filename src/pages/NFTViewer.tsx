import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Address, AddressInput } from "@/components/AddressInput";
import { toast } from "sonner";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import GameCard from "@/components/GameCard";

const NFTViewer: React.FC = () => {
  const navigate = useNavigate();
  const [ownerAddress, setOwnerAddress] = useState<string>("");
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchNFTs = async () => {
    if (!ownerAddress) {
      toast.error("Please enter an address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

      if (!alchemyApiKey) {
        toast.error("Alchemy API key not configured");
        setError("API key not configured. Please add VITE_ALCHEMY_API_KEY to your environment variables.");
        setLoading(false);
        return;
      }

      // Get network name from environment variables
      const networkName = import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet";
      const networkId = import.meta.env.VITE_NETWORK_ID || "1";

      // Determine the correct API endpoint based on network
      let apiEndpoint = "https://monad-testnet.g.alchemy.com";

      // If we're on mainnet, use the mainnet endpoint
      if (networkName.toLowerCase().includes("mainnet") || networkId === "1") {
        apiEndpoint = "https://monad-mainnet.g.alchemy.com";
      }

      console.log(`Using Alchemy API endpoint: ${apiEndpoint} for network: ${networkName}`);

      const options = { method: "GET", headers: { accept: "application/json" } };
      const response = await fetch(
        `${apiEndpoint}/nft/v3/${alchemyApiKey}/getNFTsForOwner?owner=${ownerAddress}&withMetadata=true&pageSize=100`,
        options,
      );

      const data = await response.json();

      console.log("NFT data:", data);

      if (data.ownedNfts) {
        setNfts(data.ownedNfts);
        if (data.ownedNfts.length === 0) {
          toast.info(`No NFTs found for this address on ${networkName}`);
        } else {
          toast.success(`Found ${data.ownedNfts.length} NFTs on ${networkName}`);
        }
      } else {
        setNfts([]);
        setError("No NFTs found or error in response");
        toast.error("Error fetching NFTs");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching NFTs. Please try again.");
      toast.error("Error fetching NFTs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Monad NFT Viewer</h1>
          <p className="text-gray-400">View NFTs owned by any address on the Monad blockchain ({import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"})</p>
        </div>

        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={() => navigate('/nft-features')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to NFT Features
        </Button>
      </div>

      <Card className="glassmorphism border-purple-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Search NFTs by Address</CardTitle>
          <CardDescription className="text-gray-400">
            Enter a Monad wallet address to view all NFTs owned by that address on {import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <AddressInput
                value={ownerAddress}
                onChange={setOwnerAddress}
                placeholder="Enter Monad wallet address (0x...)"
              />
            </div>
            <Button
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
              onClick={fetchNFTs}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Fetch NFTs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {nfts.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-2">NFTs for <Address address={ownerAddress} /></h2>
          <p className="text-gray-400 mb-4">Found {nfts.length} NFTs on {import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft, index) => {
              // Create a GameCardType object from the NFT data
              const gameCard = {
                id: `nft-${nft.contract?.address}-${nft.tokenId}`,
                name: nft.title || nft.contract?.name || "Unnamed NFT",
                description: nft.description?.substring(0, 100) || `Collection: ${nft.contract?.name || "Unknown Collection"}`,
                image: nft.image?.originalUrl || nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.thumbnailUrl || "/placeholder-nft.png",
                rarity: "RARE",
                type: "UTILITY",
                mana: parseInt(nft.tokenId?.substring(0, 1) || "1") || 1,
                attack: parseInt(nft.tokenId?.substring(1, 2) || "2") || 2,
                defense: parseInt(nft.tokenId?.substring(2, 3) || "3") || 3,
                monadId: nft.contract?.address ? `${nft.contract.address.substring(0, 10)}...` : "0xMONAD",
                onChainMetadata: {
                  creator: nft.contract?.address || "Unknown",
                  creationBlock: parseInt(nft.tokenId || "0") || 0,
                  evolutionStage: 1,
                  battleHistory: []
                }
              };

              return (
                <div key={index} className="flex flex-col items-center">
                  <GameCard card={gameCard as any} />

                  <div className="mt-2 w-full">
                    <div className="flex flex-col space-y-1 text-xs bg-black/30 p-2 rounded-md border border-purple-500/20">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Token ID:</span>
                        <span className="font-mono text-gray-300 truncate max-w-[150px]">{nft.tokenId}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Contract:</span>
                        <Address address={nft.contract?.address} size="xs" />
                      </div>
                    </div>

                    {nft.contract?.openSea?.collectionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-purple-500/30 text-purple-400"
                        onClick={() => window.open(nft.contract.openSea.collectionUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View on OpenSea
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {nfts.length === 0 && !loading && !error && ownerAddress && (
        <div className="bg-blue-900/20 border border-blue-500/30 text-blue-400 p-4 rounded-md">
          <p>No NFTs found for this address on {import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"}.</p>
        </div>
      )}
    </div>
  );
};

export default NFTViewer;
