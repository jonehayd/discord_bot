import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { readdirSync, existsSync } from "fs";
import { REST, Routes } from "discord.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error(
    "Missing required environment variables: DISCORD_TOKEN or CLIENT_ID",
  );
  process.exit(1);
}

const rest = new REST().setToken(token);
const commands = [];
const commandsPath = join(__dirname, "commands");
const commandFolders = readdirSync(commandsPath);

// Load commands and subcommands
for (const folder of commandFolders) {
  const folderPath = join(commandsPath, folder);
  const indexFile = join(folderPath, "index.js");

  if (!existsSync(indexFile)) continue;

  try {
    const command = (await import(pathToFileURL(indexFile).href)).default;
    const commandJSON = command.data.toJSON();
    commands.push(commandJSON);
    const subCount =
      commandJSON.options?.filter((opt) => opt.type === 1).length || 0;
    console.log(
      `Prepared /${commandJSON.name}${subCount ? ` (${subCount} subcommands)` : ""}`,
    );
  } catch (error) {
    console.error(`[ERROR] Failed to process ${folder}:`, error.message);
  }
}

try {
  const isProduction = process.env.NODE_ENV === "production";
  const route = isProduction
    ? Routes.applicationCommands(clientId) // Global
    : Routes.applicationGuildCommands(clientId, guildId); // Guild

  // Fetch existing commands for cleanup
  const existingCommands = await rest.get(route);
  if (existingCommands.length) {
    console.log("\nDeleting existing commands...");
    for (const cmd of existingCommands) {
      console.log(` - Deleting /${cmd.name}`);
      await rest.delete(`${route}/${cmd.id}`);
    }
  }

  // Deploy new commands
  console.log(`\nDeploying ${commands.length} commands...`);
  const data = await rest.put(route, { body: commands });

  console.log(`Successfully deployed ${data.length} commands`);
  data.forEach((cmd) => {
    const subcommands = cmd.options?.filter((opt) => opt.type === 1) || [];
    console.log(
      `  - /${cmd.name}${subcommands.length ? ` (${subcommands.length} subcommands)` : ""}`,
    );
  });
} catch (error) {
  console.error("Error deploying commands:", error);
  process.exit(1);
}
