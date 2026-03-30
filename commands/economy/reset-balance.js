import { resetBalance } from "../../database/currency.js";
import { SlashCommandSubcommandBuilder } from "discord.js";

export default {
  name: "reset-balance",
  data: new SlashCommandSubcommandBuilder()
    .setName("resetbalance")
    .setDescription("Reset a user's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user who's balance will be reset")
        .setRequired(true),
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");

    await resetBalance(targetUser.id);
    await interaction.reply(`Reset ${targetUser.username}'s balance to 0 🥥.`);
  },
};
