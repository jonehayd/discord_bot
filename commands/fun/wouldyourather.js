import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default {
  name: "wouldyourather",
  cooldown: 15,
  data: new SlashCommandSubcommandBuilder()
    .setName("wouldyourather")
    .setDescription(
      "AI generates a would you rather question for the server to vote on",
    )
    .addStringOption((option) =>
      option
        .setName("theme")
        .setDescription(
          "Optional theme or topic for the question (e.g. food, superpowers, embarrassing)",
        )
        .setMaxLength(100),
    ),

  async execute(interaction) {
    const theme = interaction.options.getString("theme");

    await interaction.deferReply();

    const themeInstruction = theme
      ? `The question should be themed around: ${theme}.`
      : "Pick any funny, interesting, or thought-provoking theme.";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate 'Would You Rather' questions for a Discord server. " +
            "Respond with ONLY a JSON object in this exact format, no extra text:\n" +
            '{"optionA": "...", "optionB": "..."}\n' +
            "Each option should be a short phrase (under 15 words). " +
            "Make the choice genuinely difficult, funny, or absurd. The options can be very crude or innapropriate if the user's theme is around it " +
            "Do not include 'Would you rather' in the options themselves.",
        },
        {
          role: "user",
          content: themeInstruction,
        },
      ],
      max_tokens: 120,
      temperature: 1.1,
    });

    let optionA, optionB;
    try {
      const parsed = JSON.parse(response.choices[0].message.content.trim());
      optionA = parsed.optionA;
      optionB = parsed.optionB;
      if (!optionA || !optionB) throw new Error("Missing options");
    } catch {
      await interaction.editReply(
        "❌ Failed to generate a question. Try again!",
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🤔 Would You Rather...")
      .addFields(
        { name: "🅰️  Option A", value: optionA, inline: true },
        { name: "🅱️  Option B", value: optionB, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        { name: "Results", value: "🅰️ **0** votes  ·  🅱️ **0** votes" },
      )
      .setFooter({ text: `Asked by ${interaction.user.username}` })
      .setColor(0x9b59b6)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("wyr_a")
        .setLabel("🅰️  Option A")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("wyr_b")
        .setLabel("🅱️  Option B")
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const message = await interaction.fetchReply();
    const votes = new Map(); // userId -> "a" | "b"

    const collector = message.createMessageComponentCollector({
      time: 5 * 60 * 1000, // 5 minutes
    });

    collector.on("collect", async (btn) => {
      await btn.deferUpdate();
      const choice = btn.customId === "wyr_a" ? "a" : "b";
      votes.set(btn.user.id, choice);

      const countA = [...votes.values()].filter((v) => v === "a").length;
      const countB = [...votes.values()].filter((v) => v === "b").length;

      const updatedEmbed = EmbedBuilder.from(embed).setFields(
        { name: "🅰️  Option A", value: optionA, inline: true },
        { name: "🅱️  Option B", value: optionB, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        {
          name: "Results",
          value: `🅰️ **${countA}** vote${countA !== 1 ? "s" : ""}  ·  🅱️ **${countB}** vote${countB !== 1 ? "s" : ""}`,
        },
      );

      await interaction.editReply({
        embeds: [updatedEmbed],
        components: [row],
      });
    });

    collector.on("end", async () => {
      const countA = [...votes.values()].filter((v) => v === "a").length;
      const countB = [...votes.values()].filter((v) => v === "b").length;
      const winner =
        countA > countB
          ? `🅰️ Option A wins!`
          : countB > countA
            ? `🅱️ Option B wins!`
            : "It's a tie!";

      const finalEmbed = EmbedBuilder.from(embed).setFields(
        { name: "🅰️  Option A", value: optionA, inline: true },
        { name: "🅱️  Option B", value: optionB, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        {
          name: `Final Results — ${winner}`,
          value: `🅰️ **${countA}** vote${countA !== 1 ? "s" : ""}  ·  🅱️ **${countB}** vote${countB !== 1 ? "s" : ""}`,
        },
      );

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("wyr_a")
          .setLabel("🅰️  Option A")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("wyr_b")
          .setLabel("🅱️  Option B")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
      );

      await interaction.editReply({
        embeds: [finalEmbed],
        components: [disabledRow],
      });
    });
  },
};
