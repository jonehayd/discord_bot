const { Events, MessageFlags } = require('discord.js');
const blackjackManager = require('@commands/games/blackjack.js');
const { addBalance, removeBalance } = require('@database/currency.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton() || !interaction.customId.startsWith('blackjack_')) return;

        await interaction.deferUpdate(); // acknowledge the button

        const [, type, guildId, ownerId] = interaction.customId.split('_');
        const gameId = `${guildId}_${ownerId}`;

        if (interaction.user.id !== ownerId) {
            return interaction.followUp({
                content: '❌ This isn’t your game! Start your own with `/games blackjack`.',
                ephemeral: true
            });
        }

        const game = blackjackManager.getGame(gameId);
        if (!game) return interaction.followUp({ content: 'This blackjack game is no longer active!', ephemeral: true });

        let { playerHand, botHand, deck, betAmount } = game;

        if (type === 'hit') {
            playerHand.push(blackjackManager.drawCard(deck));

            // Check if player busted immediately
            if (blackjackManager.getCardSum(playerHand) > 21) {
                const embed = blackjackManager.createGameEmbed(game, true, false);
                blackjackManager.deleteGame(gameId);
                return interaction.editReply({ embeds: [embed], components: [] });
            }
        }

        if (type === 'stay') {
            // Bot plays only after player stays
            while (botShouldHit(botHand)) {
                botHand.push(blackjackManager.drawCard(deck));
            }

            const playerSum = blackjackManager.getCardSum(playerHand);
            const botSum = blackjackManager.getCardSum(botHand);

            let playerWon = false;
            if (playerSum > 21) playerWon = false;
            else if (botSum > 21) playerWon = true;
            else if (playerSum > botSum) playerWon = true;
            else if (botSum > playerSum) playerWon = false;
            else playerWon = null; // tie (push)

            if (playerWon === true) {
                addBalance(interaction.user.id, betAmount);
            } else if (playerWon === false) {
                removeBalance(interaction.user.id, betAmount);
            }

            const embed = blackjackManager.createGameEmbed(game, true, playerWon);
            blackjackManager.deleteGame(gameId);
            return interaction.editReply({ embeds: [embed], components: [] });
        }

        const embed = blackjackManager.createGameEmbed(game);
        await interaction.editReply({ embeds: [embed] });
    }
};

function botShouldHit(hand) {
    const total = blackjackManager.getCardSum(hand);
    const hasAce = hand.some(card => card.value === 'A');

    // Hit on soft 17
    if (total === 17 && hasAce) return true;
    return total <= 16;
}
