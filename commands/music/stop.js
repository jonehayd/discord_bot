import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { stop, getCurrentSong, getQueue } from "../../core/music-player.js";

export default {
  name: "stop",
  data: new SlashCommandSubcommandBuilder()
    .setName("stop")
    .setDescription("Stop playback, clear the queue, and disconnect the bot"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to stop music.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const current = getCurrentSong(interaction.guildId);
    const queueLength = getQueue(interaction.guildId).length;

    if (!current && queueLength === 0) {
      return interaction.reply({
        content: "❌ Nothing is playing.",
        flags: MessageFlags.Ephemeral,
      });
    }

    stop(interaction.guildId);

    return interaction.reply("⏹️ Stopped playback and cleared the queue.");
  },
};
