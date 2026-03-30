import { removeBalance } from "../../database/currency.js";
import { SlashCommandSubcommandBuilder } from "discord.js";

export default {
  name: "remove-balance",
  data: new SlashCommandSubcommandBuilder()
    .setName("removebalance")
    .setDescription("Remove from someone's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove money from")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to remove")
        .setRequired(true)
        .setMinValue(1),
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    await removeBalance(targetUser.id, amount);
    await interaction.reply(
      `Removed ${amount} 🥥 from ${targetUser.username}'s balance.`,
    );
  },
};
