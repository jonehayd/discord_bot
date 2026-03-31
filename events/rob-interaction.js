import { Events, MessageFlags, EmbedBuilder } from "discord.js";
import { addBalance, removeBalance } from "../database/currency.js";
import { pendingRobs, ROB_FINE } from "../core/rob-state.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (
      !interaction.isButton() ||
      !interaction.customId.startsWith("rob_catch_")
    )
      return;

    // customId format: rob_catch_{robberId}-{victimId}
    const robKey = interaction.customId.slice("rob_catch_".length);
    const rob = pendingRobs.get(robKey);

    if (!rob) {
      return interaction.reply({
        content: "⌛ This robbery has already been resolved.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Only the victim can click the button
    if (interaction.user.id !== rob.victimId) {
      return interaction.reply({
        content: "❌ Only the robbery target can catch the robber.",
        flags: MessageFlags.Ephemeral,
      });
    }

    clearTimeout(rob.timeout);
    pendingRobs.delete(robKey);

    removeBalance(rob.robberId, ROB_FINE);
    addBalance(rob.victimId, ROB_FINE);

    const embed = new EmbedBuilder()
      .setTitle("🚔 Robber Caught!")
      .setDescription(
        `${interaction.user} caught **${rob.robberName}** in the act!\n\n` +
          `**${rob.robberName}** has been fined **🥥 ${ROB_FINE} coconuts** by the police.`,
      )
      .setColor(0x3498db);

    await interaction.update({ embeds: [embed], components: [] });
  },
};
