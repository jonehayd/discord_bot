import { SlashCommandSubcommandBuilder, MessageFlags } from "discord.js";

const MAX_REMINDER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default {
  name: "remind",
  data: new SlashCommandSubcommandBuilder()
    .setName("remind")
    .setDescription("Set a reminder that pings you after a specified time")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("What to remind you about")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("Hours to wait (0–168)")
        .setMinValue(0)
        .setMaxValue(168),
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Minutes to wait (0–59)")
        .setMinValue(0)
        .setMaxValue(59),
    )
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Seconds to wait (0–59)")
        .setMinValue(0)
        .setMaxValue(59),
    )
    .addStringOption((option) =>
      option
        .setName("visibility")
        .setDescription("Where to confirm the reminder (default: public)")
        .addChoices(
          { name: "Public (visible to everyone)", value: "public" },
          { name: "Ephemeral (only you can see it)", value: "ephemeral" },
          { name: "DM (send confirmation to your DMs)", value: "dm" },
        ),
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const hours = interaction.options.getInteger("hours") ?? 0;
    const minutes = interaction.options.getInteger("minutes") ?? 0;
    const seconds = interaction.options.getInteger("seconds") ?? 0;
    const visibility = interaction.options.getString("visibility") ?? "public";

    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

    if (totalMs <= 0) {
      return interaction.reply({
        content: "❌ Please specify a time greater than 0.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (totalMs > MAX_REMINDER_MS) {
      return interaction.reply({
        content: "❌ Reminders can be set for a maximum of 7 days.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const fireAt = Math.floor((Date.now() + totalMs) / 1000);
    const confirmContent = `⏰ ${interaction.user} set a reminder for <t:${fireAt}:R>: **${message}**`;

    if (visibility === "dm") {
      try {
        await interaction.user.send(
          `✅ I'll remind you <t:${fireAt}:R> about: **${message}**`,
        );
        await interaction.reply({
          content: "✅ Reminder set! I'll DM you when it's time.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        await interaction.reply({
          content:
            "❌ I couldn't send you a DM. Please enable DMs from server members.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    } else if (visibility === "ephemeral") {
      await interaction.reply({
        content: `✅ I'll remind you <t:${fireAt}:R> about: **${message}**`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({ content: confirmContent });
    }

    setTimeout(async () => {
      if (visibility === "dm") {
        await interaction.user
          .send(`⏰ Reminder: **${message}**`)
          .catch((err) => console.error("[remind] Could not DM user:", err));
      } else {
        await interaction.channel
          ?.send(`⏰ ${interaction.user}, reminder: **${message}**`)
          .catch((err) =>
            console.error("[remind] Could not send to channel:", err),
          );
      }
    }, totalMs);
  },
};
