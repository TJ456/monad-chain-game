import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Sparkles, Database } from "lucide-react";

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-white font-bold text-xl mr-8">
            Monad Chain Game
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link
              to="/game"
              className={`text-sm ${
                isActive("/game")
                  ? "text-emerald-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Game
            </Link>
            <Link
              to="/marketplace"
              className={`text-sm ${
                isActive("/marketplace")
                  ? "text-emerald-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/tournament"
              className={`text-sm ${
                isActive("/tournament")
                  ? "text-emerald-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Tournament
            </Link>
            <Link
              to="/leaderboard"
              className={`text-sm ${
                isActive("/leaderboard")
                  ? "text-emerald-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Leaderboard
            </Link>
            <Link
              to="/nft-features"
              className={`text-sm flex items-center ${
                isActive("/nft-features")
                  ? "text-purple-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              NFT Features
            </Link>
            <Link
              to="/consensus"
              className={`text-sm flex items-center ${
                isActive("/consensus")
                  ? "text-blue-400 font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Database className="w-3 h-3 mr-1" />
              Consensus
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/profile">
            <Button
              variant={isActive("/profile") ? "default" : "outline"}
              size="sm"
              className={
                isActive("/profile")
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "text-gray-400 border-gray-700 hover:text-white"
              }
            >
              Profile
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
