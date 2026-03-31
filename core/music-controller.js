import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  getCurrentSong,
  getQueue,
  isPaused,
  isLooping,
  isAutoplaying,
} from "./music-player.js";

/** Stores the control panel Message per guild so it can be refreshed after modal submits. */
const controlPanelMessages = new Map();

function setControlPanelMessage(guildId, message) {
  controlPanelMessages.set(guildId, message);
}

function getControlPanelMessage(guildId) {
  return controlPanelMessages.get(guildId);
}

/**
 * Builds the music control panel embed and button rows for a guild.
 * @param {string} guildId
 * @returns {{ embeds: EmbedBuilder[], components: ActionRowBuilder[] }}
 */
function buildControlPanel(guildId) {
  const current = getCurrentSong(guildId);
  const queue = getQueue(guildId);
  const paused = isPaused(guildId);
  const looping = isLooping(guildId);
  const autoplaying = isAutoplaying(guildId);

  const nothingPlaying = !current;

  const embed = new EmbedBuilder()
    .setTitle("🎛️ Music Controls")
    .setColor(paused ? 0xfaa61a : 0x5865f2);

  if (current) {
    embed.setDescription(
      `**Now Playing${paused ? " (Paused)" : ""}:**\n**[${current.title}](${current.url})**`,
    );
    embed.addFields(
      { name: "Duration", value: current.duration, inline: true },
      { name: "Requested by", value: current.requestedBy, inline: true },
      {
        name: "Queue",
        value: `${queue.length} song${queue.length !== 1 ? "s" : ""} up next`,
        inline: true,
      },
    );
    if (current.thumbnail) embed.setThumbnail(current.thumbnail);

    if (queue.length > 0) {
      const upNext = queue
        .slice(0, 5)
        .map((s, i) => `\`${i + 1}.\` ${s.title} \`${s.duration}\``)
        .join("\n");
      embed.addFields({
        name: "Up Next",
        value:
          upNext +
          (queue.length > 5 ? `\n*...and ${queue.length - 5} more*` : ""),
      });
    }
  } else {
    embed.setDescription("Nothing is currently playing.");
  }

  const statusParts = [];
  if (looping) statusParts.push("🔁 Loop");
  if (autoplaying) statusParts.push("🔄 Autoplay");
  if (statusParts.length > 0) {
    embed.setFooter({ text: statusParts.join("  ·  ") });
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_play")
      .setLabel("Play")
      .setEmoji("🔍")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_pauseresume")
      .setLabel(paused ? "Resume" : "Pause")
      .setEmoji(paused ? "▶️" : "⏸️")
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(nothingPlaying),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setLabel("Skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(nothingPlaying),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setLabel("Stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(nothingPlaying),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_loop")
      .setLabel(looping ? "Loop: ON" : "Loop: OFF")
      .setEmoji("🔁")
      .setStyle(looping ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_shuffle")
      .setLabel("Shuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(queue.length < 2),
    new ButtonBuilder()
      .setCustomId("music_autoplay")
      .setLabel(autoplaying ? "Autoplay: ON" : "Autoplay: OFF")
      .setEmoji("🔄")
      .setStyle(autoplaying ? ButtonStyle.Success : ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

export { buildControlPanel, setControlPanelMessage, getControlPanelMessage };
