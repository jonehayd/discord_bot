import { Events, MessageFlags } from "discord.js";
import { setSteamId } from "../database/steam.js";
import {
  getLibrary,
  pickRandomGame,
} from "../commands/games/random-steamgame.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (
      !interaction.isModalSubmit() ||
      interaction.customId !== "steam_id_modal"
    )
      return;

    const steamId = interaction.fields
      .getTextInputValue("steam_id_input")
      .trim();

    // Basic Steam ID64 format check (17-digit number starting with 7656119)
    if (!/^7656119\d{10}$/.test(steamId)) {
      return interaction.reply({
        content:
          "❌ That doesn't look like a valid Steam ID64. It should be a 17-digit number starting with `7656119`.\n\nYou can find yours at **https://steamid.io** or under **Steam → Account Details**.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const library = await getLibrary(steamId);

      if (library.length === 0) {
        return interaction.editReply(
          "❌ No games found. Make sure your Steam library is set to **public** and the ID is correct.",
        );
      }

      setSteamId(interaction.user.id, steamId);

      const game = pickRandomGame(library);
      return interaction.editReply(
        `✅ Steam account linked!\n\nYour random game is:\n**${game}** 🎉\n\n*Your ID has been saved — you won't need to enter it again.*`,
      );
    } catch {
      return interaction.editReply(
        "❌ Could not fetch your Steam library. Double-check your ID and make sure your profile is public.\n\nFind your Steam ID64 at **https://steamid.io**.",
      );
    }
  },
};
