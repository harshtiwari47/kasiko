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
  Helper
} from '../../../helper.js';

export async function rockPaperScissors(id, opponentId, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    const opponent = await channel.guild.members.fetch(opponentId);

    // Fetch user data
    let userData,
    opponentData;
    try {
      userData = await getUserData(id);
      opponentData = await getUserData(opponentId);
    } catch (e) {
      return channel.send('🚨 **Error!** There was an issue retrieving user data.').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    if (amount === "all") amount = userData.cash;

    // Validate balances
    if (userData.cash < amount) {
      return channel.send(`⚠️ **${guild.user.username}** doesn't have enough cash to bet.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    if (opponentData.cash < amount) {
      return channel.send(`⚠️ **${opponent.user.username}** doesn't have enough cash to play.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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

    const gameMessage = await channel.send({
      content: `✂️ **${guild.user.username}** challenges **${opponent.user.username}** to Rock Paper Scissors for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**!\n\nBoth players choose your move!`,
      components: [buttons]
    });

    let playerChoice = {};
    const collector = gameMessage.createMessageComponentCollector({
      filter: i => [id, opponentId].includes(i.user.id) && i.customId.startsWith('rps_'),
      time: 30000,
      max: 2
    });

    collector.on('collect', async i => {
      try {
        if (playerChoice[i.user.id]) {
          await i.deferUpdate();
          return;
        }

        playerChoice[i.user.id] = i.customId.split('_')[1];
        await i.deferUpdate();

        if (Object.keys(playerChoice).length === 2) {
          collector.stop();
        }
      } catch (e) {}
    });

    collector.on('end',
      async () => {
        try {
          if (!gameMessage || !gameMessage?.edit) return;
          await gameMessage.edit({
            components: []
          });

          const challengerChoice = playerChoice[id];
          const opponentChoice = playerChoice[opponentId];

          if (!challengerChoice || !opponentChoice) {
            return gameMessage.edit('⏳ Game cancelled - both players need to choose!').catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          // Determine winner
          const result = Helper.determineRPSWinner(challengerChoice, opponentChoice);
          let content = `**${guild.user.username}** chose ${challengerChoice}\n` +
          `**${opponent.user.username}** chose ${opponentChoice}\n\n`;

          if (result === 'tie') {
            content += "✨ It's a tie! No cash exchanged.";
          } else {
            const winnerId = result === 'challenger' ? id: opponentId;
            const loserId = result === 'challenger' ? opponentId: id;
            const winner = result === 'challenger' ? guild.user: opponent.user;

            // Update balances
            const [winnerData,
              loserData] = await Promise.all([
                getUserData(winnerId),
                getUserData(loserId)
              ]);

            winnerData.cash += amount;
            loserData.cash -= amount;

            await Promise.all([
              updateUser(winnerId, {
                cash: winnerData.cash
              }),
              updateUser(loserId, {
                cash: loserData.cash
              })
            ]);

            content += `🎉 **${winner.username}** wins <:kasiko_coin:1300141236841086977> ${amount.toLocaleString()} cash!`;
          }
          await gameMessage.edit(content);
        } catch (e) {
          if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
            console.error(e);
          }
          await channel.send(`ⓘ Oops! Something went wrong during rps game. Please try again!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      });

  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return channel.send(`ⓘ Oops! Something went wrong during your rps game. Please try again!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "rps",
  description: "Challenge someone to Rock Paper Scissors!",
  aliases: ["rockpaperscissors"],
  args: "@opponent <amount>",
  example: ["rps @user 500"],
  related: ["diceduel",
    "slots",
    "cash"],
  cooldown: 10000,
  emoji: "✂️",
  category: "🎲 Games",
  execute: (args,
    message) => {
    try {
      const opponentId = args[1]?.replace(/[<@!>]/g,
        '');

      if (!opponentId || !/^\d+$/.test(opponentId)) {
        return message.channel.send("⚠️ Invalid opponent. Usage: `rps @user <amount>`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
      if (message.author.id === opponentId) {
        return message.channel.send("⚠️ You can't play against yourself.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let amount;

      if (args[2] && args[2] !== "all") {
        if (isNaN(amount)) {
          return message.channel.send(`⚠️ Please enter a valid integer amount of 𝑪𝒂𝒔𝒉 for **rps**!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
        amount = parseInt(args[2]);
        if (amount < 1 || amount > 200000) {
          return message.channel.send("⚠️ Bet must be between 1 and 200,000 cash.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      } else if (args[2] && args[2] === "all") {
        amount = "all";
      } else {
        amount = 1;
      }

      rockPaperScissors(message.author.id, opponentId, amount, message.channel);
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  }
};