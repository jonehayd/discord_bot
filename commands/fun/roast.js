import {
  SlashCommandSubcommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RECENT_MESSAGE_FETCH_LIMIT = 100;
const RECENT_MESSAGE_SAMPLE = 15;

export default {
  name: "roast",
  cooldown: 30,
  data: new SlashCommandSubcommandBuilder()
    .setName("roast")
    .setDescription(
      "Have the AI roast a user based on their profile and recent messages",
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to roast")
        .setRequired(true),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");

    if (target.bot) {
      return interaction.reply({
        content: "❌ You can't roast a bot — they have no feelings to hurt.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ Self-roasting is a different command. (It doesn't exist.)",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    // Gather profile context
    let member = null;
    try {
      member = await interaction.guild.members.fetch(target.id);
    } catch {
      // Member may have left the server - proceed with basic user info
    }

    const accountAgeDays = Math.floor(
      (Date.now() - target.createdTimestamp) / (1000 * 60 * 60 * 24),
    );

    const roles = member
      ? member.roles.cache
          .filter((r) => r.id !== interaction.guild.id)
          .map((r) => r.name)
          .join(", ") || "none"
      : "unknown";

    const nickname = member?.nickname ?? null;
    const displayName = member?.displayName ?? target.username;
    const joinedDaysAgo = member?.joinedTimestamp
      ? Math.floor(
          (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24),
        )
      : null;

    // Gather recent messages from this channel
    let recentMessages = [];
    try {
      const fetched = await interaction.channel.messages.fetch({
        limit: RECENT_MESSAGE_FETCH_LIMIT,
      });
      recentMessages = fetched
        .filter((m) => m.author.id === target.id && m.content.trim().length > 0)
        .map((m) => m.content.trim())
        .slice(0, RECENT_MESSAGE_SAMPLE);
    } catch {
      // Missing permissions or DM channel — proceed without messages
    }

    // Build prompt
    const profileLines = [
      `Username: ${target.username}`,
      `Display name: ${displayName}`,
      nickname ? `Nickname: ${nickname}` : null,
      `Account age: ${accountAgeDays} days old`,
      joinedDaysAgo !== null
        ? `Joined this server: ${joinedDaysAgo} days ago`
        : null,
      `Server roles: ${roles}`,
    ]
      .filter(Boolean)
      .join("\n");

    const messagesSection =
      recentMessages.length > 0
        ? `\nHere are some of their recent messages in this channel:\n${recentMessages.map((m, i) => `${i + 1}. "${m}"`).join("\n")}`
        : "\nNo recent messages found for this user in this channel.";

    const prompt = `${profileLines}${messagesSection}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a witty comedian performing a roast at a comedy show. " +
            "Write a funny, savage roast of the user described below in 3-5 sentences. " +
            "Use their profile details and message history as ammunition. " +
            "Be creatively mean and as crude as you like. Swear words are fully allowed and recommended",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 1.0,
    });

    const roastText = response.choices[0].message.content.trim();

    const embed = new EmbedBuilder()
      .setTitle(`🔥 Roasting ${displayName}`)
      .setDescription(roastText)
      .setThumbnail(target.displayAvatarURL({ size: 128 }))
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setColor(0xff4500)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
