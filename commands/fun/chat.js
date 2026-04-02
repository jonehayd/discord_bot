import { SlashCommandSubcommandBuilder, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default {
  name: "chat",
  cooldown: 10,
  data: new SlashCommandSubcommandBuilder()
    .setName("chat")
    .setDescription("Send a message to the AI and get a response")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("What do you want to say?")
        .setRequired(true)
        .setMaxLength(1000),
    ),

  async execute(interaction) {
    const message = interaction.options.getString("message");

    await interaction.deferReply();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a fun, witty assistant living inside a Discord bot. " +
            "Keep responses concise and conversational — under 300 words. " +
            "Match the energy of the message: casual if they're casual, serious if they're serious.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 400,
      temperature: 0.9,
    });

    const reply = response.choices[0].message.content.trim();

    const embed = new EmbedBuilder()
      .setDescription(reply)
      .setFooter({
        text: `${interaction.user.username}: ${message.length > 80 ? message.slice(0, 80) + "…" : message}`,
        iconURL: interaction.user.displayAvatarURL({ size: 32 }),
      })
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
