import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

const CATEGORY_META = {
  economy: { emoji: "💰", label: "Economy" },
  fun: { emoji: "🎉", label: "Fun" },
  games: { emoji: "🎮", label: "Games" },
  music: { emoji: "🎵", label: "Music" },
  utility: { emoji: "🔧", label: "Utility" },
};

/**
 * Formats a command's usage string with required/optional option indicators.
 * @param {string} cmdName - Top-level command name (e.g. "economy")
 * @param {string} subName - Subcommand name (e.g. "balance")
 * @param {import("discord.js").ToAPIApplicationCommandOptions[]} options - Subcommand options
 */
function formatUsage(cmdName, subName, options = []) {
  const opts = options
    .map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
    .join(" ");
  return opts
    ? `\`/${cmdName} ${subName} ${opts}\``
    : `\`/${cmdName} ${subName}\``;
}

export default {
  name: "help",
  data: new SlashCommandSubcommandBuilder()
    .setName("help")
    .setDescription("List all available commands and how to use them")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Filter commands by a specific category")
        .setRequired(false)
        .addChoices(
          { name: "Economy", value: "economy" },
          { name: "Fun", value: "fun" },
          { name: "Games", value: "games" },
          { name: "Music", value: "music" },
          { name: "Utility", value: "utility" },
        ),
    ),

  async execute(interaction) {
    const filter = interaction.options.getString("category");
    const commands = interaction.client.commands;

    const totalCommands = [...commands.values()].reduce(
      (sum, cmd) => sum + (cmd.subcommands?.size ?? 1),
      0,
    );

    const embed = new EmbedBuilder()
      .setTitle("📖 Command Reference")
      .setDescription(
        filter
          ? `Showing commands for the **${CATEGORY_META[filter]?.label ?? filter}** category.`
          : "Here is a list of all available commands.\nUse `<required>` and `[optional]` to understand each option.",
      )
      .setColor(0x5865f2)
      .setFooter({ text: `${totalCommands} commands available` })
      .setTimestamp();

    const entries = filter
      ? [[filter, commands.get(filter)]].filter(([, v]) => v)
      : [...commands.entries()];

    for (const [name, cmd] of entries) {
      const meta = CATEGORY_META[name] ?? { emoji: "📌", label: name };
      const subs = cmd.subcommands;

      // Command with no subcommands — treat as a standalone command
      if (!subs || subs.size === 0) {
        const usage = formatUsage(name, "", cmd.data.options ?? []);
        embed.addFields({
          name: `${meta.emoji} ${meta.label}`,
          value: `${usage}\n↳ *${cmd.data.description}*`,
          inline: false,
        });
        continue;
      }

      const lines = [...subs.values()].map(
        (sub) =>
          `${formatUsage(name, sub.data.name, sub.data.options)}\n↳ *${sub.data.description}*`,
      );

      embed.addFields({
        name: `${meta.emoji} ${meta.label}`,
        value: lines.join("\n"),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
