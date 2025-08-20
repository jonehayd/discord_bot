/**
 * @file utility.js
 * @description Slash command for all utility commands
 * @module commands/utility/
 */

const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const name = 'utility';

module.exports = {
    name,
    data: new SlashCommandBuilder()
        .setName(name)
        .setDescription('Debugging commands'),
    loadSubcommands: true,
    cooldown: 5,
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = this.subcommands?.get(subcommandName);

        if (!subcommand) {
            return interaction.reply({ 
                content: 'Unknown subcommand.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            await subcommand.execute(interaction);
        } catch (error) {
            console.error(`Error handling /${this.name} ${subcommandName}:`, error);

            const errorMessage = {
                content: `There was an error executing that ${this.name} command. Please try again later.`,
                flags: MessageFlags.Ephemeral
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};