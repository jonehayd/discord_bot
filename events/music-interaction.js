import {
  Events,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import playdl from "play-dl";
import {
  pause,
  resume,
  skip,
  stop,
  shuffle,
  setLoop,
  isLooping,
  setAutoplay,
  isAutoplaying,
  isPaused,
  addToQueue,
} from "../core/music-player.js";
import {
  buildControlPanel,
  getControlPanelMessage,
} from "../core/music-controller.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const isMusButton =
      interaction.isButton() && interaction.customId.startsWith("music_");
    const isMusicModal =
      interaction.isModalSubmit() &&
      interaction.customId === "music_play_modal";

    if (!isMusButton && !isMusicModal) return;

    const { guildId } = interaction;
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to use music controls.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // --- Modal submit: resolve and queue the song ---
    if (isMusicModal) {
      await interaction.deferReply({ ephemeral: true });
      const query = interaction.fields.getTextInputValue("music_play_query");

      try {
        let videoInfo;
        const isUrl =
          playdl.yt_validate(query) === "video" ||
          /^https?:\/\/(www\.)?(youtu\.be\/|youtube\.com\/)/.test(query);

        if (isUrl) {
          const info = await playdl.video_basic_info(query);
          videoInfo = info.video_details;
        } else {
          const results = await playdl.search(query, {
            limit: 1,
            source: { youtube: "video" },
          });
          if (results.length === 0) {
            return interaction.editReply("❌ No results found for that query.");
          }
          videoInfo = results[0];
        }

        const song = {
          title: videoInfo.title ?? "Unknown Title",
          url: isUrl ? query : videoInfo.url,
          duration: videoInfo.durationRaw ?? "?:??",
          thumbnail: videoInfo.thumbnails?.[0]?.url ?? null,
          requestedBy: interaction.user.username,
        };

        const { status, position } = await addToQueue(
          guildId,
          song,
          voiceChannel,
          interaction.channel,
        );

        const msg =
          status === "playing"
            ? `🎵 Now playing: **${song.title}** \`${song.duration}\``
            : `✅ Added to queue at position **#${position}**: **${song.title}** \`${song.duration}\``;

        await interaction.editReply(msg);
      } catch (error) {
        console.error("[ctrl] Play error:", error);
        await interaction.editReply(
          "❌ Failed to find or play that song. Please try again.",
        );
      }

      // Refresh the control panel message if it still exists
      const panelMessage = getControlPanelMessage(guildId);
      if (panelMessage) {
        await panelMessage.edit(buildControlPanel(guildId)).catch((err) => {
          console.error("[ctrl] Failed to refresh control panel:", err);
        });
      }
      return;
    }

    // --- Play button: open the modal ---
    const action = interaction.customId.slice("music_".length);

    if (action === "play") {
      const modal = new ModalBuilder()
        .setCustomId("music_play_modal")
        .setTitle("Play a Song");
      const input = new TextInputBuilder()
        .setCustomId("music_play_query")
        .setLabel("Song name or YouTube URL")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Enter a song name or YouTube URL...")
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // --- Other control buttons ---
    await interaction.deferUpdate();

    switch (action) {
      case "pauseresume":
        isPaused(guildId) ? resume(guildId) : pause(guildId);
        break;
      case "skip":
        skip(guildId);
        break;
      case "stop":
        stop(guildId);
        break;
      case "loop":
        setLoop(guildId, !isLooping(guildId));
        break;
      case "shuffle":
        shuffle(guildId);
        break;
      case "autoplay":
        setAutoplay(guildId, !isAutoplaying(guildId));
        break;
    }

    const panel = buildControlPanel(guildId);
    await interaction.editReply(panel);
  },
};
