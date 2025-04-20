import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, History } from 'lucide-react';
import { getTransactionExplorerUrl, truncateHash } from '@/utils/blockchain';
import { MonadGameMove } from '@/types/game';

interface OnChainMovesProps {
  moves: MonadGameMove[];
  isVisible: boolean;
  onToggle: () => void;
}

const OnChainMoves: React.FC<OnChainMovesProps> = ({
  moves,
  isVisible,
  onToggle
}) => {
  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 bg-black/50 border-emerald-500/30 text-emerald-400 hover:bg-black/70"
      >
        <History className="w-4 h-4 mr-2" />
        Show On-Chain Moves
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[60vh] overflow-y-auto bg-black/80 border-emerald-500/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center">
          <History className="w-4 h-4 mr-2 text-emerald-400" />
          On-Chain Moves History
        </h3>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          Close
        </Button>
      </div>

      {moves.length > 0 ? (
        <div className="space-y-2">
          {moves.map((move, index) => (
            <div
              key={index}
              className="text-xs p-2 rounded-md bg-emerald-950/30 border border-emerald-500/30"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-400">
                  Move #{move.moveId.split('-')[1]}
                </span>
                {move.onChainSignature && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          href={getTransactionExplorerUrl(move.onChainSignature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center"
                        >
                          {truncateHash(move.onChainSignature)}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        View transaction on MONAD Explorer
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-gray-300">
                {move.moveType.charAt(0).toUpperCase() + move.moveType.slice(1)} with card {move.cardId}
              </div>
              <div className="text-gray-400 mt-1">
                {new Date(move.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-gray-400">
          No moves recorded yet
        </div>
      )}
    </Card>
  );
};

export default OnChainMoves;