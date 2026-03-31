import { transferBalance } from "../../database/currency.js";
import { SlashCommandSubcommandBuilder } from "discord.js";

export default {
  name: "transfer-balance",
  data: new SlashCommandSubcommandBuilder()
    .setName("transferbalance")
    .setDescription("Transfer money from one person to another")
    .addUserOption((option) =>
      option
        .setName("user_from")
        .setDescription("The user to take money from")
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName("user_to")
        .setDescription("The user to transfer money to")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to transfer")
        .setRequired(true),
    ),
  async execute(interaction) {
    const userFrom = interaction.options.getUser("user_from");
    const userTo = interaction.options.getUser("user_to");
    const amount = interaction.options.getInteger("amount");

    await transferBalance(userFrom.id, userTo.id, amount);
    await interaction.reply(
      `Transfered ${amount} 🥥 from ${userFrom.username} to ${userTo.username}.`,
    );
  },
};
