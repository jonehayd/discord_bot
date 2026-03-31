import {
  SlashCommandSubcommandBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import {
  getBalance,
  addBalance,
  removeBalance,
} from "../../database/currency.js";
import {
  pendingRobs,
  ROB_AMOUNT,
  ROB_WINDOW_MS,
} from "../../core/rob-state.js";

export default {
  name: "rob",
  cooldown: 600,
  data: new SlashCommandSubcommandBuilder()
    .setName("rob")
    .setDescription("Attempt to steal 🥥 100 coconuts from another user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user you want to rob")
        .setRequired(true),
    ),

  async execute(interaction) {
    const robber = interaction.user;
    const victim = interaction.options.getUser("target");

    if (victim.id === robber.id) {
      return interaction.reply({
        content: "❌ You can't rob yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (victim.bot) {
      return interaction.reply({
        content: "❌ You can't rob a bot.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const robKey = `${robber.id}-${victim.id}`;
    if (pendingRobs.has(robKey)) {
      return interaction.reply({
        content: `❌ You already have an active robbery against ${victim}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const victimBalance = getBalance(victim.id);
    if (victimBalance < ROB_AMOUNT) {
      return interaction.reply({
        content: `❌ ${victim.username} doesn't have enough coconuts to rob (they only have 🥥 ${victimBalance}).`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const expiresAt = Math.floor((Date.now() + ROB_WINDOW_MS) / 1000);

    const embed = new EmbedBuilder()
      .setTitle("🚨 Robbery in Progress!")
      .setDescription(
        `**${robber.username}** is attempting to rob ${victim}!\n\n` +
          `${victim}, you have until <t:${expiresAt}:T> to catch the robber.\n` +
          `If you don't act in time, you'll lose **🥥 ${ROB_AMOUNT} coconuts**.`,
      )
      .setColor(0xe74c3c);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rob_catch_${robKey}`)
        .setLabel("🚔 Catch the Robber!")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    const timeout = setTimeout(async () => {
      if (!pendingRobs.has(robKey)) return;
      pendingRobs.delete(robKey);

      removeBalance(victim.id, ROB_AMOUNT);
      addBalance(robber.id, ROB_AMOUNT);

      const successEmbed = new EmbedBuilder()
        .setTitle("💰 Robbery Successful!")
        .setDescription(
          `**${robber.username}** successfully stole **🥥 ${ROB_AMOUNT} coconuts** from ${victim}!`,
        )
        .setColor(0x2ecc71);

      await interaction.editReply({ embeds: [successEmbed], components: [] });
    }, ROB_WINDOW_MS);

    pendingRobs.set(robKey, {
      robberId: robber.id,
      victimId: victim.id,
      robberName: robber.username,
      victimName: victim.username,
      timeout,
    });
  },
};
