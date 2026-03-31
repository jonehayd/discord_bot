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

    const nowLooping = !isLooping(interaction.guildId);
    setLoop(interaction.guildId, nowLooping);

    const current = getCurrentSong(interaction.guildId);
    const songLabel = current ? ` **${current.title}**` : "";

    return interaction.reply(
      nowLooping ? `🔁 Loop enabled${songLabel}.` : `➡️ Loop disabled.`,
    );
  },
};
