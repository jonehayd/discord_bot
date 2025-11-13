const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

const games = new Map();

module.exports = {
    name: 'blackjack',
    data: new SlashCommandSubcommandBuilder()
            .setName('blackjack')
            .setDescription('Play a game of Blackjack!')
            .addIntegerOption(option =>
                option.setName('bet')
                    .setDescription('Amount to bet')
                    .setRequired(true)
                    .setMinValue(1)
            ),
    async execute(interaction) {
        const betAmount = interaction.options.getInteger('bet');
        const gameId = `${interaction.guildId}_${interaction.user.id}`;

        if (hasGame(gameId)) {
            return interaction.reply({
                content: '❌ You already have an active Blackjack game! Finish it first.',
                ephemeral: true
            });
        }

        const game = createGame(gameId, interaction.user.id, betAmount);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`blackjack_hit_${interaction.guildId}_${interaction.user.id}`)
                .setLabel('Hit')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👋'),
            new ButtonBuilder()
                .setCustomId(`blackjack_stay_${interaction.guildId}_${interaction.user.id}`)
                .setLabel('Stay')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🤚')
        );

        const embed = createGameEmbed(game);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
    getGame,
    deleteGame,
    hasGame,
    drawCard,
    createGameEmbed,
    getCardSum
};

// --- Game Management ---
function createGame(gameId, playerId, betAmount) {
    const deck = buildDeck();
    shuffle(deck);

    const game = {
        deck,
        playerId,
        betAmount,
        playerHand: [drawCard(deck), drawCard(deck)],
        botHand: [drawCard(deck), drawCard(deck)],
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

// --- Deck and Cards ---
function buildDeck() {
    const suits = ['♦', '♠', '❤', '♣'];
    const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];

    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ value: rank, suit });
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(deck) {
    return deck.pop();
}

function getCardSum(hand) {
    let sum = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            sum += 1;
            aces++;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            sum += 10;
        } else {
            sum += card.value;
        }
    }

    while (aces > 0 && sum + 10 <= 21) {
        sum += 10;
        aces--;
    }

    return sum;
}

// --- Embed Creation ---
function createGameEmbed(game, isGameOver = false, won = false) {
    const embed = new EmbedBuilder()
        .setTitle('🂡 Blackjack Game')
        .setColor(isGameOver ? (won ? 0x00ff00 : 0xff0000) : 0x0099ff);

    const playerCards = game.playerHand.map(c => `${c.value}${c.suit}`).join(', ');
    const botCards = isGameOver
        ? game.botHand.map(c => `${c.value}${c.suit}`).join(', ')
        : `${game.botHand[0].value}${game.botHand[0].suit} - ?`;
    
    const playerSum = getCardSum(game.playerHand);
    const botSum = isGameOver ? getCardSum(game.botHand) : '?';

    embed.addFields(
        { name: '🧑 Player Hand', value: `${playerCards} (Sum: ${playerSum})`, inline: false },
        { name: '🤖 Bot Hand', value: `${botCards} (Sum: ${botSum})`, inline: false }
    );

    if (isGameOver) {
        embed.addFields({
            name: '🎯 Result',
            value: won
                ? `You won! +${game.betAmount} 🥥`
                : `You lost! -${game.betAmount} 🥥`,
            inline: false
        });
    }

    return embed;
}
