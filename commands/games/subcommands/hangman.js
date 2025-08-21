const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require('discord.js');

const winAmount = 300;

// Store active games
const games = new Map();

// Word list for the game
const WORDS = [
    'DISCORD', 'JAVASCRIPT', 'COMPUTER', 'PROGRAMMING', 'GAMING', 'INTERNET',
    'KEYBOARD', 'MONITOR', 'CODING', 'SOFTWARE', 'HARDWARE', 'NETWORK',
    'DATABASE', 'ALGORITHM', 'FUNCTION', 'VARIABLE', 'BOOLEAN', 'STRING'
];

// Hangman ASCII art stages
const HANGMAN_STAGES = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```', // 0 wrong
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```', // 1 wrong
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```', // 2 wrong
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```', // 3 wrong
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```', // 4 wrong
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```', // 5 wrong
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```'  // 6 wrong - game over
];

/**
 * Get a random word for the game
 */
function getRandomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Create a new hangman game
 */
function createGame(gameId, word, playerId) {
    const game = {
        word,
        progress: word.split('').map(() => '_'),
        guesses: [],
        wrongGuesses: 0,
        playerId,
        startTime: Date.now()
    };
    
    games.set(gameId, game);
    return game;
}

function getGame(gameId) {
    return games.get(gameId);
}

function deleteGame(gameId) {
    return games.delete(gameId);
}

function hasGame(gameId) {
    return games.has(gameId);
}

function processGuess(game, letter) {
    if (game.guesses.includes(letter)) {
        return { error: 'already_guessed' };
    }

    game.guesses.push(letter);
    let correct = false;

    // Check if the letter is in the word
    for (let i = 0; i < game.word.length; i++) {
        if (game.word[i] === letter) {
            game.progress[i] = letter;
            correct = true;
        }
    }

    if (!correct) {
        game.wrongGuesses++;
    }

    // Check game state
    const won = game.progress.join('') === game.word;
    const lost = game.wrongGuesses >= 6;

    return {
        correct,
        won,
        lost,
        gameOver: won || lost
    };
}

function createGameEmbed(game, isGameOver = false, won = false) {
    const embed = new EmbedBuilder()
        .setTitle('🎮 Hangman Game')
        .setColor(isGameOver ? (won ? 0x00ff00 : 0xff0000) : 0x0099ff);

    // Add hangman drawing
    embed.addFields({
        name: 'Hangman',
        value: HANGMAN_STAGES[game.wrongGuesses] || HANGMAN_STAGES[0],
        inline: true
    });

    // Add current word progress
    const displayWord = game.progress.join(' ');
    embed.addFields({
        name: 'Word',
        value: `\`${displayWord}\``,
        inline: true
    });

    // Add guessed letters
    if (game.guesses.length > 0) {
        const correctGuesses = game.guesses.filter(letter => game.word.includes(letter));
        const wrongGuesses = game.guesses.filter(letter => !game.word.includes(letter));

        let guessText = '';
        if (correctGuesses.length > 0) {
            guessText += `✅ Correct: ${correctGuesses.join(', ')}\n`;
        }
        if (wrongGuesses.length > 0) {
            guessText += `❌ Wrong: ${wrongGuesses.join(', ')}`;
        }
        
        embed.addFields({ 
            name: 'Guessed Letters', 
            value: guessText || 'None yet', 
            inline: false 
        });
    }

    // Add game status
    if (isGameOver) {
        if (won) {
            embed.addFields({ 
                name: '🎉 Result', 
                value: `Congratulations! You won!\nThe word was: **${game.word}**\nYou have been awarded ${winAmount} 🥥!`, 
                inline: false 
            });
        } else {
            embed.addFields({ 
                name: '💀 Result', 
                value: `Game Over! You lost!\nThe word was: **${game.word}**`, 
                inline: false 
            });
        }
    } else {
        embed.addFields({ 
            name: 'Status', 
            value: `Wrong guesses: ${game.wrongGuesses}/6\nGuesses remaining: ${6 - game.wrongGuesses}`, 
            inline: false 
        });
    }

    return embed;
}

module.exports = {
    name: 'hangman',
    data: subcommand =>
        subcommand
            .setName('hangman')
            .setDescription(`Play a game of Hangman! Win ${winAmount} 🥥`),
    async execute(interaction) {
        const gameId = `${interaction.guildId}_${interaction.user.id}`;
        
        // Check if there's already an active game in this channel
        if (hasGame(gameId)) {
            return interaction.reply({ 
                content: '❌ You already have an active Hangman game! Finish it first.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Create new game
        const word = getRandomWord();
        const game = createGame(gameId, word, interaction.user.id);

        // Create buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`hangman_guess_${gameId}`)
                .setLabel('Guess a Letter')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔤'),
            new ButtonBuilder()
                .setCustomId(`hangman_quit_${gameId}`)
                .setLabel('Quit Game')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

        const embed = createGameEmbed(game);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
    // Game management
    createGame,
    getGame,
    deleteGame,
    hasGame,
    
    // Game logic
    getRandomWord,
    processGuess,
    createGameEmbed,
    
    // Constants
    WORDS,
    HANGMAN_STAGES
};

