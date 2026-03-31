import { SlashCommandSubcommandBuilder } from "discord.js";
import {
  buildControlPanel,
  setControlPanelMessage,
} from "../../core/music-controller.js";

export default {
  name: "ctrl",
  data: new SlashCommandSubcommandBuilder()
    .setName("ctrl")
    .setDescription("Open the music control panel"),

  async execute(interaction) {
    const panel = buildControlPanel(interaction.guildId);
    const message = await interaction.reply({ ...panel, fetchReply: true });
    setControlPanelMessage(interaction.guildId, message);
  },
};
