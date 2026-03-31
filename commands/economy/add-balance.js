import { addBalance } from "../../database/currency.js";
import { SlashCommandSubcommandBuilder } from "discord.js";

export default {
  name: "add-balance",
  data: new SlashCommandSubcommandBuilder()
    .setName("addbalance")
    .setDescription("Add to someone's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to add money to")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to add")
        .setRequired(true)
        .setMinValue(1),
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    await addBalance(targetUser.id, amount);
    await interaction.reply(
      `Added ${amount} 🥥 to ${targetUser.username}'s balance.`,
    );
  },
};
