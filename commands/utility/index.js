const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const { loadSubcommands } = require('@utils/load-subcommands');

const name = 'utility';
const { subcommands, addToBuilder } = loadSubcommands(__dirname);

// Create slash command builder
let builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription('Debugging and utility tools');

// Add subcommands to builder
builder = addToBuilder(builder);

module.exports = {
    name,
    data: builder,
    cooldown: 5,
    subcommands,       
    loadSubcommands: true,
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cmd = this.subcommands.get(sub);

        if (!cmd) {
            return interaction.reply({
                content: 'Unknown subcommand.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await cmd.execute(interaction);
        } catch (err) {
            console.error(`Error executing /utility ${sub}:`, err);

            const msg = {
                content: `There was an error executing that utility command.`,
                flags: MessageFlags.Ephemeral
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg);
            } else {
                await interaction.reply(msg);
            }
        }
    }
};
