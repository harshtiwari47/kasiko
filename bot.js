import './anticrash.js';
import {
  Client,
  GatewayIntentBits,
  InteractionType,
  PermissionsBitField,
  ActivityType,
  ChannelType
} from 'discord.js';
import dotenv from 'dotenv';

import express from 'express';

import {
  updateExpPoints
} from './utils/experience.js';

import {
  OwnerCommands
} from './src/owner/main.js';

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
  await loadSlashCommands('./src/slashcommands', clientId, TOKEN, client);
});

client.on('messageCreate', async (message) => {
  try {

    let prefix = "kas";

    //return if author is bot
    if (message.author.bot || message.system || message.webhookId) return;

    /*
    * custom feature for server
    */
    // Check if the message comes from the specified server.
    if (message.guild && (message.guild.id === "530977124195237918" || message.guild.id === "1306509956253487154" || message.guild.id === "1300075317448278060" || message.guild.id === "1337401490054316053")) {
      const regex = /https?:\/\/(?:www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)(?:\/\S*)?/;
      const match = message.content.match(regex);
      if (match) {
        const reelId = match[1];
        const ddInstagramLink = `<@${message.author.id}>\nhttps://www.instagramez.com/reel/${reelId}/`;
        // Send the instagramez link as a response.
        await message.channel.send(ddInstagramLink).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        await message.delete().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    }

    const mentionedBots = message.mentions.users.filter(user => user.bot);

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
    if (message.content.toLowerCase().startsWith("kasow")) return OwnerCommands(message.content.slice("kasow".toLowerCase().length).trim().split(/ +/), message);

    if (!(message.content.toLowerCase().startsWith(prefix) || message.content.toLowerCase().startsWith("kas"))) return

    // Check if user is command-banned
    const userId = message.author.id;
    const banKey = `user_ban:${userId}`;
    const isBanned = await redisClient.get(banKey).catch(() => null);
    if (isBanned) {
      return;
    }

    let args;
    if (message.content.toLowerCase().startsWith("kas")) {
      args = message.content.slice("kas".toLowerCase().length).trim().split(/ +/);
    } else {
      args = message.content.slice(prefix.toLowerCase().length).trim().split(/ +/);
    }

    // handle all types of text commands started with kas || prefix
    const commandName = args[0].toLowerCase();
    const command = txtcommands.get(commandName);
    if (!command) return;

    if (command.category !== "🧩 Fun" && command.category !== "🔧 Utility") {
      if (mentionedBots.size > 0) return;
    }

    let serverDoc;
    // Cache server configuration
    try {
      const serverKey = `server:${message.guild.id}`;
      const cachedServer = await redisClient.get(serverKey);

      if (cachedServer) {
        serverDoc = JSON.parse(cachedServer);
      } else {
        serverDoc = await Server.findOne({
          id: message.guild.id
        });
        if (serverDoc) {
          await redisClient.setEx(serverKey, 300, JSON.stringify(serverDoc)); // Cache 5 minutes
        }
      }
    } catch (e) {
      console.error('Server config error:', e);
    }

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
          await message.channel.send({
            content: `I am missing the following permissions: ${notAllowed}`,
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (notAllowed.includes("SEND_MESSAGES")) {
          return;
        }
      }
    } catch (e) {
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
    if (firstUserMention && !firstUserMention.bot) {
      let userExistenceMentioned = await userExists(firstUserMention.id);
      if (!userExistenceMentioned && command.category !== "🧩 Fun") {
        return message.channel.send("The mentioned user hasn't accepted the terms and conditions. They can accept them by typing `kas help`.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    }

    // update experience and level
    updateExpPoints(message.content.toLowerCase(), message.author, message.channel, message?.guild.id);

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
      const cooldownKey = `cooldown:${commandName}:${userId}`;
      const cooldownDuration = 10; // seconds

      // Atomic cooldown set
      const cooldownSet = await redisClient.set(cooldownKey, '1', {
        NX: true,
        EX: cooldownDuration
      });

      if (!cooldownSet) {
        const violationsKey = `violations:${userId}`;
        const violations = await redisClient.incr(violationsKey);

        // Set violation window on first offense
        if (violations === 1) await redisClient.expire(violationsKey, 60);

        // Ban after 4 violations in 60 seconds
        if (violations >= 5) {
          await redisClient.setEx(banKey, 600, '1'); // 10-minute ban
          await redisClient.del(violationsKey);
          return message.channel.send(`⛔ Command access revoked for 10 minutes due to spamming`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        const ttl = await redisClient.ttl(cooldownKey);
        try {
          const warning = await message.channel.send(
            `⏱️ **${message.author.username}**, you're on cooldown for this command! Wait **\`${ttl} sec\`**.`
          );
          setTimeout(() => warning.delete().catch(() => {}), 5000);
          return;
        } catch (errMsg) {}
      }

      // Reset violation counter on successful command
      await redisClient.del(`violations:${userId}`);

      command.execute(args, message);
    } catch (error) {
      console.error(error);
      return message.reply("There was an error executing that command.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  } catch (e) {
    console.error(e);
    return;
  }
});

client.on('interactionCreate', async (interaction) => {
  // Permission Checks (if in a guild)
  try {
    if (interaction.guild) {
      const channel = interaction.channel;
      const botPermissions = channel.permissionsFor(client.user);

      if (!botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
        await interaction.reply({
          content: 'I do not have permission to send messages in this channel.',
          ephemeral: true,
        }).catch(err => {
          if (![50001, 50013, 10008].includes(err.code)) console.error(err);
        });
        return;
      }

      if (!botPermissions.has(PermissionsBitField.Flags.UseApplicationCommands)) {
        await interaction.reply({
          content: 'I do not have permission to use Slash commands in this channel.',
          ephemeral: true,
        }).catch(err => {
          if (![50001, 50013, 10008].includes(err.code)) console.error(err);
        });
        return;
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Slash Command Handling
  if (interaction.isCommand()) {
    try {
      await handleSlashCommand(interaction);
    } catch (e) {
      console.error(e);

      if (interaction.replied || interaction.deferred) {
        return;
      }

      try {
        await interaction.reply({
          content: 'An error occurred while processing your command.',
          ephemeral: true,
        }).catch(err => {
          if (![50001, 50013, 10008].includes(err.code)) console.error(err);
        });
      } catch (replyError) {
        console.error('Failed to send error reply:',
          replyError);
      }
    }
    return; // Exit after handling command interactions
  }

  // Button Interaction Handling
  if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction, client);
    } catch (error) {
      console.error(error);
    }
    return; // Exit after handling button interactions
  }

  // Autocomplete Interaction Handling
  if (interaction.isAutocomplete()) {
    if (!client?.commands) {
      console.error("⚠️ client.commands is not initialized!");
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) {
      console.error(`⚠️ No autocomplete function found for ${interaction.commandName}`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error("Error handling autocomplete:", error);
    }
  }
});

client.on('guildCreate', async (guild) => {
  console.log(`New guild: ${guild.name}`);

  try {
    // Fetch the channel by ID
    const channel = client.channels.fetch('1345371434897244255');

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error(`Channel with ID 1345371434897244255 not found or is not a text channel in ${guild.name}`);
    }

    // Fetch the owner details
    const owner = await guild.fetchOwner();

    // Create an embed message
    const embed = new EmbedBuilder()
    .setTitle('New Server Joined!')
    .setColor(0x00ff00)
    .addFields(
      {
        name: 'Server Name', value: guild.name, inline: true
      },
      {
        name: 'Total Members', value: guild.memberCount.toString(), inline: true
      },
      {
        name: 'Owner', value: owner.user.tag, inline: true
      }
    )
    .setTimestamp();

    // Send the embed message
    await channel.send({
      embeds: [embed]
    });

    // Execute the WelcomeMsg function
    await WelcomeMsg.execute(guild);

  } catch (error) {
    console.error(`Error handling new guild ${guild.name}:`, error);
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

  return message.channel.send(`Total Members: ${totalMembers}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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