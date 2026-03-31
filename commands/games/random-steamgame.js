import {
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import axios from "axios";
import { getSteamId } from "../../database/steam.js";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export async function getLibrary(steamId64) {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=true&include_played_free_games=true`;
  const res = await axios.get(url);
  return res.data.response.games || [];
}

export function pickRandomGame(library) {
  const names = library.map((g) => g.name);
  return names[Math.floor(Math.random() * names.length)];
}

export default {
  name: "random-steamgame",
  data: new SlashCommandSubcommandBuilder()
    .setName("random-steamgame")
    .setDescription("Gives a random game from your Steam library."),
  cooldown: 10,
  async execute(interaction) {
    const steamId = getSteamId(interaction.user.id);

    if (steamId) {
      // ID already on file — run the command directly
      await interaction.deferReply();
      try {
        const library = await getLibrary(steamId);
        if (library.length === 0) {
          return interaction.editReply(
            "No games found or your library is private.",
          );
        }
        return interaction.editReply(
          `Your random game is:\n**${pickRandomGame(library)}** 🎉`,
        );
      } catch {
        return interaction.editReply({
          content:
            "❌ Could not fetch your Steam library. Make sure your profile is set to public.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // No ID on file — ask via modal
    const modal = new ModalBuilder()
      .setCustomId("steam_id_modal")
      .setTitle("Link your Steam account");

    const input = new TextInputBuilder()
      .setCustomId("steam_id_input")
      .setLabel("Your Steam ID64")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. 76561198012345678")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  },
};
