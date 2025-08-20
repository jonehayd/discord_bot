const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const hangmanManager = require('@root/utils/hangman-manager.js');

module.exports = {
    name: 'hangman',
    data: subcommand =>
        subcommand
            .setName('hangman')
            .setDescription('Play a game of Hangman!'),
    async execute(interaction) {
        const gameId = `${interaction.guildId}_${interaction.user.id}`;
        
        // Check if there's already an active game in this channel
        if (hangmanManager.hasGame(gameId)) {
            return interaction.reply({ 
                content: '❌ You already have an active Hangman game! Finish it first.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Create new game
        const word = hangmanManager.getRandomWord();
        const game = hangmanManager.createGame(gameId, word, interaction.user.id);

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

        const embed = hangmanManager.createGameEmbed(game);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};