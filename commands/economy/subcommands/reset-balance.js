/**
 * @file add-balance.js
 * @description Adds to a user's balance
 * @module commands/economy/subcommands/
 */

const { resetBalance } = require('@database/currency.js');

module.exports = {
    name: 'reset-balance',
    data: subcommand =>
        subcommand
            .setName('resetbalance')
            .setDescription('Reset a user\'s balance')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user who\'s balance will be reset')
                    .setRequired(true)
            ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        await resetBalance(targetUser.id);
        await interaction.reply(`Reset ${targetUser.username}'s balance to 0 🥥.`);
    }
};