import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Address, AddressInput } from "@/components/AddressInput";
import { toast } from "sonner";
import { ArrowLeft, Search, ExternalLink, Wallet, AlertTriangle } from "lucide-react";
import GameCard from "@/components/GameCard";
import { monadGameService } from "@/services/MonadGameService";
import NFTFallback from "@/components/NFTFallback";
import { alchemyNFTService } from "@/services/AlchemyNFTService";
import { ethers } from 'ethers';

const NFTViewer: React.FC = () => {
  const navigate = useNavigate();
  const [ownerAddress, setOwnerAddress] = useState<string>("");
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [connectedAddress, setConnectedAddress] = useState<string>("");

  // Test address with NFTs for demo purposes
  const TEST_ADDRESS = "0x19818f44faf5a217f619aff0fd487cb2a55cca65";

  // Check if wallet is connected when component mounts
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if wallet is connected
        const isConnected = await monadGameService.checkConnection();
        setIsWalletConnected(isConnected);

        if (isConnected) {
          const address = await monadGameService.getWalletAddress();
          setConnectedAddress(address);
          console.log('Connected wallet address:', address);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkWalletConnection();
  }, []);

  // Use the connected wallet address
  const useConnectedWallet = () => {
    if (connectedAddress) {
      setOwnerAddress(connectedAddress);
      fetchNFTs(connectedAddress);
    } else {
      toast.error("No wallet connected");
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      const address = await monadGameService.connectWallet();
      setIsWalletConnected(true);
      setConnectedAddress(address);
      setOwnerAddress(address);
      toast.success("Wallet connected successfully");
      fetchNFTs(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error("Failed to connect wallet");
    }
  };

  const fetchNFTs = async (addressToFetch?: string) => {
    const addressToUse = addressToFetch || ownerAddress;

    if (!addressToUse) {
      toast.error("Please enter an address or connect your wallet");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get network name from environment variables
      const networkName = import.meta.env.VITE_NETWORK_NAME || "Monad Testnet";

      // For testing purposes, we'll use a known address with NFTs if the user hasn't connected their wallet
      const addressForFetch = addressToUse || TEST_ADDRESS;
      console.log(`Fetching NFTs for address: ${addressForFetch}`);

      // Initialize the Alchemy NFT service if needed
      await alchemyNFTService.initialize();

      // Get the latest block number to verify connection
      const blockNumber = await alchemyNFTService.getLatestBlockNumber();
      console.log(`Connected to Monad. Latest block: ${blockNumber}`);

      // Fetch NFTs using our service
      const data = await alchemyNFTService.getNFTsForOwner(addressForFetch);
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
        setError("No NFTs found or error in response: " + JSON.stringify(data));
        toast.error("Error fetching NFTs");
      }
    } catch (err) {
      console.error('Error details:', err);
      // Show more detailed error message
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error fetching NFTs: ${errorMessage}`);
      toast.error("Error fetching NFTs. Check console for details.");
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

      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-md">
        <h3 className="text-lg font-medium text-white mb-2">How to Use This Feature</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-1">
          <li>Connect your wallet using the button below to view your NFTs</li>
          <li>Or enter any Monad wallet address to view NFTs owned by that address</li>
          <li>This feature now uses Ethers.js with JsonRpcProvider to connect directly to Monad testnet</li>
          <li>If the Alchemy API fails, a fallback solution will generate mock NFTs for testing</li>
          <li>For testing, you can use this <Button
              variant="link"
              className="p-0 h-auto text-blue-400 hover:text-blue-300 font-normal"
              onClick={() => {
                setOwnerAddress(TEST_ADDRESS);
                fetchNFTs(TEST_ADDRESS);
              }}
            >
              test address
            </Button> with known NFTs</li>
        </ul>
      </div>

      <Card className="glassmorphism border-purple-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Search NFTs by Address</CardTitle>
          <CardDescription className="text-gray-400">
            Enter a Monad wallet address to view all NFTs owned by that address on {import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
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
                onClick={() => fetchNFTs()}
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

            <div className="flex flex-col md:flex-row gap-4 items-center">
              {isWalletConnected ? (
                <Button
                  variant="outline"
                  className="w-full md:w-auto border-purple-500/30 text-purple-400"
                  onClick={useConnectedWallet}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Use My Wallet (<Address address={connectedAddress} size="xs" />)
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full md:w-auto border-purple-500/30 text-purple-400"
                  onClick={connectWallet}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}

              {connectedAddress && (
                <p className="text-xs text-gray-500 mt-2 md:mt-0">
                  Your wallet: <Address address={connectedAddress} size="xs" />
                </p>
              )}
            </div>
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
          <h2 className="text-xl font-bold text-white mb-2">NFTs for <Address address={ownerAddress || connectedAddress} /></h2>
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

      {nfts.length === 0 && !loading && !error && (ownerAddress || connectedAddress) && (
        <div className="bg-blue-900/20 border border-blue-500/30 text-blue-400 p-4 rounded-md">
          <p>No NFTs found for this address on {import.meta.env.VITE_NETWORK_NAME || "Monad Mainnet"}.</p>
        </div>
      )}

      {!isWalletConnected && !ownerAddress && !loading && !error && (
        <div className="bg-purple-900/20 border border-purple-500/30 text-purple-400 p-4 rounded-md">
          <p>Connect your wallet or enter a Monad address to view NFTs.</p>
        </div>
      )}

      {error && (ownerAddress || connectedAddress) && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Alternative Solution</h2>
          </div>
          <NFTFallback address={ownerAddress || connectedAddress} autoGenerate={true} />
        </div>
      )}
    </div>
  );
};

export default NFTViewer;
