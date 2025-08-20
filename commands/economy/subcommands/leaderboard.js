/**
 * @file balance.js
 * @description States a user's current balance
 * @module commands/economy/subcommands/
 */

const { getLeaderboard } = require('@database/currency.js');

module.exports = {
    name: 'leaderboard',
    data: subcommand =>
        subcommand
            .setName('leaderboard')
            .setDescription('Displays the top 5 user\'s with the most 🥥'),
    async execute(interaction) {
        const users = getLeaderboard();
        const members = await Promise.all(
            users.map(user => interaction.guild.members.fetch(user.id))
        );

        let output = "Leaderboard:\n";
        members.forEach((member, i) => {
            output += `${i + 1}. ${member.user.username} - $${users[i].balance}\n`;
        });

        await interaction.reply(output);
    },
};