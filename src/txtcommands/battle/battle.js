import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  Ship
} from './shipsHandler.js';

import {
  Helper
} from '../../../helper.js';
import {
  startBattle, battleLog
} from './battleSystem.js';

async function sendChallenge(args, message) {
  const targetId = Helper.extractUserId(args[1]);
  const targetUser = message.guild.members.cache.get(targetId);

  if (!targetUser) {
    return message.channel.send("🚫 The mentioned user is not in this guild.");
  }

  // Create an embed for the battle request
  const embed = new EmbedBuilder()
  .setColor(0xff0000) // Red color for battle request
  .setTitle("⚔️ Battle Request ⚔️")
  .setDescription(`${targetUser}, you have been challenged to a battle by ${message.author}.`)
  .addFields(
    {
      name: "Instructions", value: "Click 'Accept' to join the battle or 'Decline' to reject."
    },
    {
      name: "Time Limit", value: "You have 10 minutes to respond."
    }
  )
  .setFooter({
    text: "Prepare for battle!"
  });

  // Create buttons for Accept and Decline
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('accept')
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
    .setCustomId('decline')
    .setLabel('Decline')
    .setStyle(ButtonStyle.Danger)
  );

  // Send the embed and buttons
  const requestMessage = await message.channel.send({
    embeds: [embed], components: [row]
  });

  // Create an interaction collector for the buttons
  const collector = requestMessage.createMessageComponentCollector({
    componentType: 'BUTTON',
    time: 600000 // 10 minutes
  });

  collector.on('collect', async interaction => {
    if (interaction.user.id !== targetId) {
      return interaction.reply({
        content: "You are not the challenged user!",
        ephemeral: true
      });
    }

    if (interaction.customId === 'accept') {
      await interaction.update({
        content: `${targetUser} accepted the battle! ⚔️`, embeds: [], components: []
      });
      await startBattle(targetId, message);
      collector.stop();
    } else if (interaction.customId === 'decline') {
      await interaction.update({
        content: `${targetUser} declined the battle.`, embeds: [], components: []
      });
      collector.stop();
    }
  });

  collector.on('end',
    collected => {
      if (collected.size === 0) {
        requestMessage.edit({
          content: "⏳ The battle request timed out.", embeds: [], components: []
        });
      }
    });
}


export default {
  name: "battle",
  description: "View or engage in pirate battles, attack others, check ship stats, weapon stats, and battle messages.",
  aliases: ["battle", "b",
    "ship",
    "ships",
    "fight",
    "active"],
  // Aliases allow calling the command with different variations for battles or ships
  args: "<action> [target]",
  example: [
    "battle <user (optional but not a friendly battle)> {Note: each battle cost $1000}",
    "ship",
    "ship active <shipId (optional: specify to set as active)>",
    "active <option (optional)> (option: use 'up' to level up or 'repair <count>' for number of repairs; count is optional)",
  ],
  related: ["stat",
    "profile"],
  cooldown: 5000,
  category: "Battle",

  // Execute function based on the command alias
  execute: (args,
    message) => {
    const action = args[0] ? args[0].toLowerCase(): null;

    switch (action) {
    case "ship":
    case "ships":
      if (args[1]) {
        if (args[1].toLowerCase() === "active" && !args[2]) {
          return Ship.activeShip(message.author.id, message);
        } else {
          return Ship.setActiveShip(args[2], message.author.id, message);
        }
      } else {
        // If the command is "ship", show ship stats
        return Ship.showUserShips(message.author.id, message);
      }
      break;
    case "active":
      if (args[1]) {
        if (args[1] === "up") {
          return Ship.levelUp(message.author.id, message);
        } else if (args[1] === "repair") {
          let times = args[2] && Helper.isNumber(args[2]) ? args[2]: 1;
          return Ship.repair(times, message.author.id, message);
        }
      } else {
        return Ship.activeShip(message.author.id, message);
      }
      break;
    case "battle":
    case "fight":
    case "b":
      try {
        // Start the battle
        if (args[1] && Helper.isUserMention(args[1], message) && !(Helper.extractUserId(args[1]) === message.author.id)) {
          return sendChallenge(args, message);
        } else {
          if (args[1] && (args[1].toLowerCase() === "log" || args[1].toLowerCase() === "logs")) {
          return battleLog(message);
          } else {
          return startBattle(null, message);
          }
        }
      } catch (e) {
      console.log(e)
      return  message.channel.send("⚠️ Something went wrong! Can't start the battle.")
      }
      break;
    default:
      return message.channel.send("⚔️ **Invalid Command**\nUse `battle ship` to view ship stats, or `battle engage <target>` to engage in a pirate battle.");
    }
  }
};