require('module-alias/register');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
    console.error('Missing required environment variables: DISCORD_TOKEN or CLIENT_ID');
    process.exit(1);
}

const rest = new REST().setToken(token);
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

// Load commands and subcommands
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const indexFile = path.join(folderPath, 'index.js');

    if (!fs.existsSync(indexFile)) continue;

    try {
        delete require.cache[require.resolve(indexFile)]; // Clear require cache
        const command = require(indexFile);
        const commandJSON = command.data.toJSON();
        commands.push(commandJSON);
        const subCount = commandJSON.options?.filter(opt => opt.type === 1).length || 0;
        console.log(`Prepared /${commandJSON.name}${subCount ? ` (${subCount} subcommands)` : ''}`);
    } catch (error) {
        console.error(`[ERROR] Failed to process ${folder}:`, error.message);
    }
}

(async () => {
    try {
        // Determine route
        const isProduction = process.env.NODE_ENV === 'production';
        const route = isProduction
            ? Routes.applicationCommands(clientId)
            : Routes.applicationGuildCommands(clientId, guildId);

        // Clear existing commands
        console.log('\nClearing existing commands...');
        await rest.put(route, { body: [] });
        console.log('Cleared all existing commands');

        // Deploy new commands
        console.log(`\nDeploying ${commands.length} commands...`);
        const data = await rest.put(route, { body: commands });

        console.log(`Successfully deployed ${data.length} commands`);
        data.forEach(cmd => {
            const subcommands = cmd.options?.filter(opt => opt.type === 1) || [];
            console.log(`  - /${cmd.name}${subcommands.length ? ` (${subcommands.length} subcommands)` : ''}`);
        });

    } catch (error) {
        console.error('Error deploying commands:', error);
        process.exit(1);
    }
})();
