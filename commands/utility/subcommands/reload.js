const path = require('path');
const { loadSubcommands } = require('@utils/command-loader.js');

module.exports = {
    name: 'reload',
    data: subcommand =>
        subcommand
            .setName('reload')
            .setDescription('Reloads a command and its subcommands.')
            .addStringOption(option =>
                option.setName('command')
                    .setDescription('The parent command to reload')
                    .setRequired(true)
            ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();

        const command = interaction.client.commands.get(commandName);
        if (!command) {
            return interaction.reply(`There is no command with name \`${commandName}\`!`);
        }

        let replyMessage = '';

        try {
            // Build real filesystem path to the parent command
            const commandPathFile = path.join(__dirname, '..', '..', command.data.name, `${command.data.name}.js`);
            
            // Clear cache and reload parent command
            delete require.cache[require.resolve(commandPathFile)];
            const newCommand = require(commandPathFile);

            // Reload subcommands if parent supports them
            if (newCommand.loadSubcommands) {
                const subcommandsMap = new Map();
                const commandFolderPath = path.join(__dirname, '..', '..', command.data.name);
                loadSubcommands(commandFolderPath, newCommand.data, subcommandsMap);
                newCommand.subcommands = subcommandsMap;
            }

            // Update in the client's commands collection
            interaction.client.commands.set(newCommand.data.name, newCommand);

            replyMessage = `Command \`${newCommand.data.name}\` was reloaded!`;
            console.log(newCommand.subcommands); // Should show loaded subcommands

        } catch (error) {
            console.error(error);
            replyMessage = `There was an error while reloading \`${commandName}\``;
        }

        return interaction.reply(replyMessage);
    },
};
