const { getBalance } = require('@database/currency.js');
const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
    name: 'balance',
    data: new SlashCommandSubcommandBuilder()
            .setName('balance')
            .setDescription('Check a user\'s balance')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to check the balance of')
                    .setRequired(false)
            ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const balance = await getBalance(targetUser.id);

        await interaction.reply(`${targetUser.username}'s balance is: ${balance} 🥥.`);
    },
};