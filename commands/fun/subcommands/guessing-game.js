const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'guessing-game',
    data: subcommand =>
        subcommand
            .setName('guessing-game')
            .setDescription(`Guess a number 1-5.`)
            .addStringOption(option =>
                option.setName('guess')
                    .setDescription('Your guess (1-5)')
                    .setRequired(true)
            ),
    async execute(interaction) {
        const guess = parseInt(interaction.options.getString('guess'), 10);

        if (guess < 1 || guess > 5) {
            return interaction.reply('Please guess a number between 1 and 5.');
        }

        const randomNumber = Math.floor(Math.random() * 5) + 1;
        if (guess == randomNumber) {
            return interaction.reply(`Nice! You guessed the correct number: ${randomNumber}.`);
        } else {
            return interaction.reply(`Incorrect! The correct number was ${randomNumber}.`);
        }
    }
}