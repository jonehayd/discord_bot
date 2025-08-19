const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance, removeBalance } = require('@root/currency.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Currency management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Check a user\'s balance')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check the balance of')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addbalance')
                .setDescription('Add balance to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add balance to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The amount to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removebalance')
                .setDescription('Remove balance from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove balance from')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The amount to remove')
                        .setRequired(true)
                )
        ),
    cooldown: 5,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'balance') {
                const targetUser = interaction.options.getUser('user') || interaction.user;
                const balance = await getBalance(targetUser.id);

                await interaction.reply(`${targetUser.username}'s balance is: ${balance} 🥥.`);
            } 
            else if (subcommand === 'addbalance') {
                const targetUser = interaction.options.getUser('user');
                const amount = interaction.options.getInteger('amount');

                await addBalance(targetUser.id, amount);
                await interaction.reply(`Added ${amount} 🥥 to ${targetUser.username}'s balance.`);
            } 
            else if (subcommand === 'removebalance') {
                const targetUser = interaction.options.getUser('user');
                const amount = interaction.options.getInteger('amount');

                await removeBalance(targetUser.id, amount);
                await interaction.reply(`Removed ${amount} 🥥 from ${targetUser.username}'s balance.`);
            }
        } catch (error) {
            console.error(`Error handling /currency ${subcommand}:`, error);
            await interaction.reply({
                content: 'There was an error executing that currency command. Please try again later.',
                ephemeral: true
            });
        }
    }
};
