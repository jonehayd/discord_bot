import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { readdirSync, statSync, existsSync } from "fs";
import { Client, Collection, GatewayIntentBits } from "discord.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const token = process.env.DISCORD_TOKEN;

// Load commands
client.commands = new Collection();
const commandsPath = join(__dirname, "commands");
const commandFolders = readdirSync(commandsPath);

console.log(`Loading commands from ${commandFolders.length} folders...`);

for (const folder of commandFolders) {
  const folderPath = join(commandsPath, folder);
  if (!statSync(folderPath).isDirectory()) continue;

  const indexFile = join(folderPath, "index.js");
  if (!existsSync(indexFile)) {
    console.warn(`[WARN] No index.js found in ${folderPath}`);
    continue;
  }

  try {
    const command = (await import(pathToFileURL(indexFile).href)).default;

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(
        `Loaded /${command.data.name} (${command.subcommands?.size ?? 0} subcommands)`,
      );
    } else {
      console.warn(`[WARN] Command in ${folderPath} missing data or execute`);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to load command in ${folder}:`, error);
  }
}

console.log(`\nTotal commands loaded: ${client.commands.size}`);

// Cooldowns
client.cooldowns = new Collection();

// Load events
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

for (const file of eventFiles) {
  const event = (await import(pathToFileURL(join(eventsPath, file)).href))
    .default;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(token);
