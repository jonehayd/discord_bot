import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadSubcommands } from "../../utils/load-subcommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const name = "utility";
const { subcommands, addToBuilder } = await loadSubcommands(__dirname);

// Create slash command builder
let builder = new SlashCommandBuilder()
  .setName(name)
  .setDescription("Debugging and utility tools");

// Add subcommands to builder
builder = addToBuilder(builder);

export default {
  name,
  data: builder,
  cooldown: 5,
  subcommands,
  loadSubcommands: true,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cmd = this.subcommands.get(sub);

    if (!cmd) {
      return interaction.reply({
        content: "Unknown subcommand.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`Error executing /utility ${sub}:`, err);

      const msg = {
        content: `There was an error executing that utility command.`,
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
};
