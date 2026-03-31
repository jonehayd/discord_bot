import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadSubcommands } from "../../utils/load-subcommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const name = "fun";
const { subcommands, addToBuilder } = await loadSubcommands(__dirname);

let builder = new SlashCommandBuilder()
  .setName(name)
  .setDescription("Fun commands");

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
    } catch (error) {
      console.error(`Error executing /fun ${sub}:`, error);

      const msg = {
        content: "There was an error executing that command. Please try again.",
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
