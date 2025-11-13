const { 
    Events, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    EmbedBuilder, 
    MessageFlags 
} = require('discord.js');

const hangmanManager = require('@commands/games/hangman.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton() && interaction.customId.startsWith('hangman_')) {
            const [ , type, guildId, ownerId] = interaction.customId.split('_'); // skip "hangman"
            const gameId = `${guildId}_${ownerId}`;

            // Restrict to game owner
            if (interaction.user.id !== ownerId) {
                return interaction.reply({ 
                    content: '❌ This isn’t your game! Start your own with `/games hangman`.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const game = hangmanManager.getGame(gameId);
            if (!game) {
                return interaction.reply({ 
                    content: 'This Hangman game is no longer active!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (type === 'guess') {
                const modal = new ModalBuilder()
                    .setCustomId(`hangman_modal_${gameId}`)
                    .setTitle('Hangman - Guess a Letter');

                const guessInput = new TextInputBuilder()
                    .setCustomId('letter_input')
                    .setLabel('Enter a single letter')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(1)
                    .setMinLength(1)
                    .setPlaceholder('Type a letter (A-Z)')
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(guessInput);
                modal.addComponents(row);

                return interaction.showModal(modal);

            } else if (type === 'quit') {
                hangmanManager.deleteGame(gameId);

                const embed = new EmbedBuilder()
                    .setTitle('🎮 Hangman Game')
                    .setDescription(`Game ended by ${interaction.user}.\nThe word was: **${game.word}**`)
                    .setColor(0xff9900);

                return interaction.update({ embeds: [embed], components: [] });
            }
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('hangman_modal_')) {
            const gameId = interaction.customId.split('_').slice(2).join('_');
            const game = hangmanManager.getGame(gameId);

            if (!game) {
                return interaction.reply({ 
                    content: 'This Hangman game is no longer active!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const guess = interaction.fields.getTextInputValue('letter_input').toUpperCase();

            if (!/^[A-Z]$/.test(guess)) {
                return interaction.reply({ 
                    content: '❌ Please enter a valid letter (A-Z)!', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const result = hangmanManager.processGuess(game, guess);
            if (result.error === 'already_guessed') {
                return interaction.reply({ 
                    content: `❌ You already guessed **${guess}**!`, 
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (result.gameOver) {
                hangmanManager.deleteGame(gameId);
            }

            const embed = hangmanManager.createGameEmbed(game, result.gameOver, result.won);

            const components = result.gameOver ? [] : [
                new ActionRowBuilder().addComponents(
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
                )
            ];

            return interaction.reply({ embeds: [embed], components });
        }
    },
};
