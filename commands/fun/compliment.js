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
  name: "compliment",
  cooldown: 30,
  data: new SlashCommandSubcommandBuilder()
    .setName("compliment")
    .setDescription(
      "Have the AI shower a user with heartfelt compliments based on their profile and recent messages",
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to compliment")
        .setRequired(true),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");

    if (target.bot) {
      return interaction.reply({
        content: "❌ Bots don't need compliments — they already think they're perfect.",
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
            "You are an enthusiastic hype person who genuinely loves everyone. " +
            "Write a warm, over-the-top compliment about the user described below in 3-5 sentences. " +
            "Draw on their profile details and message history to make it feel personal and specific. " +
            "Be sincere and uplifting, but feel free to be playfully dramatic about how great they are.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 1.0,
    });

    const complimentText = response.choices[0].message.content.trim();

    const embed = new EmbedBuilder()
      .setTitle(`💐 Complimenting ${displayName}`)
      .setDescription(complimentText)
      .setThumbnail(target.displayAvatarURL({ size: 128 }))
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setColor(0xffd700)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
