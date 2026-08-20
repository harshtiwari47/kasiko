import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';
import {
  EmbedBuilder
} from 'discord.js';

function getHelpResponse(commandName = null) {
  if (commandName) {
    const command = txtcommands.get(commandName.toLowerCase());

    if (!command) {
      return {
        content: `❌ Command \`${commandName}\` not found.`,
        embeds: []
      };
    }

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
    response += `**Cooldown:** ${(command.cooldown || 5000) / 1000} seconds\n`;

    const embed = new EmbedBuilder()
      .setTitle(`Command Help: ${command.name}`)
      .setDescription(response)
      .setColor(0x3498db)
      .setTimestamp();

    return {
      content: null,
      embeds: [embed]
    };
  }

  const commandsByCategory = {};
  const seenCommands = new Set();

  txtcommands.forEach(cmd => {
    if (!seenCommands.has(cmd.name)) {
      seenCommands.add(cmd.name);

      if (!commandsByCategory[cmd.category]) {
        commandsByCategory[cmd.category] = [];
      }
      commandsByCategory[cmd.category].push(cmd);
    }
  });

  let response = "**All commands must be triggered with the prefix `kas`**.\n\n";
  for (const [category, commands] of Object.entries(commandsByCategory)) {
    response += `**${category}**\n`;
    response += commands.filter(cmd => cmd.visible !== false).map(cmd => ` ${cmd.name}`).join(' ') + "\n";
  }

  response += "\nUse `help <command name>` or `/help command:<command name>` for detailed info on a command.";

  const embed = new EmbedBuilder()
    .setTitle('Command List')
    .setDescription(response)
    .setColor(0x491ab9)
    .setTimestamp();

  return {
    content: null,
    embeds: [embed]
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('commandslist')
    .setDescription('Get a quick list of available commands or detailed help for a specific command.')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('The name of the command to get detailed help for.')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const commandName = interaction.options.getString('command');
      const {
        content,
        embeds
      } = getHelpResponse(commandName);

      if (content) {
        return await interaction.editReply(content);
      }
      if (embeds.length > 0) {
        return await interaction.editReply({
          embeds
        });
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.editReply('Error generating command list.');
      }
    }
  }
};