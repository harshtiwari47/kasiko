import Orca from '../../../models/Orca.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  client
} from '../../../bot.js';

import {
  EmbedBuilder
} from "discord.js";

async function findOrca(serverId) {
  const currentTime = new Date();

  // Check if there's an active orca in the server
  let orca = await Orca.findOne();

  // If no active orca, create a new one with a 1% spawn chance
  if (!orca) {
    const spawnChance = Math.random() * 100; // 8% chance
    if (spawnChance <= 8) {
      const expiryTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1-hour expiry
      orca = new Orca( {
        serverId,
        lastAppearance: currentTime,
      });
      await orca.save();
    }
  }

  return orca;
}

async function claimOrca(serverId, userId, username, channel, guildName) {
  const currentTime = new Date();
  let orca = await Orca.findOne();

  if (!orca) {
    return channel.send(`<:orca:1313094374921605172> **No Orca has appeared yet!** Use \`orca hunt\` to keep searching.`);
  }

  // If no hunter, set hunter
  if (!orca.hunter) {
    orca.hunter = username;
    orca.hunterId = userId;
    await orca.save();

    const embed = new EmbedBuilder()
    .setColor('#c4e9fc') // A refreshing blue color
    .setDescription(`🎉 **The Legendary Orca** has been discovered by **${username}** in **${guildName}**! Everyone, use \`orca pray\` to receive the reward!`)
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/orca.jpg`);

    return channel.send({
      embeds: [embed]
    });

  }

  // Reward logic
  const hunterReward = 10000;
  const serverReward = 2500;
  const otherReward = 1000;

  const userData = await getUserData(userId);
  let hunterData;

  if (userId !== orca.hunterId) {
    hunterData = await getUserData(orca.hunterId || null);
  } else {
    hunterData = userData;
  }
  const isHunter = userId === orca.hunterId;

  if (!userData.orca) {
    userData.orca = [orca["_id"].toString(),
      0];
  }

  if (orca["_id"].toString() === userData.orca[0] && (userData.orca[1] === "1" || userData.orca[1] === 1)) {
    return channel.send(
      `<:orca:1313094374921605172> **You have already prayed for the current Orca!** Please wait until a new Orca is discovered or use \`orca hunt\` to search for a new one yourself once the current Orca disappears.`
    );
  } else {
    userData.orca[1] = 1;
    userData.orca[0] = orca["_id"].toString();
  }

  // Award points
  if (isHunter) {
    userData.cash = (userData.cash || 0) + hunterReward;
    await updateUser(userId, userData);
    return channel.send(
      `🎉 **${username}** prayed and received <:kasiko_coin:1300141236841086977> **${hunterReward} cash** as the discoverer of the Legendary Orca! <:orca:1313094374921605172>`
    );
  }

  if (orca.serverId === serverId) {
    userData.cash = (userData.cash || 0) + serverReward;
    await updateUser(userId, userData);
    return channel.send(
      `🙏 **${username}** prayed and received <:kasiko_coin:1300141236841086977> **${serverReward} cash** as a member of the server where the <:orca:1313094374921605172> Orca was found!`
    );
  } else {
    userData.cash = (userData.cash || 0) + otherReward;
    await updateUser(userId, userData);
    return channel.send(
      `🙏 **${username}** prayed and received <:kasiko_coin:1300141236841086977> **${otherReward} cash**! The <:orca:1313094374921605172> Orca was found by **${orca.hunter}** in **${guildName}**.`
    );
  }
}

export async function execute(args, message) {
  const {
    channel,
    guild,
    author
  } = message;
  const serverId = guild.id;
  const userId = author.id;
  const username = author.username;
  const guildName = guild.name;

  if (args[1] === 'hunt') {
    try {
      const orca = await findOrca(serverId);
      if (orca && !orca.hunter) {
        return channel.send(
          `<:orca:1313094374921605172> **The Legendary Orca** is lurking! Be the first to discover it by using \`orca pray\`.`
        );
      } if (orca) {

        const serverName = await client.guilds.fetch(orca.serverId);

        const embed = new EmbedBuilder()
        .setColor('#c4e9fc') // A refreshing blue color
        .setDescription(`🎉 **The Legendary Orca** has been discovered by **${orca.hunter}** in **${serverName}**! Everyone, use \`orca pray\` to receive the reward!`)
        .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/orca.jpg`);

        return channel.send({
          embeds: [embed]
        });

      } else {
        return channel.send(`🔍 **${username}** is searching for the Legendary Orca... Keep trying!`);
      }
    } catch (error) {
      console.error(error);
      return channel.send(`❌ An error occurred while hunting the Orca.`);
    }
  } else if (args[1] === 'pray') {
    try {
      await claimOrca(serverId, userId, username, channel, guildName);
    } catch (error) {
      console.error(error);
      return channel.send(`❌ An error occurred while praying for the Orca.`);
    }
  } else {
    return channel.send(`<:orca:1313094374921605172> Use \`orca hunt\` to search for the Legendary Orca or \`orca pray\` to claim rewards.`);
  }
}

export default {
  name: 'orca',
  description: 'Hunt and claim the Legendary Orca in your server! The Discoverer will receive 10k cash, while other members in the server will receive 2500, and the rest will get 1000 upon praying.',
  aliases: ['orcahunt'],
  args: '<hunt|pray>',
  example: ['orca hunt',
    'orca pray'],
  cooldown: 10000,
  // 10 seconds cooldown
  category: '🌱 Explore',
  execute,
};