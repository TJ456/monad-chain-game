import { PBFTConsensus, ConsensusBlock, ConsensusMessage } from '../services/consensus';
import { GameConsensusService, GameConsensusBlock } from '../services/GameConsensusService';
import { MerkleTree, createGameStateMerkleTree, verifyGameState, createConsensusBlockMerkleTree, verifyConsensusBlock } from '../utils/merkleTree';

/**
 * Test suite for Monad BFT consensus implementation
 * 
 * Tests:
 * - Block creation and validation
 * - Merkle tree verification
 * - Game state consensus integration
 * - Transaction verification
 */
describe('Monad BFT Consensus', () => {
  // Test basic block creation
  test('Should create a valid consensus block', () => {
    const transactions = [
      JSON.stringify({ type: 'MOVE', player: 'player1', card: 'card1' }),
      JSON.stringify({ type: 'MOVE', player: 'player2', card: 'card2' })
    ];

    const block: ConsensusBlock = {
      number: 1,
      timestamp: Date.now(),
      transactions,
      stateRoot: '',
      parentHash: '0'.repeat(64),
      merkleRoot: ''
    };

    // Calculate merkle root
    const tree = new MerkleTree(transactions);
    block.merkleRoot = tree.getRoot();

    // Verify block
    expect(block.number).toBe(1);
    expect(block.transactions.length).toBe(2);
    expect(block.merkleRoot).toBeTruthy();
    expect(block.merkleRoot.length).toBeGreaterThan(0);
  });

  // Test game state merkle tree
  test('Should create and verify game state merkle tree', () => {
    const gameState = {
      roomCode: 'room1',
      playerHealth: 20,
      opponentHealth: 15,
      currentTurn: 'player',
      moveHistory: ['move1', 'move2', 'move3'],
      timestamp: Date.now()
    };

    // Create merkle tree
    const tree = createGameStateMerkleTree(gameState);
    const root = tree.getRoot();

    // Verify game state
    expect(verifyGameState(gameState, root)).toBe(true);

    // Modify game state and verify it fails
    const modifiedState = { ...gameState, playerHealth: 10 };
    expect(verifyGameState(modifiedState, root)).toBe(false);
  });

  // Test game consensus block
  test('Should create and verify game consensus block', () => {
    const gameState = {
      roomCode: 'room1',
      playerHealth: 20,
      opponentHealth: 15,
      currentTurn: 'player',
      moveHistory: ['move1', 'move2', 'move3'],
      timestamp: Date.now()
    };

    const transactions = [
      JSON.stringify({ 
        type: 'GAME_STATE_UPDATE', 
        gameState,
        timestamp: Date.now()
      })
    ];

    // Create game consensus block
    const gameBlock: GameConsensusBlock = {
      number: 1,
      timestamp: Date.now(),
      transactions,
      stateRoot: '',
      parentHash: '0'.repeat(64),
      merkleRoot: '',
      gameStateRoot: createGameStateMerkleTree(gameState).getRoot(),
      gameMetadata: {
        roomCode: gameState.roomCode,
        playerCount: 2,
        moveCount: gameState.moveHistory.length,
        roundNumber: 1
      },
      validatorSignatures: {
        'validator1': '0x123456'
      }
    };

    // Calculate merkle root
    const blockTree = createConsensusBlockMerkleTree(gameBlock);
    gameBlock.merkleRoot = blockTree.getRoot();

    // Verify block
    expect(verifyConsensusBlock(gameBlock, gameBlock.merkleRoot)).toBe(true);

    // Modify block and verify it fails
    const modifiedBlock = { 
      ...gameBlock, 
      gameMetadata: { 
        ...gameBlock.gameMetadata, 
        playerCount: 3 
      } 
    };
    expect(verifyConsensusBlock(modifiedBlock, gameBlock.merkleRoot)).toBe(false);
  });

  // Test consensus message handling
  test('Should create and validate consensus messages', () => {
    const block: ConsensusBlock = {
      number: 1,
      timestamp: Date.now(),
      transactions: [],
      stateRoot: '',
      parentHash: '0'.repeat(64),
      merkleRoot: new MerkleTree(['test']).getRoot()
    };

    // Create pre-prepare message
    const prePrepareMsg: ConsensusMessage = {
      type: 'pre_prepare',
      viewNumber: 0,
      sequenceNumber: 1,
      block,
      blockHash: new MerkleTree([JSON.stringify(block)]).getRoot(),
      senderId: 'validator1'
    };

    // Create prepare message
    const prepareMsg: ConsensusMessage = {
      type: 'prepare',
      viewNumber: 0,
      sequenceNumber: 1,
      blockHash: prePrepareMsg.blockHash,
      senderId: 'validator2'
    };

    // Create commit message
    const commitMsg: ConsensusMessage = {
      type: 'commit',
      viewNumber: 0,
      sequenceNumber: 1,
      blockHash: prePrepareMsg.blockHash,
      senderId: 'validator3'
    };

    // Verify messages
    expect(prePrepareMsg.type).toBe('pre_prepare');
    expect(prepareMsg.blockHash).toBe(prePrepareMsg.blockHash);
    expect(commitMsg.sequenceNumber).toBe(prePrepareMsg.sequenceNumber);
  });
});
