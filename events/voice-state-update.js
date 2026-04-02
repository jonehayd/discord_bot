import { Events } from "discord.js";
import { stop, getCurrentSong, getQueue } from "../core/music-player.js";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState) {
    const guild = oldState.guild;
    const botMember = guild.members.me;
    const botChannel = botMember?.voice?.channel;

    // Bot isn't in a voice channel — nothing to do
    if (!botChannel) return;

    // Check if bot is now alone (no human members remaining)
    const humanMembers = botChannel.members.filter((m) => !m.user.bot);
    if (humanMembers.size > 0) return;

    // Bot is alone — stop music and disconnect
    getCurrentSong(guild.id) || getQueue(guild.id).length > 0;
    stop(guild.id);
  },
};
