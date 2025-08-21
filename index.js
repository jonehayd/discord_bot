require('module-alias/register');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadSubcommands } = require('@utils/command-loader.js');

// Retrieve token
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const steamKey = process.env.STEAM_KEY;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

// Load commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log(`Loading commands from ${commandFolders.length} folders...`);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    
    // Skip if not a directory
    if (!fs.statSync(commandsPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log(`\nProcessing ${folder} folder...`);
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            // Clear require cache
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                // Load subcommands if this command supports them
                if (command.loadSubcommands) {
                    const subcommandsMap = new Map();
                    const result = loadSubcommands(commandsPath, command.data, subcommandsMap);
                    
                    // Store subcommands in the command object for later use
                    command.subcommands = result.subcommands;
                    
                    console.log(`${command.data.name} loaded with ${subcommandsMap.size} subcommands`);
                } else {
                    console.log(`${command.data.name} loaded (no subcommands)`);
                }
                
                client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to load command ${file}:`, error.message);
        }
    }
}

console.log(`\nTotal commands loaded: ${client.commands.size}`);

// Collection for command cooldowns
client.cooldowns = new Collection();

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token);