import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import axios from "axios";
import { addBalance } from "../../database/currency.js";

const REWARDS = { easy: 50, medium: 100, hard: 200 };
const ANSWER_TIMEOUT_MS = 30_000;

// opentdb category IDs
const CATEGORIES = [
  { name: "General Knowledge", value: "9" },
  { name: "Film", value: "11" },
  { name: "Music", value: "12" },
  { name: "Television", value: "14" },
  { name: "Video Games", value: "15" },
  { name: "Science & Nature", value: "17" },
  { name: "Computers", value: "18" },
  { name: "Sports", value: "21" },
  { name: "Geography", value: "22" },
  { name: "History", value: "23" },
];

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, "\u201c")
    .replace(/&rdquo;/g, "\u201d")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// choices: [{ label, answer, isCorrect }]
function buildAnswerRow(choices, disabled = false) {
  const buttons = choices.map(({ label, isCorrect }) =>
    new ButtonBuilder()
      .setCustomId(`trivia_${label}`)
      .setLabel(label)
      .setStyle(
        disabled
          ? isCorrect
            ? ButtonStyle.Success
            : ButtonStyle.Secondary
          : ButtonStyle.Primary,
      )
      .setDisabled(disabled),
  );
  return new ActionRowBuilder().addComponents(...buttons);
}

export default {
  name: "trivia",
  cooldown: 10,
  data: new SlashCommandSubcommandBuilder()
    .setName("trivia")
    .setDescription("Answer a trivia question to win 🥥 coconuts!")
    .addStringOption((option) =>
      option
        .setName("difficulty")
        .setDescription("Question difficulty (default: medium)")
        .addChoices(
          { name: "Easy (🥥 50)", value: "easy" },
          { name: "Medium (🥥 100)", value: "medium" },
          { name: "Hard (🥥 200)", value: "hard" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Trivia category (default: random)")
        .addChoices(...CATEGORIES),
    ),

  async execute(interaction) {
    const difficulty = interaction.options.getString("difficulty") ?? "medium";
    const categoryId = interaction.options.getString("category");
    const reward = REWARDS[difficulty];

    await interaction.deferReply();

    let questionData;
    try {
      const parts = [`amount=1`, `difficulty=${difficulty}`, `encode=url3986`];
      if (categoryId) parts.push(`category=${categoryId}`);

      const res = await axios.get(
        `https://opentdb.com/api.php?${parts.join("&")}`,
      );

      if (res.data.response_code !== 0 || !res.data.results.length) {
        return interaction.editReply(
          "❌ Couldn't load a question right now. Try again in a moment.",
        );
      }
      questionData = res.data.results[0];
    } catch {
      return interaction.editReply(
        "❌ Failed to reach the trivia API. Please try again.",
      );
    }

    const question = decodeHtml(decodeURIComponent(questionData.question));
    const correctAnswer = decodeHtml(
      decodeURIComponent(questionData.correct_answer),
    );
    const isBoolean = questionData.type === "boolean";

    // Build choices: [{ label, answer, isCorrect }]
    let choices;
    let choiceBlock;

    if (isBoolean) {
      choices = [
        { label: "True", answer: "True", isCorrect: correctAnswer === "True" },
        {
          label: "False",
          answer: "False",
          isCorrect: correctAnswer === "False",
        },
      ];
      choiceBlock = "Click **True** or **False** below.";
    } else {
      const shuffled = shuffle([
        correctAnswer,
        ...questionData.incorrect_answers.map((a) =>
          decodeHtml(decodeURIComponent(a)),
        ),
      ]);
      const labels = ["A", "B", "C", "D"];
      choices = shuffled.map((ans, i) => ({
        label: labels[i],
        answer: ans,
        isCorrect: ans === correctAnswer,
      }));
      choiceBlock = shuffled
        .map((ans, i) => `**${labels[i]}.** ${ans}`)
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setTitle(
        `🧠 Trivia — ${decodeHtml(decodeURIComponent(questionData.category))}`,
      )
      .setDescription(`**${question}**\n\n${choiceBlock}`)
      .addFields(
        {
          name: "Difficulty",
          value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
          inline: true,
        },
        { name: "Reward", value: `🥥 ${reward} coconuts`, inline: true },
      )
      .setFooter({ text: "First correct answer wins! Closes" })
      .setTimestamp(Date.now() + ANSWER_TIMEOUT_MS)
      .setColor(0xf1c40f);

    const answeredUsers = new Set();

    await interaction.editReply({
      embeds: [embed],
      components: [buildAnswerRow(choices)],
    });
    const triviaMsg = await interaction.fetchReply();

    const collector = triviaMsg.createMessageComponentCollector({
      time: ANSWER_TIMEOUT_MS,
    });

    collector.on("collect", async (btn) => {
      if (answeredUsers.has(btn.user.id)) {
        await btn.reply({
          content: "❌ You've already answered!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      answeredUsers.add(btn.user.id);

      const chosen = choices.find((c) => `trivia_${c.label}` === btn.customId);

      if (chosen.isCorrect) {
        collector.stop("correct");
        addBalance(btn.user.id, reward);

        const winEmbed = new EmbedBuilder()
          .setTitle("✅ Correct!")
          .setDescription(
            `**${btn.user.username}** got it right!\n\n` +
              `The answer was: **${correctAnswer}**\n\n` +
              `They've been awarded **🥥 ${reward} coconuts**!`,
          )
          .setColor(0x2ecc71);

        await btn.update({
          embeds: [winEmbed],
          components: [buildAnswerRow(choices, true)],
        });
      } else {
        await btn.reply({
          content: `❌ **${chosen.answer}** is not correct. Better luck next time!`,
          flags: MessageFlags.Ephemeral,
        });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "correct") return;
      const timeoutEmbed = new EmbedBuilder()
        .setTitle("⏰ Time's Up!")
        .setDescription(
          `Nobody got it!\n\nThe correct answer was: **${correctAnswer}**`,
        )
        .setColor(0xe74c3c);
      await interaction
        .editReply({
          embeds: [timeoutEmbed],
          components: [buildAnswerRow(choices, true)],
        })
        .catch(() => {
          // message may have been deleted or interaction expired
        });
    });
  },
};
