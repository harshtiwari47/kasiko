import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import {
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';

export async function rockPaperScissors(id, opponentId, amount, context) {
  try {
    const client = context.client || context.channel?.client;
    const invokerUser = await client?.users?.fetch(id).catch(() => null) || { username: 'Challenger', id };
    const opponentUser = await client?.users?.fetch(opponentId).catch(() => null) || { username: 'Opponent', id: opponentId };

    // Fetch user data
    let userData, opponentData;
    try {
      userData = await getUserData(id);
      opponentData = await getUserData(opponentId);
    } catch (e) {
      return await handleMessage(context, '🚨 **Error!** There was an issue retrieving user data.');
    }

    if (!userData || !opponentData) {
      return await handleMessage(context, '🚨 **Error!** One or both players do not have registered accounts.');
    }

    if (amount === "all") amount = Number(userData.cash || 0);
    amount = parseInt(amount, 10);

    if (isNaN(amount) || amount < 1) {
      return await handleMessage(context, `⚠️ Invalid bet amount for RPS.`);
    }

    // Validate balances
    if (userData.cash < amount) {
      return await handleMessage(context, `⚠️ **${invokerUser.username}** doesn't have enough cash to bet.`);
    }
    if (opponentData.cash < amount) {
      return await handleMessage(context, `⚠️ **${opponentUser.username}** doesn't have enough cash to play.`);
    }

    // Create game buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('rps_rock')
        .setLabel('🪨 Rock')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('rps_paper')
        .setLabel('📄 Paper')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('rps_scissors')
        .setLabel('✂️ Scissors')
        .setStyle(ButtonStyle.Danger)
    );

    const gameMessage = await handleMessage(context, {
      content: `✂️ **${invokerUser.username}** challenges **${opponentUser.username}** to Rock Paper Scissors for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**!\n\nBoth players choose your move!`,
      components: [buttons]
    });

    if (!gameMessage?.createMessageComponentCollector) return;

    let playerChoice = {};
    const collector = gameMessage.createMessageComponentCollector({
      filter: i => [id, opponentId].includes(i.user.id) && i.customId.startsWith('rps_'),
      time: 30000,
      max: 2
    });

    collector.on('collect', async i => {
      try {
        if (playerChoice[i.user.id]) {
          await i.deferUpdate().catch(() => {});
          return;
        }

        playerChoice[i.user.id] = i.customId.split('_')[1];
        await i.deferUpdate().catch(() => {});

        if (Object.keys(playerChoice).length === 2) {
          collector.stop('both_selected');
        }
      } catch (e) {}
    });

    collector.on('end', async (collected, reason) => {
      try {
        if (gameMessage?.edit) {
          await gameMessage.edit({ components: [] }).catch(() => {});
        }

        const challengerChoice = playerChoice[id];
        const opponentChoice = playerChoice[opponentId];

        if (!challengerChoice || !opponentChoice) {
          if (gameMessage?.edit) {
            return await gameMessage.edit({
              content: '⏳ Game cancelled - both players need to make a choice in time!',
              components: []
            }).catch(() => {});
          }
          return;
        }

        // Determine winner
        const result = Helper.determineRPSWinner(challengerChoice, opponentChoice);
        let content = `• **${invokerUser.username}** chose **${challengerChoice}**\n` +
          `• **${opponentUser.username}** chose **${opponentChoice}**\n\n`;

        if (result === 'tie') {
          content += "✨ It's a tie! No cash exchanged.";
        } else {
          const isChallengerWinner = result === 'challenger';
          const winnerId = isChallengerWinner ? id : opponentId;
          const loserId = isChallengerWinner ? opponentId : id;
          const winnerName = isChallengerWinner ? invokerUser.username : opponentUser.username;

          // Re-fetch fresh balances before updating
          const freshWinner = await getUserData(winnerId);
          const freshLoser = await getUserData(loserId);

          await updateUser(winnerId, { cash: Number(freshWinner?.cash || 0) + amount });
          await updateUser(loserId, { cash: Math.max(0, Number(freshLoser?.cash || 0) - amount) });

          content += `🎉 **${winnerName}** wins <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash!`;
        }

        if (gameMessage?.edit) {
          await gameMessage.edit({ content, components: [] }).catch(() => {});
        }
      } catch (e) {
        console.error('RPS Resolution Error:', e);
      }
    });

  } catch (e) {
    console.error('RPS Global Error:', e);
    return await handleMessage(context, `ⓘ Oops! Something went wrong during your RPS game.`);
  }
}

export default {
  name: "rps",
  description: "Challenge someone to Rock Paper Scissors!",
  aliases: ["rockpaperscissors"],
  args: "<@opponent|userID> <amount>",
  example: ["rps @user 500", "rps 123456789012345678 1000"],
  related: ["diceduel", "slots", "cash"],
  cooldown: 10000,
  emoji: "✂️",
  category: "🎲 Games",

  execute: async (args, message) => {
    try {
      const { id: authorId } = discordUser(message);
      const opponentId = args[1] ? args[1].replace(/[<@!>]/g, '') : null;

      if (!opponentId || !/^\d+$/.test(opponentId)) {
        return await handleMessage(message, "⚠️ Invalid opponent. Usage: `rps @user <amount>`");
      }

      if (authorId === opponentId) {
        return await handleMessage(message, "⚠️ You can't play against yourself.");
      }

      let amount;
      if (args[2] === "all") {
        amount = "all";
      } else if (args[2]) {
        amount = parseInt(args[2], 10);
        if (isNaN(amount) || amount < 1 || amount > 200000) {
          return await handleMessage(message, "⚠️ Bet must be an integer between 1 and 200,000 cash.");
        }
      } else {
        amount = 1;
      }

      await rockPaperScissors(authorId, opponentId, amount, message);
    } catch (e) {
      console.error('RPS Execute Error:', e);
    }
  }
};