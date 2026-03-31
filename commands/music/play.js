import {
  SlashCommandSubcommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import playdl from "play-dl";
import { addToQueue } from "../../core/music-player.js";

export default {
  name: "play",
  data: new SlashCommandSubcommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name or YouTube URL")
        .setRequired(true),
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to play music.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (
      !permissions.has(PermissionFlagsBits.Connect) ||
      !permissions.has(PermissionFlagsBits.Speak)
    ) {
      return interaction.reply({
        content:
          "❌ I need permission to join and speak in your voice channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    const query = interaction.options.getString("query");

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
        // When a URL is provided directly, always use the original query so
        // yt-dlp receives the exact URL the user typed (handles short links,
        // tracking params, etc.) instead of play-dl's re-serialized version.
        url: isUrl ? query : videoInfo.url,
        duration: videoInfo.durationRaw ?? "?:??",
        thumbnail: videoInfo.thumbnails?.[0]?.url ?? null,
        requestedBy: interaction.user.username,
      };

      const { status, position } = await addToQueue(
        interaction.guildId,
        song,
        voiceChannel,
        interaction.channel,
      );

      if (status === "playing") {
        await interaction.editReply(
          `🎵 Now playing: **${song.title}** \`${song.duration}\``,
        );
      } else {
        await interaction.editReply(
          `✅ Added to queue at position **#${position}**: **${song.title}** \`${song.duration}\``,
        );
      }
    } catch (error) {
      console.error("[play] Error:", error);
      const msg = "❌ Failed to find or play that song. Please try again.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply({
          content: msg,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
