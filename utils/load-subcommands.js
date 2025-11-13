const fs = require('fs');
const path = require('path');

function loadSubcommands(directory) {
    const subcommands = new Map();

    const files = fs.readdirSync(directory).filter(
        f => f.endsWith('.js') && f !== 'index.js'
    );

    for (const file of files) {
        const filePath = path.join(directory, file);
        const subcommand = require(filePath);

        if (subcommand?.data && typeof subcommand.execute === 'function') {
            subcommands.set(subcommand.data.name, subcommand);
        } else {
            console.warn(`[WARN] Skipping invalid subcommand: ${file}`);
        }
    }

    const addToBuilder = (builder) => {
        for (const subcommand of subcommands.values()) {
            builder.addSubcommand(subcommand.data);
        }
        return builder;
    };

    return { subcommands, addToBuilder };
}

module.exports = { loadSubcommands };
