import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} from 'discord.js';

import {
  Helper
} from '../../../helper.js';

/**
* Simulate a "Roulette" style game:
* 1) Player challenges another user or the bot (kasiko) if no mention is provided.
* 2) Both players agree on the bet and bullet count (via select menu).
* 3) We load bullets randomly into a 6-chamber revolver.
* 4) The cylinder is spun, then each player "fires" in turn until someone loses.
*/
export async function rouletteGame(challengerId, opponentId, betAmount, channel) {
  try {
    // 1) Validate bet
    betAmount = parseInt(betAmount, 10);
    if (isNaN(betAmount) || betAmount < 1) {
      return channel.send('⚠️ Please enter a valid bet amount (minimum 1).');
    }
    if (betAmount > 1000000) {
      return channel.send('⚠️ The maximum bet for roulette is <:kasiko_coin:1300141236841086977> 1,000,000. Please lower your bet.');
    }

    // 2) Determine the opponent (either a real user or the bot if no mention/invalid)
    let isBotOpponent = false;
    let opponentMember;
    try {
      opponentMember = await channel.guild.members.fetch(opponentId);
    } catch {
      // If we fail to fetch, treat as bot opponent
      isBotOpponent = true;
    }

    // If the ID is the same as the challenger’s ID, automatically use the bot
    if (challengerId === opponentId) {
      isBotOpponent = true;
    }

    // Attempt to fetch user data for challenger
    let challengerMember;
    try {
      challengerMember = await channel.guild.members.fetch(challengerId);
    } catch (err) {
      console.error('[Roulette] Error fetching challenger:', err);
      return channel.send('🚨 **Error**: Unable to retrieve challenger data. Please try again.');
    }

    // If the opponent is the bot, define some placeholders
    let opponentUsername = 'kasiko';
    let opponentUserId = '1300081477358452756'; // You can define or use any ID placeholder as your 'bot user ID'.

    if (!isBotOpponent) {
      opponentUsername = opponentMember.user.username;
      opponentUserId = opponentMember.id;
    }

    // 3) Get user data from DB
    let challengerData,
    opponentData;
    try {
      challengerData = await getUserData(challengerId);
      if (!isBotOpponent) {
        opponentData = await getUserData(opponentUserId);
      }
    } catch (error) {
      console.error('[Roulette] Error fetching user data:', error);
      return channel.send('🚨 **Error**: Problem retrieving user data. Please try again later.');
    }

    // If the opponent is not the bot, check if the opponent data is valid
    if (!isBotOpponent && !opponentData) {
      return channel.send(`🚨 **Error**: Could not retrieve data for **${opponentUsername}**. Please try again.`);
    }

    // 4) Check balances
    if (challengerData.cash < betAmount) {
      return channel.send(`⚠️ **${challengerMember.user.username}** doesn't have enough cash to bet <:kasiko_coin:1300141236841086977> **${betAmount}**.`);
    }
    if (!isBotOpponent && opponentData.cash < betAmount) {
      return channel.send(`⚠️ **${opponentUsername}** doesn't have enough cash to bet <:kasiko_coin:1300141236841086977> **${betAmount}**.`);
    }

    // 5) Ask the challenger to select the number of bullets (1–6) via a select menu
    const bulletSelectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
      .setCustomId('select_bullet_count')
      .setPlaceholder('Select number of bullets (1–6)')
      .addOptions([{
        label: '1 bullet', value: '1'
      },
        {
          label: '2 bullets', value: '2'
        },
        {
          label: '3 bullets', value: '3'
        },
        {
          label: '4 bullets', value: '4'
        },
        {
          label: '5 bullets', value: '5'
        },
        {
          label: '6 bullets', value: '6'
        },
      ])
    );

    const gunEmoji = "<:roulette_gun1:1325709544357101660>"
    const cylEmoji = "<:roulette_gc:1325709653421850624>"
    const rubBulletEmoji = "<:rubber_bullet:1325711925656686626>"

    let gameMsg = await channel.send({
      content: `${gunEmoji} **${challengerMember.user.username}** has challenged **${isBotOpponent ? 'kasiko (bot)': `<@${opponentMember.user.id}>`}** to **Roulette** for <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**!\n\n${cylEmoji} Please choose the number of ${rubBulletEmoji} bullets to load in the revolver (1–6).`,
      components: [bulletSelectRow]
    });

    // Filter for the bullet count select menu. Only the challenger can pick bullets.
    const selectFilter = (i) =>
    i.user.id === challengerId && i.customId === 'select_bullet_count';

    const selectCollector = gameMsg.createMessageComponentCollector({
      filter: selectFilter,
      max: 1,
      time: 30000 // 30 seconds
    });

    selectCollector.on('collect', async (interaction) => {
      const bulletCount = parseInt(interaction.values[0], 10);

      // Disable the select menu after selection
      const disabledRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
        .setCustomId('select_bullet_count')
        .setDisabled(true)
        .setPlaceholder(`Selected bullets: ${bulletCount}`)
        .addOptions([{
          label: '1 bullet', value: '1'
        },
          {
            label: '2 bullets', value: '2'
          },
          {
            label: '3 bullets', value: '3'
          },
          {
            label: '4 bullets', value: '4'
          },
          {
            label: '5 bullets', value: '5'
          },
          {
            label: '6 bullets', value: '6'
          },
        ])
      );

      await interaction.update({
        components: [disabledRow]
      });

      // Next: ask the opponent (if not bot) to confirm or decline
      if (!isBotOpponent) {
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId('roulette_accept')
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
          .setCustomId('roulette_decline')
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
        );

        gameMsg = await channel.send({
          content: `**${opponentUsername}**, do you accept the ${gunEmoji} Roulette challenge with ${rubBulletEmoji} **${bulletCount} bullet(s)** at stake for <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}** 𝑪𝒂𝒔𝒉?`,
          components: [confirmRow]
        });

        const confirmFilter = (i) =>
        i.user.id === opponentMember.user.id &&
        (i.customId === 'roulette_accept' || i.customId === 'roulette_decline');

        const confirmCollector = gameMsg.createMessageComponentCollector({
          filter: confirmFilter,
          max: 1,
          time: 30000 // 30 seconds to respond
        });

        confirmCollector.on('collect', async (btnInteraction) => {
          if (btnInteraction.customId === 'roulette_decline') {
            await btnInteraction.update({
              content: `❌ **${opponentUsername}** has declined the roulette challenge.`,
              components: []
            });
            return; // end
          }

          // Opponent accepted
          await btnInteraction.update({
            components: []
          });
          startRoulette(
            challengerMember,
            opponentMember,
            betAmount,
            bulletCount,
            channel,
            false,
            gameMsg
          );
        });

        confirmCollector.on('end',
          async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
              await gameMsg.edit({
                content: `⏳ Time’s up! **${opponentUsername}** did not respond to the challenge.`,
                components: []
              });
            }
          });
      } else {
        // If it's the bot, auto-accept
        startRoulette(
          challengerMember,
          {
            user: {
              id: opponentUserId, username: opponentUsername
            }
          },
          betAmount,
          bulletCount,
          channel,
          true // isBot = true
        );
      }
    });

    selectCollector.on('end',
      async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await gameMsg.edit({
            content: '⏳ Time’s up! No bullet selection was made.',
            components: []
          });
        }
      });

  } catch (e) {
    console.error('[Roulette] Error in rouletteGame:',
      e);
    return channel.send('🚨 **Error**: Something went wrong starting the roulette game.');
  }
}

// ------------------------------------------------------------------
//                          Helper function
// ------------------------------------------------------------------

/**
* Actually start the game logic once both players accept and bullet count is chosen.
*/
async function startRoulette(
  challengerMember,
  opponentMember,
  betAmount,
  bulletCount,
  channel,
  isBotOpponent = false, gameMsgInitial = null
) {
  // 1) Prepare initial message
  let gameMsg;
  const gunEmoji = "<:roulette_gun1:1325709544357101660>"
  const cylEmoji = "<:roulette_gc:1325709653421850624>"
  const rubBulletEmoji = "<:rubber_bullet:1325711925656686626>"

  try {
    if (gameMsgInitial) {
      gameMsg = gameMsgInitial;
      gameMsg = await gameMsgInitial.edit(
        `${gunEmoji} **Roulette is starting!**\n\n**${challengerMember.user.username}** vs **${opponentMember.user.username}**\n` +
        `${rubBulletEmoji} Bullets loaded: **${bulletCount}** / 6\nBet: <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**`
      );
    } else {
      gameMsg = await channel.send(
        `${gunEmoji} **Roulette is starting!**\n\n**${challengerMember.user.username}** vs **${opponentMember.user.username}**\n` +
        `${rubBulletEmoji} Bullets loaded: **${bulletCount}** / 6\nBet: <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**`
      );
    }
  } catch (err) {
    console.error('[Roulette] Error sending game start message:',
      err);
    return;
  }

  // 2) Load bullets randomly into a 6-chamber cylinder
  //    Example: array of 6 booleans, bulletCount of them = true
  let chambers = Array(6).fill(false);
  for (let i = 0; i < bulletCount; i++) {
    let placed = false;
    while (!placed) {
      const index = Helper.randomInt(0, 5);
      if (!chambers[index]) {
        chambers[index] = true;
        placed = true;
      }
    }
  }

  // 3) Spin the cylinder (pick a random starting index)
  let currentIndex = Helper.randomInt(0, 5);

  // 4) Prepare turn order
  let turn = 0; // 0 => challenger’s turn, 1 => opponent’s turn
  const players = [{
    member: challengerMember,
    userId: challengerMember.user.id
  },
    {
      member: opponentMember,
      userId: opponentMember.user.id
    }];

  // Keep firing until one is shot
  let isGameOver = false;
  let winnerId = null;
  let loserId = null;
  let shotChamber = null;
  
  let roundMsg = channel.send(`The game is about to begin.`)

  // We'll allow up to 12 total shots (just in case it cycles multiple times)
  // But realistically, you won't go more than 6 in normal roulette logic
  for (let i = 0; i < 12; i++) {
    // Current shooter
    if (!roundMsg) continue;
    const shooter = players[turn];
    // Check chamber
    const hasBullet = chambers[currentIndex];

    // Send a short "firing" message
    await roundMsg.edit(`${gunEmoji}💨 **${shooter.member.user.username}** fires...`);

    if (hasBullet) {
      // BANG! Shooter is shot
      isGameOver = true;
      loserId = shooter.userId;
      // The other player is the winner
      winnerId = turn === 0 ? players[1].userId: players[0].userId;
      shotChamber = currentIndex + 1; // Just for display
      break;
    } else {
      // Click! No bullet
      await roundMsg.edit(`${cylEmoji} Click! No bullet ${rubBulletEmoji} in chamber ${currentIndex + 1}.`);
    }

    // Move to next chamber
    currentIndex = (currentIndex + 1) % 6;
    // Switch turn
    turn = turn === 0 ? 1: 0;
    // Slight pause for realism
    await Helper.wait(2000);
  }

  if (!isGameOver) {
    // If all chambers fired and no bullet triggered (very unlikely if bulletCount > 0),
    // treat as a draw or you can repeat. For simplicity, call it a "draw".
    return channel.send(`${gunEmoji} **Incredible!** No one was shot. The game ends in a draw.`);
  }

  // 5) We have a winner and loser
  //    Deduct bet from loser, add bet to winner
  let loserData,
  winnerData;
  try {
    loserData = await getUserData(loserId);
    winnerData = await getUserData(winnerId);
  } catch (e) {
    console.error('[Roulette] Error fetching user data at end:', e);
    return channel.send('🚨 **Error**: Couldn’t fetch user data at the end of the match.');
  }

  // If the loser was the bot, that implies "bot" has infinite or some artificial data
  // For simplicity, do not adjust if the bot lost, or you can handle it differently
  if (!isBotOpponent || (isBotOpponent && loserId !== 'BOT_ID')) {
    // Only do normal updates if the loser is a real user
    loserData.cash = Math.max(0, loserData.cash - betAmount);
    await updateUser(loserId, loserData);
  }

  if (!isBotOpponent || (isBotOpponent && winnerId !== 'BOT_ID')) {
    // Only do normal updates if the winner is a real user
    winnerData.cash += betAmount;
    await updateUser(winnerId, winnerData);
  }

  // 6) Announce final result
  const winnerName =
  winnerId === challengerMember.user.id
  ? challengerMember.user.username: opponentMember.user.username;
  const loserName =
  loserId === challengerMember.user.id
  ? challengerMember.user.username: opponentMember.user.username;

  return channel.send(
    `💥${gunEmoji} **BANG!** ${cylEmoji} Chamber **${shotChamber}** had a bullet! ${rubBulletEmoji}\n` +
    `- **${loserName}** got shot and loses  <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}** 💸\n` +
    `- **${winnerName}** survives and earns  <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**!`
  );
}

// ------------------------------------------------------------------
//                     Command Export for your bot
// ------------------------------------------------------------------

export default {
  name: 'roulette',
  description: 'Challenge another player (or the bot) to a game of roulette. Bet your cash, load the revolver, and fire until someone loses!',
  aliases: ['rr',
    'shot'],
  args: '<amount> <opponent_mention_or_id>',
  example: ['roulette 10000  @Player'],
  related: ['diceduel',
    'slots',
    'cash',
    'tosscoin',
    'guess'],
  cooldown: 8000,
  // 8 seconds
  category: '🎲 Games',

  execute: async (args, message) => {
    // 1) Parse arguments
    let opponentId = args[2] ? args[2].replace(/[<@!>]/g, ''): null; // Opponent user ID
    let bet = parseInt(args[1], 10);

    if (isNaN(bet) || bet < 1) {
      return message.channel.send('⚠️ You must specify a valid bet amount. `roulette <amount>  @opponent`');
    }

    // If no valid opponent ID provided, we set the game to fight the bot
    if (!opponentId || !/^\d+$/.test(opponentId)) {
      return message.channel.send('⚠️ You must specify a valid bet amount. `roulette <amount>  @opponent`');
      opponentId = '1300081477358452756'; // "bot ID" or a placeholder
    }

    // 2) Start the roulette game
    rouletteGame(message.author.id, opponentId, bet, message.channel);
  }
};