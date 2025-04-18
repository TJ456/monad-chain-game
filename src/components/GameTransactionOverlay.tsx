import React from 'react';
import TransactionConfirmation from './TransactionConfirmation';

interface GameTransactionOverlayProps {
  showTransactionConfirmation: boolean;
  transactionDetails: {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    timestamp: number;
  } | null;
  onClose: () => void;
}

const GameTransactionOverlay: React.FC<GameTransactionOverlayProps> = ({
  showTransactionConfirmation,
  transactionDetails,
  onClose
}) => {
  if (!showTransactionConfirmation || !transactionDetails) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <TransactionConfirmation
        transactionHash={transactionDetails.hash}
        status={transactionDetails.status}
        blockNumber={transactionDetails.blockNumber}
        timestamp={transactionDetails.timestamp}
        onClose={onClose}
      />
    </div>
  );
};

export default GameTransactionOverlay;
