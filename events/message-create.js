import { Events, MessageFlags } from "discord.js";

// Handles the creation of
export default {
  name: Events.MessageCreate,
  async execute(message, client, prefix) {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply({
        content: "There was an error while executing this command!",
        MessageFlags: MessageFlags.Ephemeral,
      });
    }
  },
};
