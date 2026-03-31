import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";
import { removeFromQueue, getQueue } from "../../core/music-player.js";

export default {
  name: "remove",
  data: new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a song from the queue by its position")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription(
          "Position in the queue (use /music queue to see positions)",
        )
        .setMinValue(1)
        .setRequired(true),
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to manage the queue.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const position = interaction.options.getInteger("position");
    const queue = getQueue(interaction.guildId);

    if (queue.length === 0) {
      return interaction.reply({
        content: "❌ The queue is empty.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (position > queue.length) {
      return interaction.reply({
        content: `❌ Position must be between 1 and ${queue.length}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const removed = removeFromQueue(interaction.guildId, position);

    return interaction.reply(
      `🗑️ Removed **${removed.title}** from position **#${position}**.`,
    );
  },
};
