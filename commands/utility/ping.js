const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	name: 'ping',
	data: new SlashCommandSubcommandBuilder()
			.setName('ping')
			.setDescription('Replies with Pong!'
		),
	cooldown: 5,
	async execute(context) {
		await context.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
	},
};