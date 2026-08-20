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
import redisClient from '../redis.js';
import { sendErrorLog } from '../utils/errorLogger.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const slashCommands = new Collection();

/**
* Load and register slash commands from the specified directory
*/
const loadSlashCommands = async (directory, clientId, token, client) => {
  const commands = [];
  try {
    const categories = await fs.promises.readdir(directory);

    for (const category of categories) {
      const categoryPath = path.join(directory, category);
      const stat = await fs.promises.stat(categoryPath).catch(() => null);
      if (!stat || !stat.isDirectory()) continue;

      const commandFiles = await fs.promises.readdir(categoryPath);

      for (const file of commandFiles) {
        if (file.endsWith('.js')) {
          try {
            const command = await import(`./slashcommands/${category}/${file}`);
            if (command.default && command.default.data && command.default.execute) {
              slashCommands.set(command.default.data.name, command.default);
              commands.push(command.default.data.toJSON());
            }
          } catch (fileErr) {
            console.error(`Error loading slash command file ${category}/${file}:`, fileErr);
          }
        }
      }
    }
  } catch (dirErr) {
    console.error('Error reading slash commands directory:', dirErr);
  }

  // Register the commands with Discord
  if (token && clientId) {
    const rest = new REST({
      version: '10'
    }).setToken(token);
    try {
      console.log('Started refreshing application (/) commands...');
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands
      });
      console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
      console.error('Error registering slash commands with Discord API:', error);
    }
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

  // Optional slash command cooldown check
  if (command.cooldown && command.cooldown > 0) {
    const userId = interaction.user.id;
    const cooldownKey = `cooldown:slash:${interaction.commandName}:${userId}`;
    const duration = Math.ceil(command.cooldown / 1000);
    const cooldownSet = await redisClient.set(cooldownKey, '1', { NX: true, EX: duration }).catch(() => true);

    if (!cooldownSet) {
      const ttl = await redisClient.ttl(cooldownKey).catch(() => 5);
      const remainingSec = ttl > 0 ? ttl : duration;
      return interaction.reply({
        content: `<:kasiko_stopwatch:1355056680387481620> You are on cooldown for **/${interaction.commandName}**! Wait \`${remainingSec}s\`.`,
        ephemeral: true
      }).catch(() => {});
    }
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    sendErrorLog(error, {
      source: `Slash Command Execution (/${interaction.commandName})`,
      commandName: interaction.commandName,
      user: interaction.user,
      guild: interaction.guild,
      channel: interaction.channel,
      interaction
    }).catch(() => {});

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true
      }).catch(() => {});
    } else if (interaction.deferred && !interaction.replied) {
      interaction.editReply({
        content: 'There was an error executing this command.'
      }).catch(() => {});
    }
  }
};

export {
  loadSlashCommands,
  handleSlashCommand
};