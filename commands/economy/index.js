const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const { loadSubcommands } = require('@utils/load-subcommands');

const name = 'economy';

// Load subcommands from this folder
const { subcommands, addToBuilder } = loadSubcommands(__dirname);

// Create slash command builder
let builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Currency management commands');

// Add subcommands to builder
builder = addToBuilder(builder);

module.exports = {
    name,
    data: builder,
    cooldown: 5,
    subcommands,          
    loadSubcommands: true,

    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = this.subcommands.get(subcommandName);

        if (!subcommand) {
            return interaction.reply({
                content: 'Unknown subcommand.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await subcommand.execute(interaction);
        } catch (error) {
            console.error(`Error executing /economy ${subcommandName}:`, error);

            const errorMessage = {
                content: `There was an error executing that economy command. Please try again later.`,
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
