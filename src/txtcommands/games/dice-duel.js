import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  Helper
} from '../../../helper.js';

export async function diceDuel(id, opponentId, amount, channel) {
  try {
    amount = parseInt(amount, 10);

    if (isNaN(amount)) {
      return channel.send(`⚠️ Please enter a valid integer amount of 𝑪𝒂𝒔𝒉 for **diceduel**!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    // Fetch both players' user data
    const guild = await channel.guild.members.fetch(id);
    const opponent = await channel.guild.members.fetch(opponentId);

    // Fetch user data with error handling
    let userData,
    opponentData;
    try {
      userData = await getUserData(id);
      opponentData = await getUserData(opponentId);
    } catch (e) {
      console.error("Error fetching user data:", e);
      return channel.send('🚨 **Error!** There was an issue retrieving user data. Please try again later.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Check if both players have enough balance to proceed
    if (userData.cash < amount) {
      return channel.send(`⚠️ **${guild.user.username}** don't have enough <:kasiko_coin:1300141236841086977> cash to bet. Please check your balance with \`cash\` and try again.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } else if (opponentData.cash < amount) {
      return channel.send(`⚠️ Your opponent doesn't have enough <:kasiko_coin:1300141236841086977> cash. Ask them to check their balance.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Create a challenge message and buttons (only the opponent gets a button to roll)
    const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId('start_roll_opponent') // Custom ID for opponent's button
      .setLabel('Roll Dice (Opponent)')
      .setStyle(ButtonStyle.Primary)
    );


    let duelMessage = await channel.send({
      content: `🎲 **${guild.user.username}** has challenged **<@${opponent.user.id}>** to a Dice Duel for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** 𝑪𝒂𝒔𝒉!\n\nClick the button to roll the dice!`,
      components: [row]
    });

    // Create a filter to only collect the opponent's interaction
    const filter = (interaction) => {
      return interaction.user.id === opponentId && interaction.customId === 'start_roll_opponent';
    };

    // Create a collector that will listen for the opponent's interaction
    const collector = duelMessage.createMessageComponentCollector({
      filter,
      time: 25000, // 25 seconds for interaction
      max: 1, // Collect only 1 interaction
    });

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('start_roll_opponent')
      .setLabel('Roll Dice (Opponent)')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true)
    );

    collector.on('collect', async (interaction) => {
      try {
        // Immediately disable the button to prevent further interaction

        await interaction.update({
          components: [disabledRow]
        });

        if (!duelMessage || !duelMessage?.edit) return;

        await duelMessage.edit({
          components: [disabledRow]
        });

        // Simulate the rolling dice animation
        let animation = ['🎲',
          '🎲',
          '🎲'];
        let rollingMessage;
        try {
          rollingMessage = await duelMessage.edit(
            `🎲 **𝑹𝒐𝒍𝒍𝒊𝒏𝒈 𝒕𝒉𝒆 𝒅𝒊𝒄𝒆... 𝑳𝒆𝒕'𝒔 𝒔𝒆𝒆 𝒘𝒉𝒐 𝒍𝒖𝒄𝒌 𝒇𝒂𝒗𝒐𝒓𝒔!**\n\n` +
            `**${guild.user.username}** vs **${opponent.user.username}**\n` +
            `${animation.join(' | ')}`
          );
        } catch (e) {
          return channel.send('🚨 **Error!** There was an issue while rolling the dice. Please try again.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Simulate dice rolls
        for (let i = 0; i < 5; i++) {
          animation = [Helper.randomInt(1, 6),
            Helper.randomInt(1, 6)];
          if (rollingMessage && rollingMessage.edit) {
            await rollingMessage.edit(
              `🎲 **𝑻𝒉𝒆 𝒅𝒊𝒄𝒆 𝒂𝒓𝒆 𝒓𝒐𝒍𝒍𝒊𝒏𝒈... 𝑯𝒐𝒍𝒅 𝒚𝒐𝒖𝒓 𝒃𝒓𝒆𝒂𝒕𝒉!**\n\n` +
              `**${guild.user.username}** vs **${opponent.user.username}**\n` +
              `${animation.join(' | ')}`
            );
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between rolls
        }

        // Final roll
        let userRoll = Helper.randomInt(1, 6);
        let opponentRoll = Helper.randomInt(1, 6);

        if (!rollingMessage || !rollingMessage?.edit) return;

        await rollingMessage.edit(
          `🎲 **Final Dice Roll!**\n\n` +
          `**${guild.user.username}** rolled: **${userRoll}**\n` +
          `**${opponent.user.username}** rolled: **${opponentRoll}**`
        );

        // Determine winner and loser
        let winner,
        loser;
        if (userRoll > opponentRoll) {
          winner = id;
          loser = opponentId;
        } else if (userRoll < opponentRoll) {
          winner = opponentId;
          loser = id;
        } else {
          return rollingMessage.edit(
            `🎲 **It's a tie!** Both players rolled the same value.\n` +
            `- **${guild.user.username}** rolled: **${userRoll}**\n` +
            `- **${opponent.user.username}** rolled: **${opponentRoll}**`
          ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Deduct cash from the loser and give it to the winner
        let winAmount = amount;
        let loserData,
        winnerData;
        try {
          loserData = await getUserData(loser);
          winnerData = await getUserData(winner);
        } catch (e) {
          console.error('Error fetching user data after game:', e);
          return channel.send('🚨 **Error!** There was an issue retrieving user data after the game. Please try again later.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Ensure both users have valid data before continuing
        if (!winnerData || !loserData) {
          return channel.send('🚨 **Error!** One or both players have invalid data. Please try again.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        // Update user data after the game
        winnerData.cash += winAmount;
        loserData.cash -= winAmount;

        try {
          await updateUser(winner, {
            cash: winnerData.cash
          });
          await updateUser(loser, {
            cash: loserData.cash
          });
        } catch (e) {
          console.error('Error updating user data:', e);
          return channel.send('🚨 **Error!** There was an issue updating user data. Please try again later.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (!rollingMessage || !rollingMessage?.edit) return;

        // Final message after the game
        return rollingMessage.edit(
          `🎲 **ᗪIᑕE ᗪᑌEᒪ Results**\n` +
          `✨ **${winner === id ? guild.user.username: opponent.user.username}** emerges victorious and earns **${winAmount} coins**!\n` +
          `💔 **${winner === opponentId ? guild.user.username: opponent.user.username}** loses **${winAmount} coins**.\n` +
          `🎲 **Rolls**:\n` +
          `- **${guild.user.username}**: **${userRoll}**\n` +
          `- **${opponent.user.username}**: **${opponentRoll}**`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      } catch (error) {
        console.error("Error In Diceduel: " + error);
      }
    });

    collector.on('end',
      (collected, reason) => {
        // If no interaction or timeout
        if (reason === 'time') {
          if (duelMessage && duelMessage.edit) {
            return duelMessage.edit({
              content: '⏳ **Time’s up!** The duel timed out because your opponent didn’t interact in time.',
              components: [] // Removes all components
            }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        }
      });

  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    await channel.send(`ⓘ Something went wrong while starting the dice duel. Please check the command format and try again.\n**Error:** ${e.message}`).catch(console.error);
    return;
  }
}

export default {
  name: "diceduel",
  description: "Challenge another player to a thrilling dice duel! Bet an amount of your in-game currency and roll the dice to see who wins. The player with the higher roll claims the prize. Test your luck and strategy in this exciting game of chance!",
  aliases: ["dice",
    "dd",
    "diceduel"],
  args: "<opponent_id> <amount>",
  example: ["dice @opponent 500"],
  related: ["slots",
    "cash",
    "tosscoin",
    "guess"],
  emoji: "🎲",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🎲 Games",

  // Main function to execute the dice duel logic
  execute: async (args,
    message) => {
    try {
      const {
        author,
        channel
      } = message;

      // Validate opponent mention or ID
      const opponentId = args[1] ? args[1].replace(/[<@!>]/g,
        ''): null;

      if (!opponentId || !/^\d+$/.test(opponentId)) {
        return channel.send(`ⓘ ${author}, please mention a **valid opponent** or provide their **user ID**.\n**Usage:** \`diceduel @user <amount>\``).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (author.id === opponentId) {
        return channel.send(`⚠️ ${author}, you **cannot** challenge yourself.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const amount = parseInt(args[2] || 1, 10);

      // Validate the amount
      if (isNaN(amount) || amount < 1) {
        return channel.send(`⚠️ ${author}, the **minimum bet** is <:kasiko_coin:1300141236841086977> **1**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (amount > 200000) {
        return channel.send(`⚠️ ${author}, the **maximum bet** allowed is <:kasiko_coin:1300141236841086977> **200,000**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Proceed with the dice duel
      await diceDuel(author.id, opponentId, amount, channel);
      return;
    } catch (error) {
      console.error(`DiceDuel Error: ${error}`);
      await message.channel.send(`⚠️ ${message.author}, something **went wrong** while processing your dice duel. Please try again later.\n-# **Error:** ${error.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    }
  }
};