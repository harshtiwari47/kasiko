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
  Helper,
  handleMessage,
  discordUser
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
      return handleMessage(channel, '⚠️ Please enter a valid bet amount (minimum 1).');
    }
    if (betAmount > 1000000) {
      return handleMessage(channel, '⚠️ The maximum bet for roulette is <:kasiko_coin:1300141236841086977> 1,000,000. Please lower your bet.');
    }

    // 2) Determine the opponent (either a real user or the bot if no mention/invalid)
    let isBotOpponent = false;
    let opponentMember = null;
    try {
      if (channel.guild?.members?.fetch && opponentId) {
        opponentMember = await channel.guild.members.fetch(opponentId).catch(() => null);
      }
    } catch {
      isBotOpponent = true;
    }

    if (!opponentMember || opponentId === '1300081477358452756' || challengerId === opponentId) {
      isBotOpponent = true;
    }

    // Attempt to fetch user data for challenger
    let challengerMember = null;
    try {
      if (channel.guild?.members?.fetch) {
        challengerMember = await channel.guild.members.fetch(challengerId).catch(() => null);
      }
    } catch (err) {}

    const challengerUsername = challengerMember?.user?.username || channel.user?.username || channel.author?.username || 'Challenger';

    // If the opponent is the bot, define placeholders dynamically from client
    let opponentUsername = channel.client?.user?.username || 'kasiko';
    let opponentUserId = channel.client?.user?.id || '1300081477358452756';

    if (!isBotOpponent && opponentMember) {
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
      return handleMessage(channel, '🚨 **Error**: Problem retrieving user data. Please try again later.');
    }

    if (!challengerData) {
      return handleMessage(channel, '🚨 **Error**: Unable to retrieve challenger account data.');
    }

    if (!isBotOpponent && !opponentData) {
      return handleMessage(channel, `🚨 **Error**: Could not retrieve data for **${opponentUsername}**. Please try again.`);
    }

    // 4) Check balances
    if (challengerData.cash < betAmount) {
      return handleMessage(channel, `⚠️ **${challengerUsername}** doesn't have enough cash to bet <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**.`);
    }
    if (!isBotOpponent && opponentData.cash < betAmount) {
      return handleMessage(channel, `⚠️ **${opponentUsername}** doesn't have enough cash to bet <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**.`);
    }

    // 5) Ask the challenger to select the number of bullets (1–6) via a select menu
    const bulletSelectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
      .setCustomId('select_bullet_count')
      .setPlaceholder('Select number of bullets (1–6)')
      .addOptions([
        { label: '1 bullet', value: '1', description: '1/6 chance of shot each trigger pull' },
        { label: '2 bullets', value: '2', description: '2/6 chance of shot each trigger pull' },
        { label: '3 bullets', value: '3', description: '3/6 chance of shot each trigger pull' },
        { label: '4 bullets', value: '4', description: '4/6 chance of shot each trigger pull' },
        { label: '5 bullets', value: '5', description: '5/6 chance of shot each trigger pull' },
        { label: '6 bullets', value: '6', description: 'Instant shot on first trigger pull' }
      ])
    );

    const gunEmoji = "<:roulette_gun1:1325709544357101660>";
    const cylEmoji = "<:roulette_gc:1325709653421850624>";
    const rubBulletEmoji = "<:rubber_bullet:1325711925656686626>";

    let gameMsg = await handleMessage(channel, {
      content: `${gunEmoji} **${challengerUsername}** has challenged **${isBotOpponent ? 'kasiko (bot)': `<@${opponentUserId}>`}** to **Roulette** for <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}**!\n\n${cylEmoji} Please choose the number of ${rubBulletEmoji} bullets to load in the revolver (1–6).`,
      components: [bulletSelectRow]
    });

    const selectFilter = (i) =>
      i.user.id === challengerId && i.customId === 'select_bullet_count';

    const selectCollector = gameMsg?.createMessageComponentCollector ? gameMsg.createMessageComponentCollector({
      filter: selectFilter,
      max: 1,
      time: 60000
    }) : null;

    if (!selectCollector) return;

    selectCollector.on('collect', async (interaction) => {
      try {
        const bulletCount = parseInt(interaction.values[0], 10);
        await interaction.deferUpdate().catch(() => {});

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

          if (gameMsg?.edit) {
            await gameMsg.edit({
              content: `**${opponentUsername}**, do you accept the ${gunEmoji} Roulette challenge with ${rubBulletEmoji} **${bulletCount} bullet(s)** at stake for <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}** 𝑪𝒂𝒔𝒉?`,
              components: [confirmRow]
            }).catch(() => {});
          }

          const confirmFilter = (i) =>
            i.user.id === opponentUserId &&
            (i.customId === 'roulette_accept' || i.customId === 'roulette_decline');

          const confirmCollector = gameMsg?.createMessageComponentCollector ? gameMsg.createMessageComponentCollector({
            filter: confirmFilter,
            max: 1,
            time: 45000
          }) : null;

          if (!confirmCollector) return;

          confirmCollector.on('collect', async (btnInteraction) => {
            try {
              await btnInteraction.deferUpdate().catch(() => {});
              if (btnInteraction.customId === 'roulette_decline') {
                if (gameMsg?.edit) {
                  await gameMsg.edit({
                    content: `❌ **${opponentUsername}** has declined the roulette challenge.`,
                    components: []
                  }).catch(() => {});
                }
                return;
              }

              startRoulette(
                { id: challengerId, username: challengerUsername },
                { id: opponentUserId, username: opponentUsername },
                betAmount,
                bulletCount,
                channel,
                false,
                gameMsg
              );
            } catch (e) {
              console.error(e);
            }
          });

          confirmCollector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
              if (gameMsg?.edit) {
                await gameMsg.edit({
                  content: `⏳ Time’s up! **${opponentUsername}** did not respond to the challenge.`,
                  components: []
                }).catch(() => {});
              }
            }
          });
        } else {
          // If it's the bot, auto-accept and start immediately
          startRoulette(
            { id: challengerId, username: challengerUsername },
            { id: opponentUserId, username: opponentUsername },
            betAmount,
            bulletCount,
            channel,
            true,
            gameMsg
          );
        }
      } catch (e) {
        console.error(e);
      }
    });

    selectCollector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        try {
          if (gameMsg?.edit) {
            await gameMsg.edit({
              content: '⏳ Time’s up! No bullet selection was made.',
              components: []
            }).catch(() => {});
          }
        } catch (e) {}
      }
    });

  } catch (e) {
    console.error('[Roulette] Error in rouletteGame:', e);
    return handleMessage(channel, `ⓘ Something went wrong starting the roulette game.\n-# **Error**: ${e.message}`);
  }
}

// ------------------------------------------------------------------
//                          Helper function
// ------------------------------------------------------------------

/**
* Actually start the game logic once both players accept and bullet count is chosen.
*/
async function startRoulette(
  challenger,
  opponent,
  betAmount,
  bulletCount,
  channel,
  isBotOpponent = false,
  gameMsg = null
) {
  try {
    const gunEmoji = "<:roulette_gun1:1325709544357101660>";
    const cylEmoji = "<:roulette_gc:1325709653421850624>";
    const rubBulletEmoji = "<:rubber_bullet:1325711925656686626>";

    const startText = `**${gunEmoji} ROULETTE IS STARTING!**\n𖤍 **${challenger.username}** vs **${opponent.username}**\n` +
      `-# ${rubBulletEmoji} **Bullets:** **${bulletCount}** / 6 · <:kasiko_coin:1300141236841086977> **Bet:** **${betAmount.toLocaleString()}** Cash\n\n` +
      `*Spinning the cylinder...* ${cylEmoji}`;

    if (gameMsg?.edit) {
      await gameMsg.edit({
        content: startText,
        components: []
      }).catch(() => handleMessage(channel, { content: startText, components: [] }));
    } else {
      gameMsg = await handleMessage(channel, { content: startText, components: [] });
    }

    await Helper.wait(2500);

    // 2) Load bullets randomly into a 6-chamber cylinder
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
    let turn = 0; // 0 => challenger, 1 => opponent
    const players = [
      { userId: challenger.id, username: challenger.username },
      { userId: opponent.id, username: opponent.username }
    ];

    let isGameOver = false;
    let winnerId = null;
    let loserId = null;
    let shotChamber = null;

    for (let i = 0; i < 12; i++) {
      const shooter = players[turn];
      const hasBullet = chambers[currentIndex];

      const triggerText = `**${gunEmoji} ROULETTE IN PROGRESS**\n𖤍 **${challenger.username}** vs **${opponent.username}**\n` +
        `-# ${rubBulletEmoji} **Bullets:** **${bulletCount}** / 6 · <:kasiko_coin:1300141236841086977> **Bet:** **${betAmount.toLocaleString()}** Cash\n\n` +
        `# ${gunEmoji}💨 **${shooter.username}** pulls the trigger...`;

      if (gameMsg?.edit) {
        await gameMsg.edit({ content: triggerText, components: [] }).catch(() => {});
      }

      await Helper.wait(2500);

      if (hasBullet) {
        isGameOver = true;
        loserId = shooter.userId;
        winnerId = turn === 0 ? players[1].userId : players[0].userId;
        shotChamber = currentIndex + 1;
        break;
      } else {
        const clickText = `**${gunEmoji} ROULETTE IN PROGRESS**\n𖤍 **${challenger.username}** vs **${opponent.username}**\n` +
          `-# ${rubBulletEmoji} **Bullets:** **${bulletCount}** / 6 · <:kasiko_coin:1300141236841086977> **Bet:** **${betAmount.toLocaleString()}** Cash\n\n` +
          `## ${cylEmoji} **Click!** No bullet ${rubBulletEmoji} in chamber ${currentIndex + 1}.`;

        if (gameMsg?.edit) {
          await gameMsg.edit({ content: clickText, components: [] }).catch(() => {});
        }
      }

      currentIndex = (currentIndex + 1) % 6;
      turn = turn === 0 ? 1 : 0;
      await Helper.wait(2500);
    }

    if (!isGameOver) {
      const drawText = `${gunEmoji} **Incredible!** No one was shot. The game ends in a draw.`;
      if (gameMsg?.edit) {
        return await gameMsg.edit({ content: drawText, components: [] }).catch(() => handleMessage(channel, drawText));
      }
      return handleMessage(channel, drawText);
    }

    // 5) Update balances
    let loserData = await getUserData(loserId);
    let winnerData = await getUserData(winnerId);

    const botId = '1300081477358452756';

    if (!isBotOpponent || (isBotOpponent && loserId !== botId)) {
      if (loserData) {
        loserData.cash = Math.max(0, (loserData.cash || 0) - betAmount);
        await updateUser(loserId, { cash: loserData.cash });
      }
    }

    if (!isBotOpponent || (isBotOpponent && winnerId !== botId)) {
      if (winnerData) {
        winnerData.cash = (winnerData.cash || 0) + betAmount;
        await updateUser(winnerId, { cash: winnerData.cash });
      }
    }

    // 6) Announce final result
    const winnerName = winnerId === challenger.id ? challenger.username : opponent.username;
    const loserName = loserId === challenger.id ? challenger.username : opponent.username;

    const resultText = `💥 ${gunEmoji} **BANG!** ${cylEmoji} Chamber **${shotChamber}** had a bullet! ${rubBulletEmoji}\n\n` +
      `- ⚰︎ **${loserName}** got shot & \`loses\` <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}** Cash\n` +
      `- 🜲 **${winnerName}** _survives_ & \`earns\` <:kasiko_coin:1300141236841086977> **${betAmount.toLocaleString()}** Cash`;

    if (gameMsg?.edit) {
      await gameMsg.edit({ content: resultText, components: [] }).catch(() => handleMessage(channel, resultText));
    } else {
      await handleMessage(channel, resultText);
    }
  } catch (errx) {
    console.error(errx);
  }
}

// ------------------------------------------------------------------
//                     Command Export for your bot
// ------------------------------------------------------------------

export default {
  name: 'roulette',
  description: 'Challenge another player (or the bot) to a game of roulette. Bet your cash, load the revolver, and fire until someone loses!',
  aliases: ['rr', 'shot'],
  args: '<amount> [opponent_mention_or_id]',
  example: ['roulette 10000 @Player', 'roulette 5000'],
  emoji: "<:roulette_gun1:1325709544357101660>",
  related: ['diceduel', 'slots', 'cash', 'tosscoin', 'blackjack'],
  cooldown: 10000,
  category: '🎲 Games',

  execute: async (args, message) => {
    let opponentId = args[2] ? args[2].replace(/[<@!>]/g, '') : null;
    let bet = parseInt(args[1], 10);

    if (isNaN(bet) || bet < 1) {
      return handleMessage(message, '⚠️ You must specify a valid bet amount. `roulette <amount> [@opponent]`');
    }

    if (!opponentId || !/^\d+$/.test(opponentId)) {
      opponentId = '1300081477358452756';
    }

    const userId = message.author?.id || message.user?.id;
    return rouletteGame(userId, opponentId, bet, message);
  }
};
