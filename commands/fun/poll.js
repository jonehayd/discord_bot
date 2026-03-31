import { SlashCommandSubcommandBuilder, EmbedBuilder } from "discord.js";

const MAX_DURATION_MIN = 60;

export default {
  name: "poll",
  data: new SlashCommandSubcommandBuilder()
    .setName("poll")
    .setDescription("Start a yes/no poll with reaction voting")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The poll question")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "How long the poll runs in minutes (default: 1, max: 60)",
        )
        .setMinValue(1)
        .setMaxValue(MAX_DURATION_MIN),
    ),

  async execute(interaction) {
    const question = interaction.options.getString("question");
    const duration = interaction.options.getInteger("duration") ?? 1;
    const durationMs = duration * 60 * 1000;
    const endsAt = Math.floor((Date.now() + durationMs) / 1000);

    const embed = new EmbedBuilder()
      .setTitle("📊 Poll")
      .setDescription(`**${question}**`)
      .addFields(
        { name: "✅ Yes", value: "React to vote", inline: true },
        { name: "❌ No", value: "React to vote", inline: true },
      )
      .setFooter({ text: `Poll ends` })
      .setTimestamp(Date.now() + durationMs)
      .setColor(0x5865f2);

    const { resource } = await interaction.reply({
      content: `Poll closes <t:${endsAt}:R>`,
      embeds: [embed],
      withResponse: true,
    });

    const message = resource.message;

    await message.react("✅");
    await message.react("❌");

    setTimeout(async () => {
      try {
        const fetched = await message.fetch();
        const yesReaction = fetched.reactions.cache.get("✅");
        const noReaction = fetched.reactions.cache.get("❌");

        // Subtract 1 to exclude the bot's own reaction
        const yesCount = (yesReaction?.count ?? 1) - 1;
        const noCount = (noReaction?.count ?? 1) - 1;
        const total = yesCount + noCount;

        let result;
        if (total === 0) {
          result = "No votes were cast.";
        } else if (yesCount > noCount) {
          result = `✅ **Yes** wins with **${yesCount}** vote${yesCount !== 1 ? "s" : ""}!`;
        } else if (noCount > yesCount) {
          result = `❌ **No** wins with **${noCount}** vote${noCount !== 1 ? "s" : ""}!`;
        } else {
          result = `🤝 It's a tie! (${yesCount} each)`;
        }

        const resultsEmbed = new EmbedBuilder()
          .setTitle("📊 Poll Ended")
          .setDescription(`**${question}**`)
          .addFields(
            {
              name: "✅ Yes",
              value: `${yesCount} vote${yesCount !== 1 ? "s" : ""}`,
              inline: true,
            },
            {
              name: "❌ No",
              value: `${noCount} vote${noCount !== 1 ? "s" : ""}`,
              inline: true,
            },
          )
          .addFields({ name: "Result", value: result })
          .setColor(0x2ecc71)
          .setTimestamp();

        await fetched.edit({ content: "Poll closed.", embeds: [resultsEmbed] });
        await fetched.reactions.removeAll().catch((err) => {
          console.error("[poll] Failed to remove reactions:", err);
        });
      } catch (err) {
        console.error("[poll] Failed to tally results:", err);
      }
    }, durationMs);
  },
};
