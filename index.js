require('module-alias/register');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadSubcommands } = require('@utils/load-subcommands.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

const token = process.env.DISCORD_TOKEN;

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log(`Loading commands from ${commandFolders.length} folders...`);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const indexFile = path.join(folderPath, 'index.js');
    if (!fs.existsSync(indexFile)) {
        console.warn(`[WARN] No index.js found in ${folderPath}`);
        continue;
    }

    try {
        const command = require(indexFile);

        // Load subcommands dynamically
        const { subcommands } = loadSubcommands(folderPath);
        command.subcommands = subcommands;

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded /${command.data.name} (${subcommands.size} subcommands)`);
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
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(token);
