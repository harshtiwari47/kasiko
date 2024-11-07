import txtcommands from '../../textCommandHandler.js';

export default {
  name: "help",
  description: "Provides a list of commands or detailed info on a specific command.",
  aliases: ["commands", "h"],
  args: "[command name]",
  example: [
    "help", // Lists all commands
    "help shop" // Shows details for the 'shop' command
  ],
  category: "Utility",
  cooldown: 1000, // 1 second cooldown

  execute: (args, message) => {
    // Check if a specific command is requested
    const commandName = args[1] ? args[1].toLowerCase() : null;

    // If a specific command name is provided
    if (commandName) {
      const command = txtcommands.get(commandName);

      if (!command) {
        return message.channel.send(`❌ Command \`${commandName}\` not found.`);
      }

      // Build detailed help response for the specified command
      let response = `**Command: ${command.name}**\n`;
      response += `**Description:** ${command.description}\n`;
      if (command.aliases) response += `**Aliases:** ${command.aliases.join(', ')}\n`;
      if (command.args) response += `**Usage:** ${command.name} ${command.args}\n`;
      if (command.example && command.example.length > 0) {
        response += `**Examples:**\n${command.example.map(ex => `- ${ex}`).join('\n')}\n`;
      }
      if (command.related && command.related.length > 0) {
        response += `**Related Commands:** ${command.related.join(', ')}\n`;
      }
      response += `**Category:** ${command.category}\n`;
      response += `**Cooldown:** ${command.cooldown / 1000} seconds\n`;

      return message.channel.send(response);
    }

    // General help - List all commands grouped by category, filtering out duplicates
    const commandsByCategory = {};
    const seenCommands = new Set();

    txtcommands.forEach(cmd => {
      // Only add the command if it hasn't been seen (i.e., avoid adding aliases as new commands)
      if (!seenCommands.has(cmd.name)) {
        seenCommands.add(cmd.name);

        if (!commandsByCategory[cmd.category]) {
          commandsByCategory[cmd.category] = [];
        }
        commandsByCategory[cmd.category].push(cmd);
      }
    });

    // Build the response
    let response = "**Available Commands:**\n\n";
    for (const [category, commands] of Object.entries(commandsByCategory)) {
      response += `**${category}**\n`;
      response += commands.map(cmd => ` ${cmd.name}`).join(' ') + "\n";
    }

    response += "\nUse `help <command name>` for detailed info on a command.";
    
    // Send the help message
    message.channel.send(response);
  }
};