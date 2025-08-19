const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Currency management commands'),
    loadSubcommands: true,
    cooldown: 5,
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = this.subcommands?.get(subcommandName);

        if (!subcommand) {
            return interaction.reply({ 
                content: 'Unknown subcommand.', 
                ephemeral: true 
            });
        }

        try {
            await subcommand.execute(interaction);
        } catch (error) {
            console.error(`Error handling /economy ${subcommandName}:`, error);

            const errorMessage = {
                content: 'There was an error executing that currency command. Please try again later.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};