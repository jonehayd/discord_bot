import {
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
} from "@discordjs/voice";
import youtubedl from "youtube-dl-exec";
import playdl from "play-dl";

const IDLE_DISCONNECT_MS = 30_000;

/** @type {Map<string, GuildPlayerState>} */
const players = new Map();

/** Guilds that have autoplay enabled — persists across disconnect/reconnect */
const autoplayEnabled = new Set();

function createGuildPlayer(guildId) {
  const audioPlayer = createAudioPlayer();

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    const state = players.get(guildId);
    if (!state) return;

    if (state.queue.length > 0) {
      playNext(guildId);
    } else if (autoplayEnabled.has(guildId)) {
      handleAutoplay(guildId);
    } else {
      state.currentSong = null;
      state.disconnectTimer = setTimeout(() => {
        const s = players.get(guildId);
        if (s && !s.currentSong && s.queue.length === 0) {
          s.connection?.destroy();
          players.delete(guildId);
        }
      }, IDLE_DISCONNECT_MS);
    }
  });

  audioPlayer.on("error", (error) => {
    console.error(
      `[MusicPlayer] Audio error in guild ${guildId}:`,
      error.message,
    );
    const state = players.get(guildId);
    state?.textChannel?.send("❌ An error occurred while playing. Skipping...");
    state && (state.currentSong = null);
    playNext(guildId);
  });

  return {
    audioPlayer,
    queue: [],
    currentSong: null,
    connection: null,
    textChannel: null,
    disconnectTimer: null,
    loop: false,
    lastPlayedUrl: null,
    autoplayPrefetch: null,
    currentProcess: null,
  };
}

async function playNext(guildId) {
  const state = players.get(guildId);
  if (!state || state.queue.length === 0) return;

  // If looping, re-add the current song to the back of the queue before shifting
  if (state.loop && state.currentSong) {
    state.queue.push(state.currentSong);
  }

  const song = state.queue.shift();
  state.currentSong = song;
  state.lastPlayedUrl = song.url;

  // Pre-fetch the next related video in the background while this song plays
  if (autoplayEnabled.has(guildId) && !state.loop) {
    state.autoplayPrefetch = fetchRelated(song.url);
  }

  try {
    const ytProcess = youtubedl.exec(song.url, {
      output: "-",
      format: "bestaudio[ext=webm]/bestaudio/best",
      noCheckCertificates: true,
      noWarnings: true,
      quiet: true,
      preferFreeFormats: true,
    });
    // Suppress the broken-pipe rejection that occurs when the stream is
    // intentionally cut off by a skip or stop — not a real error.
    ytProcess.catch?.(() => {
      /* broken pipe on skip/stop — expected */
    });
    state.currentProcess = ytProcess;
    const resource = createAudioResource(ytProcess.stdout, {
      inputType: StreamType.Arbitrary,
    });
    state.audioPlayer.play(resource);
    state.textChannel?.send(
      `🎵 Now playing: **${song.title}** \`${song.duration}\` — requested by ${song.requestedBy}`,
    );
  } catch (error) {
    console.error(
      `[MusicPlayer] Failed to stream "${song.title}":`,
      error.message,
    );
    state.textChannel?.send(`❌ Failed to load **${song.title}**. Skipping...`);
    state.currentSong = null;
    playNext(guildId);
  }
}

/**
 * Adds a song to the guild queue, joining the voice channel if needed.
 * @returns {{ status: 'playing'|'queued', position: number }}
 */
async function addToQueue(guildId, song, voiceChannel, textChannel) {
  let state = players.get(guildId);
  if (!state) {
    state = createGuildPlayer(guildId);
    players.set(guildId, state);
  }

  if (state.disconnectTimer) {
    clearTimeout(state.disconnectTimer);
    state.disconnectTimer = null;
  }

  state.textChannel = textChannel;

  // Create or reuse voice connection
  if (
    !state.connection ||
    state.connection.state.status === VoiceConnectionStatus.Destroyed
  ) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Give it 5s to reconnect before destroying
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        connection.destroy();
        players.delete(guildId);
      }
    });

    connection.subscribe(state.audioPlayer);
    state.connection = connection;
  }

  const isIdle = state.audioPlayer.state.status === AudioPlayerStatus.Idle;
  const wasEmpty = state.queue.length === 0 && !state.currentSong;

  state.queue.push(song);

  if (isIdle && wasEmpty) {
    await playNext(guildId);
    return { status: "playing", position: 0 };
  }

  return { status: "queued", position: state.queue.length };
}

function skip(guildId) {
  const state = players.get(guildId);
  if (!state) return false;

  const hasAnything = state.currentSong || state.queue.length > 0;
  if (!hasAnything) return false;

  state.currentProcess?.kill?.();
  state.currentProcess = null;
  state.audioPlayer.stop(); // triggers Idle event → playNext
  return true;
}

function stop(guildId) {
  const state = players.get(guildId);
  if (!state) return false;

  if (state.disconnectTimer) clearTimeout(state.disconnectTimer);

  state.currentProcess?.kill?.();
  state.currentProcess = null;
  state.queue = [];
  state.currentSong = null;
  state.audioPlayer.stop();
  state.connection?.destroy();
  players.delete(guildId);
  return true;
}

function getQueue(guildId) {
  return players.get(guildId)?.queue ?? [];
}

function getCurrentSong(guildId) {
  return players.get(guildId)?.currentSong ?? null;
}

function pause(guildId) {
  const state = players.get(guildId);
  if (!state || state.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
    return false;
  }
  state.audioPlayer.pause();
  return true;
}

function resume(guildId) {
  const state = players.get(guildId);
  if (!state || state.audioPlayer.state.status !== AudioPlayerStatus.Paused) {
    return false;
  }
  state.audioPlayer.unpause();
  return true;
}

function shuffle(guildId) {
  const state = players.get(guildId);
  if (!state || state.queue.length < 2) return false;
  for (let i = state.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]];
  }
  return true;
}

function removeFromQueue(guildId, index) {
  const state = players.get(guildId);
  if (!state || index < 1 || index > state.queue.length) return null;
  const [removed] = state.queue.splice(index - 1, 1);
  return removed;
}

function setLoop(guildId, enabled) {
  const state = players.get(guildId);
  if (!state) return false;
  state.loop = enabled;
  return true;
}

function isLooping(guildId) {
  return players.get(guildId)?.loop ?? false;
}

function isPaused(guildId) {
  return (
    players.get(guildId)?.audioPlayer.state.status === AudioPlayerStatus.Paused
  );
}

async function fetchRelated(url) {
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      quiet: true,
      noWarnings: true,
    });

    // Try yt-dlp's related_videos list first (often empty on modern YouTube)
    const related = info.related_videos ?? [];
    const nextRelated = related.find(
      (v) => v.id && v.duration && !v.live_status,
    );
    if (nextRelated) {
      const minutes = Math.floor(nextRelated.duration / 60);
      const seconds = String(nextRelated.duration % 60).padStart(2, "0");
      return {
        title: nextRelated.title ?? "Unknown Title",
        url: `https://www.youtube.com/watch?v=${nextRelated.id}`,
        duration: `${minutes}:${seconds}`,
        thumbnail: nextRelated.thumbnails?.[0]?.url ?? null,
      };
    }

    // Fallback: search by the video's uploader/channel name
    const searchQuery = info.uploader ?? info.channel ?? info.title;
    if (!searchQuery) return null;

    const results = await playdl.search(searchQuery, {
      limit: 5,
      source: { youtube: "video" },
    });

    // Pick the first result that isn't the song we just played
    const next = results.find((v) => v.url !== url);
    if (!next) return null;

    return {
      title: next.title ?? "Unknown Title",
      url: next.url,
      duration: next.durationRaw ?? "?:??",
      thumbnail: next.thumbnails?.[0]?.url ?? null,
    };
  } catch (error) {
    console.error(
      "[MusicPlayer] Failed to fetch related video:",
      error.message,
    );
    return null;
  }
}

async function handleAutoplay(guildId) {
  const state = players.get(guildId);
  if (!state) return;

  state.currentSong = null;

  // Use the pre-fetched result if ready, otherwise fetch now (cold path)
  let nextSong = null;
  if (state.autoplayPrefetch) {
    nextSong = await state.autoplayPrefetch;
    state.autoplayPrefetch = null;
  }

  if (!nextSong && state.lastPlayedUrl) {
    nextSong = await fetchRelated(state.lastPlayedUrl);
  }

  // If we still couldn't get a recommendation, fall back to disconnect
  if (!nextSong) {
    state.disconnectTimer = setTimeout(() => {
      const s = players.get(guildId);
      if (s && !s.currentSong && s.queue.length === 0) {
        s.connection?.destroy();
        players.delete(guildId);
      }
    }, IDLE_DISCONNECT_MS);
    return;
  }

  nextSong.requestedBy = "Autoplay";
  state.queue.push(nextSong);
  playNext(guildId);
}

function setAutoplay(guildId, enabled) {
  if (enabled) {
    autoplayEnabled.add(guildId);
  } else {
    autoplayEnabled.delete(guildId);
    const state = players.get(guildId);
    if (state) state.autoplayPrefetch = null;
  }
  return true;
}

function isAutoplaying(guildId) {
  return autoplayEnabled.has(guildId);
}

export {
  addToQueue,
  skip,
  stop,
  getQueue,
  getCurrentSong,
  pause,
  resume,
  shuffle,
  removeFromQueue,
  setLoop,
  isLooping,
  isPaused,
  setAutoplay,
  isAutoplaying,
};
