import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { pause, getCurrentSong, isPaused } from "../../core/music-player.js";

export default {
  name: "pause",
  data: new SlashCommandSubcommandBuilder()
    .setName("pause")
    .setDescription("Pause the currently playing song"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to pause.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!getCurrentSong(interaction.guildId)) {
      return interaction.reply({
        content: "❌ Nothing is currently playing.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (isPaused(interaction.guildId)) {
      return interaction.reply({
        content:
          "❌ Playback is already paused. Use `/music resume` to continue.",
        flags: MessageFlags.Ephemeral,
      });
    }

    pause(interaction.guildId);

    return interaction.reply("⏸️ Paused playback.");
  },
};
