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

const IDLE_DISCONNECT_MS = 30_000;

/** @type {Map<string, GuildPlayerState>} */
const players = new Map();

function createGuildPlayer(guildId) {
  const audioPlayer = createAudioPlayer();

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    const state = players.get(guildId);
    if (!state) return;

    if (state.queue.length > 0) {
      playNext(guildId);
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

  try {
    const ytProcess = youtubedl.exec(song.url, {
      output: "-",
      format: "bestaudio[ext=webm]/bestaudio/best",
      noCheckCertificates: true,
      noWarnings: true,
      quiet: true,
      preferFreeFormats: true,
    });
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

  state.audioPlayer.stop(); // triggers Idle event → playNext
  return true;
}

function stop(guildId) {
  const state = players.get(guildId);
  if (!state) return false;

  if (state.disconnectTimer) clearTimeout(state.disconnectTimer);

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
};
