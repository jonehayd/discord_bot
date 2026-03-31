import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { setLoop, isLooping, getCurrentSong } from "../../core/music-player.js";

export default {
  name: "loop",
  data: new SlashCommandSubcommandBuilder()
    .setName("loop")
    .setDescription("Toggle looping the current song"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to toggle loop.",
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

    const nowLooping = !isLooping(interaction.guildId);
    setLoop(interaction.guildId, nowLooping);

    return interaction.reply(
      nowLooping ? `🔁 Now looping **${current.title}**.` : `➡️ Loop disabled.`,
    );
  },
};
