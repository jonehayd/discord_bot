import { Events, MessageFlags } from "discord.js";
import {
  pause,
  resume,
  skip,
  stop,
  shuffle,
  setLoop,
  isLooping,
  setAutoplay,
  isAutoplaying,
  isPaused,
} from "../core/music-player.js";
import { buildControlPanel } from "../core/music-controller.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith("music_")) {
      return;
    }

    const { guildId } = interaction;
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to use music controls.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate();

    const action = interaction.customId.slice("music_".length);

    switch (action) {
      case "pauseresume":
        isPaused(guildId) ? resume(guildId) : pause(guildId);
        break;
      case "skip":
        skip(guildId);
        break;
      case "stop":
        stop(guildId);
        break;
      case "loop":
        setLoop(guildId, !isLooping(guildId));
        break;
      case "shuffle":
        shuffle(guildId);
        break;
      case "autoplay":
        setAutoplay(guildId, !isAutoplaying(guildId));
        break;
    }

    const panel = buildControlPanel(guildId);
    await interaction.editReply(panel);
  },
};
