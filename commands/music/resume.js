import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { resume, getCurrentSong, isPaused } from "../../core/music-player.js";

export default {
  name: "resume",
  data: new SlashCommandSubcommandBuilder()
    .setName("resume")
    .setDescription("Resume paused playback"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to resume.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!getCurrentSong(interaction.guildId)) {
      return interaction.reply({
        content: "❌ Nothing is currently playing.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!isPaused(interaction.guildId)) {
      return interaction.reply({
        content: "❌ Playback is not paused.",
        flags: MessageFlags.Ephemeral,
      });
    }

    resume(interaction.guildId);

    return interaction.reply("▶️ Resumed playback.");
  },
};
