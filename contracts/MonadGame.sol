// SPDX-License-Identifier: MIT
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
    }

    // Mappings
    mapping(address => Player) public players;
    mapping(uint256 => Card) public cards;
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerCurrentGame;

    // Events
    event PlayerRegistered(address indexed player);
    event CardMinted(uint256 indexed cardId, address indexed creator, string name);
    event GameStarted(uint256 indexed gameId, address indexed player1, address indexed player2);
    event GameEnded(uint256 indexed gameId, address indexed winner);
    event TournamentCreated(uint256 indexed tournamentId, uint256 prizePool, uint256 startTime);
    event TournamentWinner(uint256 indexed tournamentId, address indexed winner, uint256 prize);
    event ShardsAwarded(address indexed player, uint256 amount);
    event CardRedeemed(address indexed player, uint256 indexed cardId);

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
            isRegistered: true
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
            creator: msg.sender
        });

        _safeMint(msg.sender, newCardId);
        players[msg.sender].ownedCards.push(newCardId);

        _cardIds.increment();
        emit CardMinted(newCardId, msg.sender, name);

        return newCardId;
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
            winner: address(0)
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
        } else {
            players[game.player2].wins++;
            players[game.player1].losses++;
            _awardExperience(game.player2, 100);
            _awardShards(game.player2, 3);
        }

        emit GameEnded(gameId, winner);
    }

    // Tournament System
    function createTournament(uint256 startTime, uint256 duration, uint256 minLevel) external payable {
        require(msg.value >= MIN_TOURNAMENT_PRIZE, "Prize pool too small");
        require(startTime > block.timestamp, "Invalid start time");

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

        tournament.participants.push(msg.sender);
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
        uint256 mana
    ) {
        Card memory card = cards[cardId];
        return (
            card.name,
            card.rarity,
            card.cardType,
            card.attack,
            card.defense,
            card.mana
        );
    }

    // Emergency functions
    function withdrawBalance() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
