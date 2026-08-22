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
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';

export async function diceDuel(id, opponentId, amount, context) {
  try {
    amount = parseInt(amount, 10);

    if (isNaN(amount) || amount < 1) {
      return await handleMessage(context, `⚠️ Please enter a valid integer amount of 𝑪𝒂𝒔𝒉 for **diceduel**!`);
    }

    // Resolve users safely (works in DMs and Guilds)
    const client = context.client || context.channel?.client;
    const invokerUser = await client?.users?.fetch(id).catch(() => null) || { username: 'Challenger', id };
    const opponentUser = await client?.users?.fetch(opponentId).catch(() => null) || { username: 'Opponent', id: opponentId };

    // Fetch user data with error handling
    let userData, opponentData;
    try {
      userData = await getUserData(id);
      opponentData = await getUserData(opponentId);
    } catch (e) {
      console.error("Error fetching user data in dice duel:", e);
      return await handleMessage(context, '🚨 **Error!** There was an issue retrieving user data. Please try again later.');
    }

    if (!userData || !opponentData) {
      return await handleMessage(context, '🚨 **Error!** One or both players do not have registered accounts.');
    }

    // Check if both players have enough balance to proceed
    if (userData.cash < amount) {
      return await handleMessage(context, `⚠️ **${invokerUser.username}** doesn't have enough <:kasiko_coin:1300141236841086977> cash to bet. Please check your balance with \`cash\` and try again.`);
    } else if (opponentData.cash < amount) {
      return await handleMessage(context, `⚠️ **${opponentUser.username}** doesn't have enough <:kasiko_coin:1300141236841086977> cash to match the bet.`);
    }

    // Create a challenge message and button (only the opponent gets a button to roll)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('start_roll_opponent')
        .setLabel('Roll Dice (Opponent)')
        .setStyle(ButtonStyle.Primary)
    );

    const duelMessage = await handleMessage(context, {
      content: `🎲 **${invokerUser.username}** has challenged **<@${opponentUser.id}>** to a Dice Duel for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** 𝑪𝒂𝒔𝒉!\n\nClick the button to roll the dice!`,
      components: [row]
    });

    if (!duelMessage?.createMessageComponentCollector) return;

    // Filter to only accept the opponent's interaction
    const filter = (interaction) => {
      return interaction.user.id === opponentId && interaction.customId === 'start_roll_opponent';
    };

    const collector = duelMessage.createMessageComponentCollector({
      filter,
      time: 25000,
      max: 1
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
        await interaction.update({
          components: [disabledRow]
        }).catch(() => {});

        let rollingMessage = duelMessage;

        // Re-verify balances right before the game begins to prevent race conditions
        const freshChallenger = await getUserData(id);
        const freshOpponent = await getUserData(opponentId);

        if (!freshChallenger || freshChallenger.cash < amount || !freshOpponent || freshOpponent.cash < amount) {
          if (rollingMessage?.edit) {
            return await rollingMessage.edit({
              content: `⚠️ Duel cancelled: One or both players no longer have sufficient balance for this bet.`,
              components: []
            }).catch(() => {});
          }
          return;
        }

        // Simulate rolling dice
        let animation = ['🎲', '🎲'];
        if (rollingMessage?.edit) {
          await rollingMessage.edit({
            content: `🎲 **𝑻𝒉𝒆 𝒅𝒊𝒄𝒆 𝒂𝒓𝒆 𝒓𝒐𝒍𝒍𝒊𝒏𝒈... 𝑯𝒐𝒍𝒅 𝒚𝒐𝒖𝒓 𝒃𝒓𝒆𝒂𝒕𝒉!**\n\n**${invokerUser.username}** vs **${opponentUser.username}**\n${animation.join(' | ')}`,
            components: [disabledRow]
          }).catch(() => {});
        }

        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 600));
          animation = [Helper.randomInt(1, 6), Helper.randomInt(1, 6)];
          if (rollingMessage?.edit) {
            await rollingMessage.edit({
              content: `🎲 **𝑻𝒉𝒆 𝒅𝒊𝒄𝒆 𝒂𝒓𝒆 𝒓𝒐𝒍𝒍𝒊𝒏𝒈...**\n\n**${invokerUser.username}** vs **${opponentUser.username}**\n${animation.join(' | ')}`,
              components: [disabledRow]
            }).catch(() => {});
          }
        }

        // Final rolls
        const userRoll = Helper.randomInt(1, 6);
        const opponentRoll = Helper.randomInt(1, 6);

        if (userRoll === opponentRoll) {
          if (rollingMessage?.edit) {
            return await rollingMessage.edit({
              content: `🎲 **It's a tie!** Both players rolled **${userRoll}**.\nNo cash was lost.`,
              components: []
            }).catch(() => {});
          }
          return;
        }

        const isUserWinner = userRoll > opponentRoll;
        const winnerId = isUserWinner ? id : opponentId;
        const loserId = isUserWinner ? opponentId : id;
        const winnerName = isUserWinner ? invokerUser.username : opponentUser.username;
        const loserName = isUserWinner ? opponentUser.username : invokerUser.username;

        // Atomically update balances
        const freshWinner = await getUserData(winnerId);
        const freshLoser = await getUserData(loserId);

        await updateUser(winnerId, { cash: Number(freshWinner?.cash || 0) + amount });
        await updateUser(loserId, { cash: Math.max(0, Number(freshLoser?.cash || 0) - amount) });

        if (rollingMessage?.edit) {
          await rollingMessage.edit({
            content: `🎲 **ᗪIᑕE ᗪᑌEᒪ Results**\n\n` +
              `✨ **${winnerName}** emerges victorious and wins <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash!\n` +
              `💔 **${loserName}** lost <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.\n\n` +
              `🎲 **Rolls**:\n` +
              `• **${invokerUser.username}**: **${userRoll}**\n` +
              `• **${opponentUser.username}**: **${opponentRoll}**`,
            components: []
          }).catch(() => {});
        }
      } catch (error) {
        console.error("Error In Diceduel interaction:", error);
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        if (duelMessage?.edit) {
          await duelMessage.edit({
            content: '⏳ **Time’s up!** The duel timed out because the opponent didn’t roll in time.',
            components: []
          }).catch(() => {});
        }
      }
    });

  } catch (e) {
    console.error('DiceDuel Global Error:', e);
    return await handleMessage(context, '⚠️ An unexpected error occurred while processing the dice duel.');
  }
}

export default {
  name: "diceduel",
  description: "Challenge another player to a dice duel and bet your cash.",
  aliases: ["dd"],
  args: "<@user|userID> <amount>",
  example: ["diceduel @user 500", "dd 123456789012345678 1000"],
  cooldown: 10000,
  category: "🎲 Games",

  execute: async (args, message) => {
    try {
      const { id: authorId } = discordUser(message);
      const opponentId = args[1] ? args[1].replace(/[<@!>]/g, '') : null;

      if (!opponentId || !/^\d+$/.test(opponentId)) {
        return await handleMessage(message, `ⓘ Please mention a **valid opponent** or provide their **user ID**.\n**Usage:** \`diceduel @user <amount>\``);
      }

      if (authorId === opponentId) {
        return await handleMessage(message, `⚠️ You **cannot** challenge yourself to a dice duel.`);
      }

      const amount = parseInt(args[2] || 1, 10);

      if (isNaN(amount) || amount < 1) {
        return await handleMessage(message, `⚠️ The **minimum bet** is <:kasiko_coin:1300141236841086977> **1**.`);
      }

      if (amount > 200000) {
        return await handleMessage(message, `⚠️ The **maximum bet** allowed is <:kasiko_coin:1300141236841086977> **200,000**.`);
      }

      await diceDuel(authorId, opponentId, amount, message);
    } catch (error) {
      console.error(`DiceDuel Execute Error: ${error}`);
      return await handleMessage(message, `⚠️ Something **went wrong** while processing your dice duel. Please try again later.`);
    }
  }
};