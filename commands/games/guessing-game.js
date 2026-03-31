import { SlashCommandSubcommandBuilder } from "discord.js";
import { addBalance } from "../../database/currency.js";

const winAmount = 100;

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName("guessing-game")
    .setDescription(`Guess a number 1-5. Win ${winAmount} 🥥!`)
    .addStringOption((option) =>
      option
        .setName("guess")
        .setDescription("Your guess (1-5)")
        .setRequired(true),
    ),
  async execute(interaction) {
    const guess = parseInt(interaction.options.getString("guess"), 10);

    if (guess < 1 || guess > 5) {
      return interaction.reply("Please guess a number between 1 and 5.");
    }

    const randomNumber = Math.floor(Math.random() * 5) + 1;

    if (guess === randomNumber) {
      await addBalance(interaction.user.id, winAmount);
      return interaction.reply(
        `Nice! You guessed the correct number: ${randomNumber}\nYou win ${winAmount} 🥥`,
      );
    } else {
      return interaction.reply(
        `Incorrect! The correct number was ${randomNumber}.`,
      );
    }
  },
};
