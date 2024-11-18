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
      return channel.send('🚨 **Error!** There was an issue retrieving user data. Please try again later.');
    }

    // Check if both players have enough balance to proceed
    if (userData.cash < amount) {
      return channel.send(`⚠️ You don't have enough <:kasiko_coin:1300141236841086977> cash to bet. Please check your balance with \`!balance\` and try again.`);
    } else if (opponentData.cash < amount) {
      return channel.send(`⚠️ Your opponent doesn't have enough <:kasiko_coin:1300141236841086977> cash. Ask them to check their balance.`);
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
      content: `🎲 **${guild.user.username}** has challenged **<@${opponent.user.id}>** to a Dice Duel for <:kasiko_coin:1300141236841086977> **${amount}** 𝑪𝒂𝒔𝒉!\n\nClick the button to roll the dice!`,
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

      // Immediately disable the button to prevent further interaction


      await interaction.update({
        components: [disabledRow]
      });

      await duelMessage.edit({
        components: [disabledRow]
      });

      // Simulate the rolling dice animation
      let animation = ['🎲', '🎲', '🎲'];
      let rollingMessage;
      try {
        rollingMessage = await duelMessage.edit(
          `🎲 **𝑹𝒐𝒍𝒍𝒊𝒏𝒈 𝒕𝒉𝒆 𝒅𝒊𝒄𝒆... 𝑳𝒆𝒕'𝒔 𝒔𝒆𝒆 𝒘𝒉𝒐 𝒍𝒖𝒄𝒌 𝒇𝒂𝒗𝒐𝒓𝒔!**\n\n` +
          `**${guild.user.username}** vs **${opponent.user.username}**\n` +
          `${animation.join(' | ')}`
        );
      } catch (e) {
        console.error('Error during dice roll:', e);
        return channel.send('🚨 **Error!** There was an issue while rolling the dice. Please try again.');
      }

      // Simulate dice rolls
      for (let i = 0; i < 5; i++) {
        animation = [Helper.randomInt(1, 6),
          Helper.randomInt(1, 6)];
        await rollingMessage.edit(
          `🎲 **𝑻𝒉𝒆 𝒅𝒊𝒄𝒆 𝒂𝒓𝒆 𝒓𝒐𝒍𝒍𝒊𝒏𝒈... 𝑯𝒐𝒍𝒅 𝒚𝒐𝒖𝒓 𝒃𝒓𝒆𝒂𝒕𝒉!**\n\n` +
          `**${guild.user.username}** vs **${opponent.user.username}**\n` +
          `${animation.join(' | ')}`
        );
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between rolls
      }

      // Final roll
      let userRoll = Helper.randomInt(1, 6);
      let opponentRoll = Helper.randomInt(1, 6);

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
        );
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
        return channel.send('🚨 **Error!** There was an issue retrieving user data after the game. Please try again later.');
      }

      // Ensure both users have valid data before continuing
      if (!winnerData || !loserData) {
        return channel.send('🚨 **Error!** One or both players have invalid data. Please try again.');
      }

      // Update user data after the game
      winnerData.cash += winAmount;
      loserData.cash -= winAmount;

      try {
        await updateUser(winner, winnerData);
        await updateUser(loser, loserData);
      } catch (e) {
        console.error('Error updating user data:', e);
        return channel.send('🚨 **Error!** There was an issue updating user data. Please try again later.');
      }

      // Final message after the game
      return rollingMessage.edit(
        `🎲 **ᗪIᑕE ᗪᑌEᒪ  Results**\n` +
        `✨ **${guild.user.username}** emerges victorious and earns **${winAmount} coins**!\n` +
        `💔 **${opponent.user.username}** loses **${winAmount} coins**.\n` +
        `🎲 Rolls:\n` +
        `- **${guild.user.username}**: **${userRoll}**\n` +
        `- **${opponent.user.username}**: **${opponentRoll}**`
      );
    });

    collector.on('end',
      (collected, reason) => {
        // If no interaction or timeout
        if (reason === 'time') {
          duelMessage.edit({
            content: '⏳ **Time’s up!** The duel timed out because your opponent didn’t interact in time.',
            components: [] // Removes all components
          });
        }
      });

  } catch (e) {
    console.error("Error in dice duel:",
      e);
    return channel.send("🚨 **Error!** Something went wrong while starting the dice duel. Please check the command format and try again.");
  }
}

export default {
  name: "diceduel",
  description: "Challenge another player to a thrilling dice duel! Bet an amount of your in-game currency and roll the dice to see who wins. The player with the higher roll claims the prize. Test your luck and strategy in this exciting game of chance!",
  aliases: ["dice", "dd", "diceduel"],
  args: "<subcommand> <opponent_id> <amount>",
  example: ["dice @opponent 500"],
  related: ["gamble", "cash", "games"],
  cooldown: 3000, // 3 seconds cooldown
  category: "Games",

  // Main function to execute the dice duel logic
  execute: (args,
    message) => {
    // Validate opponent mention or ID
    const opponentId = args[1].replace(/[<@!>]/g,
      ''); // Get opponent ID

    if (!opponentId || !/^\d+$/.test(opponentId)) {
      return message.channel.send("⚠️ Invalid opponent ID or mention. Please mention a valid user or provide their user ID.");
    }

    const amount = parseInt(args[2]);

    // Validate the amount
    if (amount < 250) {
      return message.channel.send("⚠️ Minimum bet amount is 250. Please increase your bet.");
    }

    if (message.author.id === opponentId) {
      return message.channel.send("⚠️ You cannot play against yourself.");
    }

    // Call the dice duel function
    diceDuel(message.author.id, opponentId, amount, message.channel);
  }
};