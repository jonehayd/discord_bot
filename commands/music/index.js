import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadSubcommands } from "../../utils/load-subcommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const name = "music";

// Load subcommands from this folder
const { subcommands, addToBuilder } = await loadSubcommands(__dirname);

// Create slash command builder
let builder = new SlashCommandBuilder()
  .setName(name)
  .setDescription("Play and manage music");

// Add subcommands to builder
builder = addToBuilder(builder);

export default {
  name,
  data: builder,
  cooldown: 5,
  subcommands,
  loadSubcommands: true,

  async execute(interaction) {
    const subcommandName = interaction.options.getSubcommand();
    const subcommand = this.subcommands.get(subcommandName);

    if (!subcommand) {
      return interaction.reply({
        content: "Unknown subcommand.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await subcommand.execute(interaction);
    } catch (error) {
      console.error(`Error executing /economy ${subcommandName}:`, error);

      const errorMessage = {
        content: `There was an error executing that music command. Please try again later.`,
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};
