import fs from 'fs';
import path from 'path';
import {
  REST
} from '@discordjs/rest';
import {
  Routes
} from 'discord-api-types/v9';
import {
  Client,
  Collection
} from 'discord.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Current file directory
const slashCommands = new Collection(); // Store all loaded slash commands

/**
* Load and register slash commands from the specified directory
*/
const loadSlashCommands = async (directory, clientId, token, client) => {
  const commands = []; // To register commands globally
  const categories = await fs.promises.readdir(directory);

  for (const category of categories) {
    const categoryPath = path.join(directory, category);
    const commandFiles = await fs.promises.readdir(categoryPath);

    for (const file of commandFiles) {
      if (file.endsWith('.js')) {
        const command = await import(`./slashcommands/${category}/${file}`);
        if (command.default && command.default.data && command.default.execute) {
          // Add the command to the collection and push it for registration
          slashCommands.set(command.default.data.name, command.default);
          commands.push(command.default.data.toJSON()); // Discord.js slash command format
        }
      }
    }
  }

  // Register the commands with Discord
  const rest = new REST( {
    version: '10'
  }).setToken(token);
  try {
    console.log('Started refreshing application (/) commands...');
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }

  client.commands = slashCommands;
};


/**
* Handle interaction events for slash commands
*/
const handleSlashCommand = async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = slashCommands.get(interaction.commandName);
  if (!command) {
    console.error(`Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    interaction.reply({
      content: 'There was an error executing this command.', ephemeral: true
    });
  }
};

export {
  loadSlashCommands,
  handleSlashCommand
};