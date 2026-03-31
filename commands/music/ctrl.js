import { SlashCommandSubcommandBuilder } from "discord.js";
import { buildControlPanel } from "../../core/music-controller.js";

export default {
  name: "ctrl",
  data: new SlashCommandSubcommandBuilder()
    .setName("ctrl")
    .setDescription("Open the music control panel"),

  async execute(interaction) {
    const panel = buildControlPanel(interaction.guildId);
    return interaction.reply(panel);
  },
};
