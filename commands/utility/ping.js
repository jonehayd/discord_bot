const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	cooldown: 5,

	async execute(context) {
		await context.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
	},
};