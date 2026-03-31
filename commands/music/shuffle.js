import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { shuffle, getQueue } from "../../core/music-player.js";

export default {
  name: "shuffle",
  data: new SlashCommandSubcommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the songs in the queue"),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to shuffle the queue.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const queue = getQueue(interaction.guildId);
    if (queue.length < 2) {
      return interaction.reply({
        content: "❌ Not enough songs in the queue to shuffle.",
        flags: MessageFlags.Ephemeral,
      });
    }

    shuffle(interaction.guildId);

    return interaction.reply(
      `🔀 Shuffled **${queue.length}** songs in the queue.`,
    );
  },
};
