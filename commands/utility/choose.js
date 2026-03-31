import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";

export default {
  name: "choose",
  data: new SlashCommandSubcommandBuilder()
    .setName("choose")
    .setDescription("Randomly picks one option from a comma-separated list")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription(
          'Options to choose from, separated by commas (e.g. "pizza, tacos, sushi")',
        )
        .setRequired(true),
    ),
  async execute(interaction) {
    const raw = interaction.options.getString("options");
    const choices = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (choices.length < 2) {
      return interaction.reply({
        content: "❌ Please provide at least 2 options separated by commas.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const pick = choices[Math.floor(Math.random() * choices.length)];

    return interaction.reply(
      `🎲 Out of ${choices.length} options, I choose: **${pick}**`,
    );
  },
};
