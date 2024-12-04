import {
  Client,
  GatewayIntentBits,
  InteractionType
} from 'discord.js';
import dotenv from 'dotenv';

import express from 'express';

import {
  updateExpPoints
} from './utils/experience.js';
import redisClient from './redis.js';
import {
  termsAndcondition
} from './utils/terms.js';
import WelcomeMsg from './utils/welcome.js';
import Server from './models/Server.js';

import txtcommands from './src/textCommandHandler.js';
import {
  loadSlashCommands,
  handleSlashCommand
} from './src/slashCommandHandler.js';

import {
  createUser,
  userExists
} from './database.js';

import {
  EmbedBuilder
} from 'discord.js';

import DevelopmentStatus from './models/devlopmentStatus.js';

dotenv.config();

// Bind to port
const app = express();
// Simulate port binding
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Discord bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
// port bind ends

export const client = new Client( {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;
const clientId = process.env.APP_ID;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await loadSlashCommands('./src/slashcommands', clientId, TOKEN);
});

client.on('messageCreate', async (message) => {
  try {
    //return if author is bot
    if (message.author.bot) return;

    const mentionedBots = message.mentions.users.filter(user => user.bot);

    let prefix = "kas";

    if (!message.content.toLowerCase().startsWith(prefix)) return

    if (mentionedBots.size > 0) return

    let startPer = performance.now();

    const activeStatus = await DevelopmentStatus.isActive();

    if (activeStatus) {
      // Define the start and end times
      const developmentStartTime = activeStatus.startTime;
      const developmentEndTime = activeStatus.endTime;

      const embed = new EmbedBuilder()
      .setColor('#ff0000') // Set a red color to indicate development
      .setTitle('🚧 Bot Under Development 🚧')
      .setDescription('Our bot is currently undergoing improvements to enhance your experience. Please bear with us during this time.')
      .addFields(
        {
          name: 'Start Time', value: developmentStartTime, inline: true
        },
        {
          name: 'End Time', value: developmentEndTime, inline: true
        },
      )
      .setFooter({
        text: 'Thank you for your patience!'
      })
      .setTimestamp();

      message.channel.send({
        embeds: [embed]
      });
    }

    // check user exist
    let userExistence = await userExists(message.author.id);
    if (!userExistence) {
      return termsAndcondition(message);
    }

    // check other user has accepted terms & conditions
    const firstUserMention = message.mentions.users.first();

    if (firstUserMention) {
      let userExistenceMentioned = await userExists(firstUserMention.id);
      if (!userExistenceMentioned) {
        return message.channel.send("The mentioned user hasn't accepted the terms and conditions. They can accept them by typing `kas terms`.");
      }
    }

    // handle all types of text commands started with kas
    const args = message.content.slice(prefix.toLowerCase().length).trim().split(/ +/);
    const commandName = args[0].toLowerCase();
    const command = txtcommands.get(commandName);

    // update experience and level
    updateExpPoints(message.content.toLowerCase(), message.author, message.channel);

    if (!command) return;

    try {
      const userId = message.author.id;
      const globalCooldownKey = `cooldown:${commandName}:${userId}`;
      const cooldownDuration = 10; // Cooldown duration in seconds
      const ttl = await redisClient.ttl(globalCooldownKey);
      if (ttl > 0) {
        const coolDownMessage = await message.channel.send(
          `⏳ **${message.author.username}**, you're on cooldown for this command! Wait **\`${ttl} sec\`**.`
        );
        setTimeout(async () => {
          await coolDownMessage.delete();
        }, ttl * 1000);
        return;
      }

      // Set a cooldown for the user
      await redisClient.set(globalCooldownKey, '1', {
        EX: cooldownDuration
      });

      command.execute(args, message);
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.");
    }
    let endPer = performance.now();

    console.log(`Total excecution time for ${commandName} is ${endPer - startPer} ms`);
  } catch (e) {
    console.error(e);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    let userExistence = await userExists(interaction.user.id);
    if (!userExistence) {
      await interaction.reply({
        content: `You haven't accepted our terms and conditions! Type \`kas terms\` in a server where the bot is available to create an account.`,
        ephemeral: true, // Only visible to the user
      });
      return;
    }
    if (interaction.isCommand()) {
      await handleSlashCommand(interaction); // Handle slash command interactions
    }
  } catch (e) {
    console.error(e);
  }
});

client.on('guildCreate', WelcomeMsg.execute);

client.on('guildDelete', async (guild) => {
  const serverId = guild.id;

  // Find and delete the server record from the database
  await Server.findOneAndDelete({
    id: serverId
  });

  console.log(`Bot was removed from the server with ID: ${serverId}`);
});

client.login(TOKEN);