import txtcommands from '../../textCommandHandler.js';
import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "help",
  description: "Provides a list of commands or detailed info on a specific command.",
  aliases: ["commands",
    "guide"],
  args: "[command name]",
  example: [
    "help",
    // Lists all commands
    "help shop" // Shows details for the 'shop' command
  ],
  category: "🔧 Utility",
  cooldown: 6000,
  // 6 second cooldown

  execute: (args, message) => {
    // Check if a specific command is requested
    const commandName = args[1] ? args[1].toLowerCase(): null;

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

      // Create embed
      const embed = new EmbedBuilder()
      .setTitle(`Command Help: ${command.name}`)
      .setDescription(response)
      .setColor(0x3498db)

      // Check if the response length exceeds Discord's limit
      if (embed.data.description.length > 6000) {
        const parts = chunkString(response, 6000); // Split response into parts
        parts.forEach((part, index) => {
          const embedPart = new EmbedBuilder()
          .setTitle(`Command Help: ${command.name} (Part ${index + 1})`)
          .setDescription(part)
          .setColor(0x3498db)
          message.channel.send({
            embeds: [embedPart]
          });
        });
      } else {
        message.channel.send({
          embeds: [embed]
        });
      }
      return;
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
    let response = "All commands must be triggered with the prefix `kas`.\n\n";
    for (const [category, commands] of Object.entries(commandsByCategory)) {
      response += `**${category}**\n`;
      response += commands.filter(cmd => cmd.visible !== false).map(cmd => ` ${cmd.name}`).join(' ') + "\n";
    }

    response += "\nUse `help <command name>` for detailed info on a command.";

    // Create embed for general help
    const embed = new EmbedBuilder()
    .setTitle('Command List')
    .setDescription(response)
    .setColor(0x491ab9)

    // Check if the response length exceeds Discord's limit
    if (embed.data.description.length > 6000) {
      const parts = chunkString(response, 6000); // Split response into parts
      parts.forEach((part, index) => {
        const embedPart = new EmbedBuilder()
        .setTitle(`Available Commands (Part ${index + 1})`)
        .setDescription(part)
        .setColor(0x491ab9)
        message.channel.send({
          embeds: [embedPart]
        });
      });
    } else {
      message.channel.send({
        embeds: [embed]
      });
    }
  }
};
  // Function to chunk string into parts that fit Discord's limit (6000 characters max)
  function chunkString(str, length) {
    const chunks = [];
    while (str.length > length) {
      let index = str.lastIndexOf('\n', length);
      if (index === -1) index = length;
      chunks.push(str.substring(0, index));
      str = str.substring(index).trim();
    }
    chunks.push(str);
    return chunks;
  }