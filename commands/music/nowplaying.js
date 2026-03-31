import {
  SlashCommandSubcommandBuilder,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { getCurrentSong, isPaused } from "../../core/music-player.js";

export default {
  name: "nowplaying",
  data: new SlashCommandSubcommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the currently playing song"),

  async execute(interaction) {
    const song = getCurrentSong(interaction.guildId);

    if (!song) {
      return interaction.reply({
        content: "❌ Nothing is currently playing.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const paused = isPaused(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(`${paused ? "⏸️ Paused" : "🎵 Now Playing"}`)
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: "Duration", value: song.duration, inline: true },
        { name: "Requested by", value: song.requestedBy, inline: true },
      )
      .setColor(paused ? 0xfaa61a : 0x57f287);

    if (song.thumbnail) {
      embed.setThumbnail(song.thumbnail);
    }

    return interaction.reply({ embeds: [embed] });
  },
};
