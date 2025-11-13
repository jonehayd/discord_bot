/**
 * @file remove-balance.js
 * @description Removes from a user's balance
 * @module commands/economy/subcommands/
 */

const { removeBalance } = require('@database/currency.js');

module.exports = {
    name: 'remove-balance',
    data: subcommand =>
        subcommand
            .setName('removebalance')
            .setDescription('Remove from someone\'s balance')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to remove money from')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The amount to remove')
                    .setRequired(true)
                    .setMinValue(1)
            ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        await removeBalance(targetUser.id, amount);
        await interaction.reply(`Removed ${amount} 🥥 from ${targetUser.username}'s balance.`);
    }
};