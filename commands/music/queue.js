import {
  SlashCommandSubcommandBuilder,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { getQueue, getCurrentSong } from "../../core/music-player.js";

export default {
  name: "queue",
  data: new SlashCommandSubcommandBuilder()
    .setName("queue")
    .setDescription("Show the current music queue"),

  async execute(interaction) {
    const current = getCurrentSong(interaction.guildId);
    const queue = getQueue(interaction.guildId);

    if (!current && queue.length === 0) {
      return interaction.reply({
        content: "❌ The queue is empty.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const lines = [];
    if (current) {
      lines.push(
        `**Now Playing:**\n🎵 **${current.title}** \`${current.duration}\` — ${current.requestedBy}`,
      );
    }
    if (queue.length > 0) {
      lines.push("\n**Up Next:**");
      const displayed = queue.slice(0, 10);
      displayed.forEach((song, i) => {
        lines.push(
          `\`${i + 1}.\` **${song.title}** \`${song.duration}\` — ${song.requestedBy}`,
        );
      });
      if (queue.length > 10) {
        lines.push(`\n*...and ${queue.length - 10} more*`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🎶 Music Queue")
      .setDescription(lines.join("\n"))
      .setColor(0x5865f2)
      .setFooter({
        text: `${queue.length} song${queue.length !== 1 ? "s" : ""} in queue`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
