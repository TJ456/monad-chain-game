# Monad Chain Game

A blockchain-based card game built on the Monad blockchain, featuring fast transactions, parallel execution, and composable cards.

## Features

- **Blockchain Integration**: Connect your wallet and interact with the Monad blockchain
- **Card Minting**: Create unique cards with various attributes
- **Battle System**: Challenge other players to card battles
- **Tournament System**: Create and join tournaments with prize pools
- **Composable Cards**: Combine cards to create more powerful ones
- **Parallel Execution**: Execute multiple game moves simultaneously
- **Boost Mechanics**: Temporarily boost your cards' stats

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or another Ethereum-compatible wallet

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/monad-chain-game.git
   cd monad-chain-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_MONAD_CONTRACT_ADDRESS=0x1234567890AbCdEfGh1234567890AbCdEfGh1234
   VITE_NETWORK_ID=1
   VITE_NETWORK_NAME=Monad Mainnet
   VITE_API_URL=https://api.monad.network
   VITE_INDEXER_URL=https://indexer.monad.network
   VITE_ENABLE_TOURNAMENTS=true
   VITE_ENABLE_COMPOSABLE_CARDS=true
   VITE_ENABLE_PARALLEL_EXECUTION=true
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Project Structure

- `src/components`: React components
- `src/contracts`: Smart contract ABIs
- `src/data`: Mock data for development
- `src/pages`: Main application pages
- `src/services`: Service classes for blockchain interaction
- `src/types`: TypeScript type definitions
- `contracts`: Solidity smart contracts

## Smart Contracts

The game uses the following smart contracts:

- `MonadGame.sol`: Main game contract with player registration, card minting, battles, tournaments, and more

## Environment Variables

- `VITE_MONAD_CONTRACT_ADDRESS`: Address of the deployed MonadGame contract
- `VITE_NETWORK_ID`: ID of the Monad network
- `VITE_NETWORK_NAME`: Name of the Monad network
- `VITE_API_URL`: URL of the Monad API
- `VITE_INDEXER_URL`: URL of the Monad indexer
- `VITE_ENABLE_TOURNAMENTS`: Enable tournament features
- `VITE_ENABLE_COMPOSABLE_CARDS`: Enable composable cards features
- `VITE_ENABLE_PARALLEL_EXECUTION`: Enable parallel execution features

## License

This project is licensed under the MIT License - see the LICENSE file for details.