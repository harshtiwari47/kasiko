import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

import {
  Ship
} from './shipsHandler.js';

import {
  Helper
} from '../../../helper.js';
import {
  startBattle,
  battleLog
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
    componentType: ComponentType.Button,
    time: 600000 // 10 minutes
  });

  collector.on('collect', async interaction => {
    try {
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
    } catch (error) {
      console.error("Interaction failed:", error);
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
  aliases: ["battle", "b", "fight"],
  // Aliases allow calling the command with different variations for battles or ships
  args: "[target]",
  example: [
    "battle",
    "battle logs",
    "battle <user> (optional but not a friendly battle) {Note: each battle cost $1000 & 25 durability}",
  ],
  related: ["ships", "active", "stat",
    "profile"],
  cooldown: 600000,
  category: "⚓ Battle",

  // Execute function based on the command alias
  execute: (args,
    message) => {
    const action = args[0] ? args[0].toLowerCase(): null;

    switch (action) {
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
        return message.channel.send("⚠️ Something went wrong! Can't start the battle.")
      }
      break;
    default:
      return message.channel.send("⚔️ **Invalid Command**\nUse `battle log` to view logs of your battle defenses, or `battle engage <target>` to engage in a pirate battle.");
    }
  }
};