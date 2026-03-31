import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { skip, getCurrentSong } from "../../core/music-player.js";

export default {
  name: "skip",
  data: new SlashCommandSubcommandBuilder()
    .setName("skip")
    .setDescription("Skip the currently playing song"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to skip.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const current = getCurrentSong(interaction.guildId);
    if (!current) {
      return interaction.reply({
        content: "❌ Nothing is currently playing.",
        flags: MessageFlags.Ephemeral,
      });
    }

    skip(interaction.guildId);

    return interaction.reply(`⏭️ Skipped **${current.title}**`);
  },
};
