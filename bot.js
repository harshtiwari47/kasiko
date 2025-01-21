import {
  Client,
  GatewayIntentBits,
  InteractionType,
  PermissionsBitField,
  ActivityType
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
import {
  checkPerms
} from './utils/permission.js';
import WelcomeMsg from './utils/welcome.js';
import Server from './models/Server.js';
import ServerRemoved from './models/ServerRemoved.js';
import UserGuild from './models/UserGuild.js';

import txtcommands from './src/textCommandHandler.js';

import {
  incrementTaskExp
} from './src/txtcommands/explore/pass.js';
import {
  loadSlashCommands,
  handleSlashCommand
} from './src/slashCommandHandler.js';
import {
  handleButtonInteraction
} from './interactions/buttonHandler.js';
import {
  createUser,
  userExists
} from './database.js';

import {
  EmbedBuilder
} from 'discord.js';

dotenv.config();

// Bind to port
const app = express();
// Simulate port binding
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Discord bot is running!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
// port bind ends

export const client = new Client( {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;
const clientId = process.env.APP_ID;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateStatus(client);
  await loadSlashCommands('./src/slashcommands', clientId, TOKEN);
});

client.on('messageCreate', async (message) => {
  try {
    //return if author is bot
    if (message.author.bot) return;

    const mentionedBots = message.mentions.users.filter(user => user.bot);

    let prefix = "kas";

    try {
      const key = `prefixs:${message.guild.id}`;
      const customPrefix = await redisClient.get(key);

      if (customPrefix) {
        prefix = customPrefix;
      } else {
        prefix = await getServerPrefix(message);
      }
    } catch (e) {
      console.error(e);
    }

    if (message.content.toLowerCase().startsWith("kasmem")) return getTotalUser(client, message);
    if (message.content.toLowerCase().startsWith("kasupsat")) return updateStatus(client);
    if (!(message.content.toLowerCase().startsWith(prefix) || message.content.toLowerCase().startsWith("kas"))) return
    if (mentionedBots.size > 0) return;

    let args;
    if (message.content.toLowerCase().startsWith("kas")) {
      args = message.content.slice("kas".toLowerCase().length).trim().split(/ +/);
    } else {
      args = message.content.slice(prefix.toLowerCase().length).trim().split(/ +/);
    }

    const serverDoc = await Server.findOne({
      id: message.guild.id
    });
    let channelDoc;
    // If we have a doc and the server is in restricted mode, check channel
    if (serverDoc && serverDoc.permissions === 'restricted_channels') {
      // Find the channel entry
      channelDoc = serverDoc.channels.find(ch => ch.id === message.channel.id);

      // If channelDoc exists and isAllowed is false, skip
      if (channelDoc && channelDoc.isAllowed === false && !message.content.toLowerCase().includes("channel")) {
        return;
      }
    }

    try {
      let notAllowed = await checkPerms(message);
      if (notAllowed) {
        if (!message.channel) {
          console.log("No channel found.");
          return;
        }

        if (!message.client.user) return;

        if (!notAllowed.includes("SEND_MESSAGES") && (args[0] && args[0] !== "channel")) {
          return await message.channel.send({
            content: `I am missing the following permissions: ${notAllowed}`,
          });
        }

        if (notAllowed.includes("SEND_MESSAGES")) {
          return;
        }
      }
    } catch (e) {
      console.error("There is an error while checking bot permissions!", e);
      return;
    }

    // check user exist
    let userExistence = await userExists(message.author.id);
    if (!userExistence) {
      try {
        return termsAndcondition(message);
      } catch (e) {
        return;
      }
    }

    // check other user has accepted terms & conditions
    const firstUserMention = message.mentions.users.first();

    if (firstUserMention) {
      let userExistenceMentioned = await userExists(firstUserMention.id);
      if (!userExistenceMentioned) {
        return message.channel.send("The mentioned user hasn't accepted the terms and conditions. They can accept them by typing `kas terms`.");
      }
    }
    // handle all types of text commands started with kas || prefix

    const commandName = args[0].toLowerCase();
    const command = txtcommands.get(commandName);

    // update experience and level
    updateExpPoints(message.content.toLowerCase(), message.author, message.channel, message?.guild.id);

    if (!command) return;

    if (channelDoc && channelDoc.category) {
      if (channelDoc && !channelDoc.category.allAllowed) {
        if (channelDoc.category.notAllowedCategories.includes(command.category)) {
          if (!((command.category === "🔧 Utility" && args[0] === "category") || (command.category === "🔧 Utility" && args[0] === "channel"))) {
            return;
          }
        }
      }
    }

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
          try {
            await coolDownMessage.delete();
          } catch (e) {}
        }, ttl * 1000);
        return;
      }

      // Set a cooldown for the user
      await redisClient.set(globalCooldownKey, '1', {
        EX: cooldownDuration
      });

      await incrementTaskExp(message.author.id, "command", message);

      if (command.category === "🧩 Fun") {
        await incrementTaskExp(message.author.id, "fun", message);
      }

      command.execute(args, message);
    } catch (error) {
      console.error(error);
      return message.reply("There was an error executing that command.");
    }
  } catch (e) {
    console.error(e);
    return;
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.guild) {
      const channel = interaction.channel;
      const botPermissions = channel.permissionsFor(client.user);

      if (!botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
        return interaction.reply({
          content: 'I do not have permission to send messages in this channel.',
          ephemeral: true,
        });
      }

      if (!botPermissions.has(PermissionsBitField.Flags.UseApplicationCommands)) {
        return interaction.reply({
          content: 'I do not have permission to use Slash commands in this channel.',
          ephemeral: true,
        });
      }
    }
  } catch(e) {
    console.error(e);
  }
  try {
    if (interaction.isCommand()) {
      await handleSlashCommand(interaction); // Handle slash command interactions
    }
  } catch (e) {
    console.error(e);

    if (interaction.replied || interaction.deferred) {
      return; // Do nothing if already responded
    }

    try {
      await interaction.reply({
        content: 'An error occurred while processing your command.', ephemeral: true
      });
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction, client);
    } catch (error) {
      console.error(error);
      // Optionally, notify the user of the error
    }
  }
});

client.on('guildCreate', async (guild) => {
  console.log(`New guild ${guild.name}`)
  try {
    await WelcomeMsg.execute(guild);
  } catch (e) {
    console.error(e);
  }
});

client.on('error', (error) => {
  console.error('Discord.js Error:', error);
});

client.on('guildDelete', async (guild) => {
  const serverId = guild.id;
  const serverName = guild.name;

  // Find and delete the server record from the database
  await Server.findOneAndDelete({
    id: serverId
  });

  try {
    const removedServer = new ServerRemoved( {
      id: serverId,
      name: serverName,
      removedAt: new Date()
    });

    await removedServer.save();
  } catch (e) {
    console.error(e)
  }

  console.log(`Bot was removed from the server with ID: ${serverId} & NAME: ${serverName}`);
});

client.on("guildMemberRemove", async (member) => {
  const userId = member.id;
  const guildId = member.guild.id;

  await UserGuild.deleteOne({
    userId, guildId
  });
});

async function getServerPrefix(message) {
  const serverId = message.guild.id;
  const serverName = message.guild.name;
  const serverOwnerId = message.guild.ownerId;

  const key = `prefixs:${serverId}`;

  let existingServer = await Server.findOne({
    id: serverId
  });

  try {
    if (!existingServer) {
      existingServer = new Server( {
        id: serverId,
        name: serverName,
        ownerId: serverOwnerId,
        allChannelsAllowed: true,
        channels: [],
        prefix: "kas"
      });
    }

    await redisClient.set(key, existingServer.prefix, {
      EX: 60
    });

    return existingServer.prefix
  } catch (e) {
    console.error(e);
    return "kas";
  }
}

function getTotalUser(client, message) {
  let totalMembers = 0;

  client.guilds.cache.forEach(guild => {
    totalMembers += guild.memberCount;
    console.log(`Server: ${guild.name}, Members: ${guild.memberCount}`);
  });

  return message.channel.send(`Total Members: ${totalMembers}`);
}


function updateStatus(client) {
  let toggle = true; // Flag to switch between server count and member count

  setInterval(() => {
    const guildCount = client.guilds.cache.size || 32;
    let totalMembers = 0;

    client.guilds.cache.forEach(guild => {
      totalMembers += guild.memberCount;
    });

    // Alternate between showing server count and member count
    const activity = toggle
    ? {
      name: `${guildCount} servers`,
      type: ActivityType.Watching,
    }: {
      name: `with ${totalMembers} members`,
      type: ActivityType.Playing,
    };

    client.user.presence.set({
      activities: [activity],
    });

    toggle = !toggle; // Toggle the flag to switch activities
  }, 6000); // Update every 60 seconds (1 minute)
}

client.login(TOKEN);