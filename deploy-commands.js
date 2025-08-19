/**
 * @file deploy-commands.js
 * @description Deploys slash commands to guilds
 * @module @root
 */

require('module-alias/register');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { loadSubcommands } = require('@utils/command-loader');
require('dotenv').config(); // Load .env variables

// Get environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Validation
if (!token || !clientId || !guildId) {
    console.error('Missing required environment variables: DISCORD_TOKEN, CLIENT_ID, or GUILD_ID');
    process.exit(1);
}

const commands = [];

// Grab all the command folders from the commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log(`Found ${commandFolders.length} command folders: ${commandFolders.join(', ')}`);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    
    // Skip if not a directory
    if (!fs.statSync(commandsPath).isDirectory()) {
        console.log(`[SKIP] ${folder} is not a directory`);
        continue;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
        file.endsWith('.js') && !file.startsWith('.')
    );

    console.log(`\nProcessing ${folder} folder with ${commandFiles.length} files...`);

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            // Clear require cache to avoid stale modules during development
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                // Load subcommands if this command supports them
                if (command.loadSubcommands) {
                    const subcommandsMap = new Map();
                    console.log(`  Loading subcommands for ${command.data.name}...`);
                    loadSubcommands(commandsPath, command.data, subcommandsMap);
                    console.log(`  - ${command.data.name} loaded with ${subcommandsMap.size} subcommands`);
                } else {
                    console.log(`  - ${command.data.name} (no subcommands)`);
                }
                
                const commandData = command.data.toJSON();
                commands.push(commandData);
                
                // Log subcommands if they exist
                if (commandData.options && commandData.options.length > 0) {
                    const subcommands = commandData.options.filter(opt => opt.type === 1); // Type 1 = subcommand
                    if (subcommands.length > 0) {
                        console.log(`    -> ${commandData.name} (${subcommands.length} subcommands: ${subcommands.map(s => s.name).join(', ')})`);
                    } else {
                        console.log(`    -> ${commandData.name}`);
                    }
                } else {
                    console.log(`    -> ${commandData.name}`);
                }
            } else {
                console.log(`[WARNING] ${filePath} is missing required "data" or "execute" property.`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to load command from ${filePath}:`, error.message);
        }
    }
}

console.log(`\nTotal commands to deploy: ${commands.length}`);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`\nStarted refreshing ${commands.length} application (/) commands...`);

        // Use global commands for production, guild commands for development
        const route = process.env.NODE_ENV === 'production' 
            ? Routes.applicationCommands(clientId)
            : Routes.applicationGuildCommands(clientId, guildId);

        const data = await rest.put(route, { body: commands });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        
        // List deployed commands with detailed subcommand info
        console.log('\nDeployed commands:');
        data.forEach(cmd => {
            if (cmd.options && cmd.options.some(opt => opt.type === 1)) {
                const subcommands = cmd.options.filter(opt => opt.type === 1);
                console.log(`  - /${cmd.name} (${subcommands.length} subcommands: ${subcommands.map(s => s.name).join(', ')})`);
            } else {
                console.log(`  - /${cmd.name}`);
            }
        });
        
    } catch (error) {
        if (error.code === 50001) {
            console.error('Missing Access: Bot lacks permission to register commands in this guild.');
        } else if (error.code === 10062) {
            console.error('Unknown interaction: This usually means the application ID is incorrect.');
        } else if (error.status === 401) {
            console.error('Unauthorized: Invalid bot token.');
        } else {
            console.error('Error deploying commands:', error);
        }
        process.exit(1);
    }
})();