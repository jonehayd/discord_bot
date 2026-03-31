import { MessageFlags, SlashCommandSubcommandBuilder } from "discord.js";
import axios from "axios";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export default {
  name: "random-steamgame",
  data: new SlashCommandSubcommandBuilder()
    .setName("random-steamgame")
    .setDescription(
      `Gives a random game from a user's steam library. Your steam library must be set to public.`,
    )
    .addStringOption((option) =>
      option
        .setName("steam_id")
        .setDescription("Steam id (found under username in Account Details).")
        .setRequired(true),
    ),
  cooldown: 10,
  async execute(interaction) {
    const steamId64 = interaction.options.getString("steam_id").trim();

    try {
      const library = await getLibrary(steamId64);

      if (library.length === 0) {
        return await interaction.reply(
          "No games found or the library is private.",
        );
      }
      const gameNames = library.map((game) => game.name);
      const randomGame =
        gameNames[Math.floor(Math.random() * gameNames.length)];
      interaction.reply(`Your random game is: \n${randomGame} :tada: !`);
    } catch (error) {
      console.error(error);
      return await interaction.reply({
        content: `Could not fetch steam library. Make sure the ID is correct and your library is public.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

async function getLibrary(steamId64) {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=true&include_played_free_games=true`;

  const res = await axios.get(url);
  return res.data.response.games || [];
}
