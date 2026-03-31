import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { setAutoplay, isAutoplaying } from "../../core/music-player.js";

export default {
  name: "autoplay",
  data: new SlashCommandSubcommandBuilder()
    .setName("autoplay")
    .setDescription(
      "Toggle autoplay — keeps the queue going with YouTube recommendations",
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to toggle autoplay.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const nowOn = !isAutoplaying(interaction.guildId);
    setAutoplay(interaction.guildId, nowOn);

    return interaction.reply(
      nowOn
        ? "🔄 Autoplay **enabled** — I'll keep recommendations going when the queue runs out."
        : "➡️ Autoplay **disabled**.",
    );
  },
};
