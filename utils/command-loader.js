/**
 * Loads subcommands for a given command and adds them to the command builder
 * @param {string} commandFolderPath - Path to the command folder
 * @param {SlashCommandBuilder} commandBuilder - The command builder to add subcommands to
 * @param {Map} subcommandsMap - Map to store loaded subcommands
 * @returns {Object} Object containing the updated builder and subcommands map
 */

const fs = require('fs');
const path = require('path');

function loadSubcommands(commandFolderPath, commandBuilder, subcommandsMap) {
    const subcommandsPath = path.join(commandFolderPath, 'subcommands');
    
    if (fs.existsSync(subcommandsPath)) {
        const subcommandFiles = fs.readdirSync(subcommandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`  Found ${subcommandFiles.length} subcommands: ${subcommandFiles.map(f => f.replace('.js', '')).join(', ')}`);
        
        for (const file of subcommandFiles) {
            try {
                const filePath = path.join(subcommandsPath, file);
                
                // Clear require cache to avoid stale modules during development
                delete require.cache[require.resolve(filePath)];
                
                const subcommand = require(filePath);
                
                if (subcommand.name && subcommand.data && subcommand.execute) {
                    subcommandsMap.set(subcommand.name, subcommand);
                    commandBuilder.addSubcommand(subcommand.data);
                    console.log(`    - Loaded subcommand: ${subcommand.name}`);
                } else {
                    console.log(`    [WARNING] Subcommand ${file} is missing required properties (name, data, execute)`);
                }
            } catch (error) {
                console.error(`    [ERROR] Failed to load subcommand ${file}:`, error.message);
            }
        }
    }
    
    return { builder: commandBuilder, subcommands: subcommandsMap };
}

module.exports = { loadSubcommands };