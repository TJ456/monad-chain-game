np// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MonadGame is ERC721, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    // Counters
    Counters.Counter private _cardIds;
    Counters.Counter private _tournamentIds;
    Counters.Counter private _moveIds;
    Counters.Counter private _gameIds;

    // Constants
    uint256 public constant EXPERIENCE_PER_LEVEL = 1000;
    uint256 public constant MIN_TOURNAMENT_PRIZE = 0.1 ether;
    uint256 public constant SHARD_MINT_COST = 0.01 ether;

    // Structs
    struct Player {
        address wallet;
        uint256 experience;
        uint256 level;
        uint256[] ownedCards;
        uint256 wins;
        uint256 losses;
        uint256 shards;
        uint256 lastGameTime;
        bool isRegistered;
        bytes32 lastMoveHash; // Added for move verification
    }

    struct Card {
        uint256 id;
        string name;
        uint8 rarity; // 0: Common, 1: Rare, 2: Epic, 3: Legendary
        uint8 cardType; // 0: Attack, 1: Defense, 2: Utility
        uint256 attack;
        uint256 defense;
        uint256 mana;
        uint256 mintTime;
        address creator;
        bool isActive;  // Added to track card status
        uint8 evolutionLevel; // 0: Base, 1-5: Evolution levels
        uint256[] composedFrom; // IDs of cards that were composed to create this card
        uint256 battleCount; // Number of battles this card has participated in
        uint256 winCount; // Number of battles won with this card
    }

    struct Tournament {
        uint256 id;
        uint256 prizePool;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 minLevel;
        address[] participants;
        bool isActive;
        address winner;
    }

    struct Game {
        address player1;
        address player2;
        uint256[] player1Cards;
        uint256[] player2Cards;
        uint256 startTime;
        bool isFinished;
        address winner;
        uint256 currentTurn;  // Added to track turns
        bytes32[] moveHistory; // Added to store moves
        uint256 player1Health; // Added to track health
        uint256 player2Health; // Added to track health
    }

    struct GameMove {
        uint256 moveId;
        address player;
        uint256 cardId;
        uint8 moveType;
        uint256 timestamp;
        bytes signature;
        bool verified;
        bytes32 previousMoveHash; // For move chain verification
    }

    // Marketplace Structs
    struct Listing {
        uint256 cardId;
        address seller;
        uint256 price;
        uint256 listedAt;
        bool isActive;
    }

    // Mappings
    mapping(address => Player) public players;
    mapping(uint256 => Card) public cards;
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    mapping(uint256 => GameMove[]) public gameMoves; // Added to store moves per game
    mapping(bytes32 => bool) public verifiedMoveHashes; // Added for move verification
    mapping(uint256 => Listing) public marketListings; // Card ID to listing
    mapping(address => uint256[]) public sellerListings; // Seller address to listed card IDs

    // Events
    event PlayerRegistered(address indexed player);
    event CardMinted(uint256 indexed cardId, address indexed creator, string name);
    event GameStarted(uint256 indexed gameId, address indexed player1, address indexed player2);
    event GameEnded(uint256 indexed gameId, address indexed winner);
    event MoveSubmitted(uint256 indexed gameId, uint256 indexed moveId, address indexed player);
    event MoveVerified(uint256 indexed gameId, uint256 indexed moveId);
    event TournamentCreated(uint256 indexed tournamentId, uint256 prizePool, uint256 startTime);
    event TournamentWinner(uint256 indexed tournamentId, address indexed winner, uint256 prize);
    event ShardsAwarded(address indexed player, uint256 amount);
    event CardRedeemed(address indexed player, uint256 indexed cardId);
    event CardEvolved(uint256 indexed cardId, uint8 oldLevel, uint8 newLevel);
    event CardsComposed(uint256 indexed newCardId, uint256 indexed cardId1, uint256 indexed cardId2);
    event CardListed(uint256 indexed cardId, address indexed seller, uint256 price);
    event CardSold(uint256 indexed cardId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed cardId, address indexed seller);

    constructor() ERC721("MonadGameCard", "MONAD") {
        // Initialize with first card ID
        _cardIds.increment();
    }

    // Player Management
    function registerPlayer() external {
        require(!players[msg.sender].isRegistered, "Player already registered");

        players[msg.sender] = Player({
            wallet: msg.sender,
            experience: 0,
            level: 1,
            ownedCards: new uint256[](0),
            wins: 0,
            losses: 0,
            shards: 10, // Starting shards
            lastGameTime: 0,
            isRegistered: true,
            lastMoveHash: bytes32(0) // Initialize last move hash
        });

        emit PlayerRegistered(msg.sender);
    }

    function mintCard(
        string memory name,
        uint8 rarity,
        uint8 cardType,
        uint256 attack,
        uint256 defense,
        uint256 mana
    ) external payable returns (uint256) {
        require(players[msg.sender].isRegistered, "Player not registered");
        require(msg.value >= SHARD_MINT_COST, "Insufficient payment");

        uint256 newCardId = _cardIds.current();
        cards[newCardId] = Card({
            id: newCardId,
            name: name,
            rarity: rarity,
            cardType: cardType,
            attack: attack,
            defense: defense,
            mana: mana,
            mintTime: block.timestamp,
            creator: msg.sender,
            isActive: true, // Set card as active
            evolutionLevel: 0, // Base level
            composedFrom: new uint256[](0), // No composition initially
            battleCount: 0, // No battles initially
            winCount: 0 // No wins initially
        });

        _safeMint(msg.sender, newCardId);
        players[msg.sender].ownedCards.push(newCardId);

        _cardIds.increment();
        emit CardMinted(newCardId, msg.sender, name);

        return newCardId;
    }

    // Batch mint multiple cards at once - optimized for Monad's parallel execution
    function batchMintCards(
        string[] memory names,
        uint8[] memory rarities,
        uint8[] memory cardTypes,
        uint256[] memory attacks,
        uint256[] memory defenses,
        uint256[] memory manas
    ) external payable returns (uint256[] memory) {
        uint256 batchSize = names.length;
        require(batchSize > 0, "Must mint at least one card");
        require(batchSize <= 20, "Cannot mint more than 20 cards at once");

        // Validate all arrays have the same length
        require(rarities.length == batchSize, "Rarities array length mismatch");
        require(cardTypes.length == batchSize, "Card types array length mismatch");
        require(attacks.length == batchSize, "Attacks array length mismatch");
        require(defenses.length == batchSize, "Defenses array length mismatch");
        require(manas.length == batchSize, "Manas array length mismatch");

        // Validate payment
        require(msg.value >= SHARD_MINT_COST * batchSize, "Insufficient payment");
        require(players[msg.sender].isRegistered, "Player not registered");

        // Array to store the new card IDs
        uint256[] memory newCardIds = new uint256[](batchSize);

        // Mint all cards in batch
        for (uint256 i = 0; i < batchSize; i++) {
            uint256 newCardId = _cardIds.current();
            newCardIds[i] = newCardId;

            cards[newCardId] = Card({
                id: newCardId,
                name: names[i],
                rarity: rarities[i],
                cardType: cardTypes[i],
                attack: attacks[i],
                defense: defenses[i],
                mana: manas[i],
                mintTime: block.timestamp,
                creator: msg.sender,
                isActive: true,
                evolutionLevel: 0,
                composedFrom: new uint256[](0),
                battleCount: 0,
                winCount: 0
            });

            _safeMint(msg.sender, newCardId);
            players[msg.sender].ownedCards.push(newCardId);

            _cardIds.increment();
            emit CardMinted(newCardId, msg.sender, names[i]);
        }

        return newCardIds;
    }

    // Game Mechanics
    function startGame(address opponent, uint256[] memory selectedCards) external {
        require(players[msg.sender].isRegistered, "Player not registered");
        require(players[opponent].isRegistered, "Opponent not registered");
        require(selectedCards.length <= 3, "Too many cards selected");

        uint256 gameId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, opponent)));
        games[gameId] = Game({
            player1: msg.sender,
            player2: opponent,
            player1Cards: selectedCards,
            player2Cards: new uint256[](0),
            startTime: block.timestamp,
            isFinished: false,
            winner: address(0),
            currentTurn: 1, // Initialize turn
            moveHistory: new bytes32[](0), // Initialize move history
            player1Health: 100, // Initialize health
            player2Health: 100 // Initialize health
        });

        playerCurrentGame[msg.sender] = gameId;
        playerCurrentGame[opponent] = gameId;

        emit GameStarted(gameId, msg.sender, opponent);
    }

    function endGame(uint256 gameId, address winner) external {
        Game storage game = games[gameId];
        require(!game.isFinished, "Game already finished");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");

        game.isFinished = true;
        game.winner = winner;

        // Update player stats
        if (winner == game.player1) {
            players[game.player1].wins++;
            players[game.player2].losses++;
            _awardExperience(game.player1, 100);
            _awardShards(game.player1, 3);

            // Update card stats for player 1's cards
            for (uint256 i = 0; i < game.player1Cards.length; i++) {
                uint256 cardId = game.player1Cards[i];
                cards[cardId].battleCount++;
                cards[cardId].winCount++;
            }

            // Update battle count for player 2's cards
            for (uint256 i = 0; i < game.player2Cards.length; i++) {
                cards[game.player2Cards[i]].battleCount++;
            }
        } else {
            players[game.player2].wins++;
            players[game.player1].losses++;
            _awardExperience(game.player2, 100);
            _awardShards(game.player2, 3);

            // Update card stats for player 2's cards
            for (uint256 i = 0; i < game.player2Cards.length; i++) {
                uint256 cardId = game.player2Cards[i];
                cards[cardId].battleCount++;
                cards[cardId].winCount++;
            }

            // Update battle count for player 1's cards
            for (uint256 i = 0; i < game.player1Cards.length; i++) {
                cards[game.player1Cards[i]].battleCount++;
            }
        }

        emit GameEnded(gameId, winner);
    }

    function submitMove(
        uint256 gameId,
        uint256 cardId,
        uint8 moveType,
        bytes memory signature
    ) external {
        Game storage game = games[gameId];
        require(!game.isFinished, "Game already finished");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        require(cards[cardId].isActive, "Card is not active");

        uint256 moveId = _moveIds.current();
        bytes32 previousMoveHash = game.moveHistory.length > 0 ? game.moveHistory[game.moveHistory.length - 1] : bytes32(0);
        bytes32 moveHash = keccak256(abi.encodePacked(gameId, moveId, msg.sender, cardId, moveType, block.timestamp, previousMoveHash));

        gameMoves[gameId].push(GameMove({
            moveId: moveId,
            player: msg.sender,
            cardId: cardId,
            moveType: moveType,
            timestamp: block.timestamp,
            signature: signature,
            verified: false,
            previousMoveHash: previousMoveHash
        }));

        game.moveHistory.push(moveHash);
        players[msg.sender].lastMoveHash = moveHash;

        _moveIds.increment();
        emit MoveSubmitted(gameId, moveId, msg.sender);
    }

    function verifyMove(uint256 gameId, uint256 moveId) external {
        GameMove storage move = gameMoves[gameId][moveId];
        require(!move.verified, "Move already verified");

        bytes32 moveHash = keccak256(abi.encodePacked(gameId, move.moveId, move.player, move.cardId, move.moveType, move.timestamp, move.previousMoveHash));
        require(moveHash == players[move.player].lastMoveHash, "Invalid move hash");

        move.verified = true;
        verifiedMoveHashes[moveHash] = true;

        emit MoveVerified(gameId, moveId);
    }

    // Tournament System
    function createTournament(uint256 startTime, uint256 duration, uint256 minLevel) external payable {
        require(msg.value >= MIN_TOURNAMENT_PRIZE, "Prize pool too small");
        require(startTime > block.timestamp, "Invalid start time");
        require(duration >= 3600, "Duration too short"); // Minimum 1 hour
        require(duration <= 604800, "Duration too long"); // Maximum 1 week

        uint256 tournamentId = _tournamentIds.current();
        tournaments[tournamentId] = Tournament({
            id: tournamentId,
            prizePool: msg.value,
            entryFee: msg.value / 20, // 5% of prize pool
            startTime: startTime,
            endTime: startTime + duration,
            minLevel: minLevel,
            participants: new address[](0),
            isActive: true,
            winner: address(0)
        });

        _tournamentIds.increment();
        emit TournamentCreated(tournamentId, msg.value, startTime);
    }

    function joinTournament(uint256 tournamentId) external payable {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp < tournament.startTime, "Tournament already started");
        require(msg.value >= tournament.entryFee, "Insufficient entry fee");
        require(players[msg.sender].level >= tournament.minLevel, "Level too low");

        // Anti-cheat: Check if player hasn't already joined
        for(uint i = 0; i < tournament.participants.length; i++) {
            require(tournament.participants[i] != msg.sender, "Already joined");
        }

        // Anti-cheat: Ensure player has valid cards
        require(players[msg.sender].ownedCards.length >= 3, "Not enough cards");

        tournament.participants.push(msg.sender);
    }

    function endTournament(uint256 tournamentId) external {
        Tournament storage tournament = tournaments[tournamentId];
        require(tournament.isActive, "Tournament not active");
        require(block.timestamp >= tournament.endTime, "Tournament still in progress");
        require(tournament.participants.length > 0, "No participants");

        // Anti-cheat: Track wins only during tournament period
        address winner = tournament.participants[0];
        uint256 maxWins = 0;

        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            uint256 participantWins = 0;

            // Count wins only from tournament games
            GameMove[] storage moves = gameMoves[playerCurrentGame[participant]];
            for (uint256 j = 0; j < moves.length; j++) {
                if (moves[j].timestamp >= tournament.startTime &&
                    moves[j].timestamp <= tournament.endTime &&
                    moves[j].verified) {
                    participantWins++;
                }
            }

            if (participantWins > maxWins) {
                winner = participant;
                maxWins = participantWins;
            }
        }

        require(maxWins > 0, "No valid wins recorded");

        tournament.winner = winner;
        tournament.isActive = false;

        // Award prize pool to winner
        payable(winner).transfer(tournament.prizePool);

        // Award bonus shards and experience
        _awardShards(winner, 10);
        _awardExperience(winner, 500);

        emit TournamentWinner(tournamentId, winner, tournament.prizePool);
    }

    // Added tournament verification
    function verifyTournamentGames(uint256 tournamentId) external view returns (bool) {
        Tournament storage tournament = tournaments[tournamentId];

        for (uint256 i = 0; i < tournament.participants.length; i++) {
            address participant = tournament.participants[i];
            uint256 gameId = playerCurrentGame[participant];

            if (gameId != 0) {
                GameMove[] storage moves = gameMoves[gameId];
                for (uint256 j = 0; j < moves.length; j++) {
                    if (moves[j].timestamp >= tournament.startTime &&
                        moves[j].timestamp <= tournament.endTime) {
                        if (!moves[j].verified) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    // Get tournament participants
    function getTournamentParticipants(uint256 tournamentId) external view returns (address[] memory) {
        return tournaments[tournamentId].participants;
    }

    // Get tournament count
    function getTournamentCount() external view returns (uint256) {
        return _tournamentIds.current();
    }

    // Internal functions
    function _awardExperience(address player, uint256 amount) internal {
        players[player].experience += amount;

        // Level up if enough experience
        while (players[player].experience >= EXPERIENCE_PER_LEVEL * players[player].level) {
            players[player].level++;
        }
    }

    function _awardShards(address player, uint256 amount) internal {
        players[player].shards += amount;
        emit ShardsAwarded(player, amount);
    }

    // NFT Redemption
    function redeemNFT() external {
        Player storage player = players[msg.sender];
        require(player.isRegistered, "Player not registered");
        require(player.shards >= 10, "Not enough shards");

        // Generate a random rarity based on player level
        uint8 rarity;
        uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.difficulty))) % 100;

        if (player.level >= 10 && randomValue < 10) {
            rarity = 3; // Legendary (10% chance for level 10+)
        } else if (player.level >= 5 && randomValue < 30) {
            rarity = 2; // Epic (20% chance for level 5+)
        } else if (randomValue < 60) {
            rarity = 1; // Rare (30% chance)
        } else {
            rarity = 0; // Common (40% chance)
        }

        // Generate random stats based on rarity
        uint256 attack = 1 + uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, "attack"))) % (5 + rarity * 3);
        uint256 defense = 1 + uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, "defense"))) % (5 + rarity * 3);
        uint256 mana = 1 + uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, "mana"))) % (3 + rarity);

        // Generate card name based on rarity
        string memory name;
        if (rarity == 3) {
            name = "Legendary Monad Card";
        } else if (rarity == 2) {
            name = "Epic Monad Card";
        } else if (rarity == 1) {
            name = "Rare Monad Card";
        } else {
            name = "Common Monad Card";
        }

        // Mint the new card
        uint256 newCardId = _cardIds.current();
        cards[newCardId] = Card({
            id: newCardId,
            name: name,
            rarity: rarity,
            cardType: uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, "type"))) % 3), // Random type
            attack: attack,
            defense: defense,
            mana: mana,
            mintTime: block.timestamp,
            creator: msg.sender,
            isActive: true,
            evolutionLevel: 0, // Base level
            composedFrom: new uint256[](0), // No composition initially
            battleCount: 0, // No battles initially
            winCount: 0 // No wins initially
        });

        // Mint the NFT and assign to player
        _safeMint(msg.sender, newCardId);
        players[msg.sender].ownedCards.push(newCardId);

        // Deduct shards
        player.shards -= 10;

        _cardIds.increment();
        emit CardRedeemed(msg.sender, newCardId);
    }

    // Card Evolution - Allows a card to evolve to a higher level
    function evolveCard(uint256 cardId) external {
        require(_isApprovedOrOwner(msg.sender, cardId), "Not owner of card");
        Card storage card = cards[cardId];
        require(card.isActive, "Card is not active");
        require(card.evolutionLevel < 5, "Card already at max evolution");

        // Requirements for evolution based on current level
        if (card.evolutionLevel == 0) {
            require(card.battleCount >= 5, "Need 5 battles for first evolution");
        } else if (card.evolutionLevel == 1) {
            require(card.battleCount >= 15, "Need 15 battles for second evolution");
            require(card.winCount >= 5, "Need 5 wins for second evolution");
        } else if (card.evolutionLevel == 2) {
            require(card.battleCount >= 30, "Need 30 battles for third evolution");
            require(card.winCount >= 15, "Need 15 wins for third evolution");
        } else if (card.evolutionLevel == 3) {
            require(card.battleCount >= 50, "Need 50 battles for fourth evolution");
            require(card.winCount >= 25, "Need 25 wins for fourth evolution");
        } else if (card.evolutionLevel == 4) {
            require(card.battleCount >= 100, "Need 100 battles for final evolution");
            require(card.winCount >= 50, "Need 50 wins for final evolution");
        }

        // Cost in shards based on evolution level
        uint256 shardCost = 5 * (card.evolutionLevel + 1);
        require(players[msg.sender].shards >= shardCost, "Not enough shards");

        // Store old level for event
        uint8 oldLevel = card.evolutionLevel;

        // Evolve the card
        card.evolutionLevel += 1;

        // Improve card stats based on new evolution level
        card.attack += 2 * card.evolutionLevel;
        card.defense += 2 * card.evolutionLevel;
        card.mana = card.mana > 1 ? card.mana - 1 : 1; // Reduce mana cost (min 1)

        // Deduct shards
        players[msg.sender].shards -= shardCost;

        emit CardEvolved(cardId, oldLevel, card.evolutionLevel);
    }

    // Batch evolve multiple cards at once - optimized for Monad's parallel execution
    function batchEvolveCards(uint256[] memory cardIds) external {
        require(cardIds.length > 0, "Must evolve at least one card");
        require(cardIds.length <= 10, "Cannot evolve more than 10 cards at once");

        uint256 totalShardCost = 0;

        // First pass: validate all cards and calculate total shard cost
        for (uint256 i = 0; i < cardIds.length; i++) {
            uint256 cardId = cardIds[i];
            require(_isApprovedOrOwner(msg.sender, cardId), "Not owner of card");

            Card storage card = cards[cardId];
            require(card.isActive, "Card is not active");
            require(card.evolutionLevel < 5, "Card already at max evolution");

            // Requirements for evolution based on current level
            if (card.evolutionLevel == 0) {
                require(card.battleCount >= 5, "Need 5 battles for first evolution");
            } else if (card.evolutionLevel == 1) {
                require(card.battleCount >= 15, "Need 15 battles for second evolution");
                require(card.winCount >= 5, "Need 5 wins for second evolution");
            } else if (card.evolutionLevel == 2) {
                require(card.battleCount >= 30, "Need 30 battles for third evolution");
                require(card.winCount >= 15, "Need 15 wins for third evolution");
            } else if (card.evolutionLevel == 3) {
                require(card.battleCount >= 50, "Need 50 battles for fourth evolution");
                require(card.winCount >= 25, "Need 25 wins for fourth evolution");
            } else if (card.evolutionLevel == 4) {
                require(card.battleCount >= 100, "Need 100 battles for final evolution");
                require(card.winCount >= 50, "Need 50 wins for final evolution");
            }

            // Add to total shard cost
            totalShardCost += 5 * (card.evolutionLevel + 1);
        }

        // Check if player has enough shards
        require(players[msg.sender].shards >= totalShardCost, "Not enough shards for batch evolution");

        // Second pass: evolve all cards
        for (uint256 i = 0; i < cardIds.length; i++) {
            uint256 cardId = cardIds[i];
            Card storage card = cards[cardId];

            // Store old level for event
            uint8 oldLevel = card.evolutionLevel;

            // Evolve the card
            card.evolutionLevel += 1;

            // Improve card stats based on new evolution level
            card.attack += 2 * card.evolutionLevel;
            card.defense += 2 * card.evolutionLevel;
            card.mana = card.mana > 1 ? card.mana - 1 : 1; // Reduce mana cost (min 1)

            emit CardEvolved(cardId, oldLevel, card.evolutionLevel);
        }

        // Deduct total shards
        players[msg.sender].shards -= totalShardCost;
    }

    // Card Composition - Combine two cards to create a more powerful one
    function composeCards(uint256 cardId1, uint256 cardId2) external {
        require(_isApprovedOrOwner(msg.sender, cardId1), "Not owner of first card");
        require(_isApprovedOrOwner(msg.sender, cardId2), "Not owner of second card");
        require(cardId1 != cardId2, "Cannot compose the same card");

        Card storage card1 = cards[cardId1];
        Card storage card2 = cards[cardId2];

        require(card1.isActive, "First card is not active");
        require(card2.isActive, "Second card is not active");

        // Determine the new card's properties
        uint8 newRarity = card1.rarity > card2.rarity ? card1.rarity : card2.rarity;
        if (card1.rarity == card2.rarity && newRarity < 3) {
            newRarity += 1; // Upgrade rarity if both cards are same rarity (up to legendary)
        }

        // Calculate new stats
        uint256 newAttack = (card1.attack + card2.attack) * 6 / 10; // 60% of combined attack
        uint256 newDefense = (card1.defense + card2.defense) * 6 / 10; // 60% of combined defense
        uint256 newMana = (card1.mana + card2.mana) * 7 / 10; // 70% of combined mana (more efficient)

        // Generate name based on composition
        string memory newName;
        if (newRarity == 3) {
            newName = "Legendary Fusion Card";
        } else if (newRarity == 2) {
            newName = "Epic Fusion Card";
        } else if (newRarity == 1) {
            newName = "Rare Fusion Card";
        } else {
            newName = "Common Fusion Card";
        }

        // Create the composed card
        uint256 newCardId = _cardIds.current();

        // Track composition history
        uint256[] memory composedFromCards = new uint256[](2);
        composedFromCards[0] = cardId1;
        composedFromCards[1] = cardId2;

        cards[newCardId] = Card({
            id: newCardId,
            name: newName,
            rarity: newRarity,
            cardType: card1.cardType, // Inherit type from first card
            attack: newAttack,
            defense: newDefense,
            mana: newMana,
            mintTime: block.timestamp,
            creator: msg.sender,
            isActive: true,
            evolutionLevel: 0, // Start at base evolution level
            composedFrom: composedFromCards,
            battleCount: 0,
            winCount: 0
        });

        // Mint the new NFT
        _safeMint(msg.sender, newCardId);
        players[msg.sender].ownedCards.push(newCardId);

        // Deactivate the original cards
        card1.isActive = false;
        card2.isActive = false;

        // Increment card ID counter
        _cardIds.increment();

        emit CardsComposed(newCardId, cardId1, cardId2);
    }

    // View functions
    function getPlayer(address playerAddress) external view returns (
        uint256 experience,
        uint256 level,
        uint256 wins,
        uint256 losses,
        uint256 shards,
        bool isRegistered
    ) {
        Player memory player = players[playerAddress];
        return (
            player.experience,
            player.level,
            player.wins,
            player.losses,
            player.shards,
            player.isRegistered
        );
    }

    function getPlayerCards(address playerAddress) external view returns (uint256[] memory) {
        return players[playerAddress].ownedCards;
    }

    function getCard(uint256 cardId) external view returns (
        string memory name,
        uint8 rarity,
        uint8 cardType,
        uint256 attack,
        uint256 defense,
        uint256 mana,
        uint8 evolutionLevel,
        uint256 battleCount,
        uint256 winCount,
        bool isActive,
        address creator,
        uint256 mintTime
    ) {
        Card memory card = cards[cardId];
        return (
            card.name,
            card.rarity,
            card.cardType,
            card.attack,
            card.defense,
            card.mana,
            card.evolutionLevel,
            card.battleCount,
            card.winCount,
            card.isActive,
            card.creator,
            card.mintTime
        );
    }

    function getCardComposition(uint256 cardId) external view returns (uint256[] memory) {
        return cards[cardId].composedFrom;
    }

    // Marketplace Functions
    function listCard(uint256 cardId, uint256 price) external {
        require(_isApprovedOrOwner(msg.sender, cardId), "Not owner of card");
        require(cards[cardId].isActive, "Card is not active");
        require(price > 0, "Price must be greater than zero");

        // Create the listing
        marketListings[cardId] = Listing({
            cardId: cardId,
            seller: msg.sender,
            price: price,
            listedAt: block.timestamp,
            isActive: true
        });

        // Add to seller's listings
        sellerListings[msg.sender].push(cardId);

        emit CardListed(cardId, msg.sender, price);
    }

    // Batch list multiple cards at once - optimized for Monad's parallel execution
    function batchListCards(uint256[] memory cardIds, uint256[] memory prices) external {
        require(cardIds.length == prices.length, "Arrays must be same length");
        require(cardIds.length > 0, "Must list at least one card");
        require(cardIds.length <= 20, "Cannot list more than 20 cards at once");

        for (uint256 i = 0; i < cardIds.length; i++) {
            uint256 cardId = cardIds[i];
            uint256 price = prices[i];

            require(_isApprovedOrOwner(msg.sender, cardId), "Not owner of card");
            require(cards[cardId].isActive, "Card is not active");
            require(price > 0, "Price must be greater than zero");

            // Create the listing
            marketListings[cardId] = Listing({
                cardId: cardId,
                seller: msg.sender,
                price: price,
                listedAt: block.timestamp,
                isActive: true
            });

            // Add to seller's listings
            sellerListings[msg.sender].push(cardId);

            emit CardListed(cardId, msg.sender, price);
        }
    }

    function buyCard(uint256 cardId) external payable {
        Listing storage listing = marketListings[cardId];
        require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own card");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Transfer ownership of the NFT
        _transfer(seller, msg.sender, cardId);

        // Update player's owned cards
        players[msg.sender].ownedCards.push(cardId);

        // Remove from seller's owned cards
        uint256[] storage sellerCards = players[seller].ownedCards;
        for (uint256 i = 0; i < sellerCards.length; i++) {
            if (sellerCards[i] == cardId) {
                sellerCards[i] = sellerCards[sellerCards.length - 1];
                sellerCards.pop();
                break;
            }
        }

        // Deactivate the listing
        listing.isActive = false;

        // Transfer payment to seller
        payable(seller).transfer(price);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit CardSold(cardId, seller, msg.sender, price);
    }

    // Batch buy multiple cards at once - optimized for Monad's parallel execution
    function batchBuyCards(uint256[] memory cardIds) external payable {
        require(cardIds.length > 0, "Must buy at least one card");
        require(cardIds.length <= 10, "Cannot buy more than 10 cards at once");

        uint256 totalCost = 0;
        address[] memory sellers = new address[](cardIds.length);
        uint256[] memory prices = new uint256[](cardIds.length);

        // First pass: validate all purchases and calculate total cost
        for (uint256 i = 0; i < cardIds.length; i++) {
            uint256 cardId = cardIds[i];
            Listing storage listing = marketListings[cardId];

            require(listing.isActive, "Listing is not active");
            require(msg.sender != listing.seller, "Cannot buy your own card");

            sellers[i] = listing.seller;
            prices[i] = listing.price;
            totalCost += listing.price;
        }

        require(msg.value >= totalCost, "Insufficient payment for batch purchase");

        // Second pass: process all purchases
        for (uint256 i = 0; i < cardIds.length; i++) {
            uint256 cardId = cardIds[i];
            address seller = sellers[i];
            uint256 price = prices[i];

            // Transfer ownership of the NFT
            _transfer(seller, msg.sender, cardId);

            // Update player's owned cards
            players[msg.sender].ownedCards.push(cardId);

            // Remove from seller's owned cards
            uint256[] storage sellerCards = players[seller].ownedCards;
            for (uint256 j = 0; j < sellerCards.length; j++) {
                if (sellerCards[j] == cardId) {
                    sellerCards[j] = sellerCards[sellerCards.length - 1];
                    sellerCards.pop();
                    break;
                }
            }

            // Deactivate the listing
            marketListings[cardId].isActive = false;

            // Transfer payment to seller
            payable(seller).transfer(price);

            emit CardSold(cardId, seller, msg.sender, price);
        }

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    function cancelListing(uint256 cardId) external {
        Listing storage listing = marketListings[cardId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing is not active");

        listing.isActive = false;

        emit ListingCancelled(cardId, msg.sender);
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 count = 0;

        // Count active listings
        for (uint256 i = 1; i < _cardIds.current(); i++) {
            if (marketListings[i].isActive) {
                count++;
            }
        }

        // Create array of active listing IDs
        uint256[] memory activeListings = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i < _cardIds.current(); i++) {
            if (marketListings[i].isActive) {
                activeListings[index] = i;
                index++;
            }
        }

        return activeListings;
    }

    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    // Emergency functions
    function withdrawBalance() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
