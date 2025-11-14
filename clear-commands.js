require('module-alias/register');
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('Missing required environment variables: DISCORD_TOKEN or CLIENT_ID');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log('Fetching global commands...');
        const globalCommands = await rest.get(Routes.applicationCommands(clientId));

        if (globalCommands.length === 0) {
            console.log('No global commands to delete.');
            return;
        }

        console.log(`Deleting ${globalCommands.length} global commands...`);
        for (const cmd of globalCommands) {
            console.log(` - Deleting /${cmd.name}`);
            await rest.delete(Routes.applicationCommand(clientId, cmd.id));
        }

        console.log('All global commands deleted successfully.');
    } catch (error) {
        console.error('Error clearing global commands:', error);
        process.exit(1);
    }
})();
