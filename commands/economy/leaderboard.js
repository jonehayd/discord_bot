import { getLeaderboard } from "../../database/currency.js";
import { SlashCommandSubcommandBuilder } from "discord.js";

export default {
  name: "leaderboard",
  data: new SlashCommandSubcommandBuilder()
    .setName("leaderboard")
    .setDescription("Displays the top 5 user's with the most 🥥"),
  async execute(interaction) {
    const users = getLeaderboard();

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const member = await interaction.guild.members.fetch(user.id);
          return { username: member.user.username, balance: user.balance };
        } catch {
          return null; // User left the server
        }
      }),
    );

    const visible = results.filter(Boolean);

    if (visible.length === 0) {
      return interaction.reply("No leaderboard data to display.");
    }

    const output = visible
      .map((entry, i) => `${i + 1}. ${entry.username} - $${entry.balance}`)
      .join("\n");

    await interaction.reply(`Leaderboard:\n${output}`);
  },
};
