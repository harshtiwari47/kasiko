import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

const cardDeck = [
  "<:club2:1314435229531770990>", "<:club3:1314435207482572820>", "<:club4:1314435184590065775>", "<:club5:1314435159298412554>", "<:club6:1314435137005420586>", "<:club7:1314435116466044928>", "<:club8:1314435090838982678>", "<:club9:1314435070496342066>", "<:club10:1314435046450659328>", "<:heartJ:1314435267205009458>", "<:heartQ:1314435305666908181>", "<:heartK:1314435286847062057>", "<:heartA:1314435334641156238>"
];

function getCardValue(card) {
  if (card === "<:heartJ:1314435267205009458>" || card === "<:heartQ:1314435305666908181>" || card === "<:heartK:1314435286847062057>") return 10;
  if (card === "<:heartA:1314435334641156238>") return 11;
  if (card === "<:club2:1314435229531770990>") return 2;
  if (card === "<:club3:1314435207482572820>") return 3;
  if (card === "<:club4:1314435184590065775>") return 4;
  if (card === "<:club5:1314435159298412554>") return 5;
  if (card === "<:club6:1314435137005420586>") return 6;
  if (card === "<:club7:1314435116466044928>") return 7;
  if (card === "<:club8:1314435090838982678>") return 8;
  if (card === "<:club9:1314435070496342066>") return 9;
  if (card === "<:club10:1314435046450659328>") return 10;
  return 0;
}

function calculateHandValue(hand) {
  let totalValue = 0;
  let aceCount = 0;

  hand.forEach(card => {
    const value = getCardValue(card);
    totalValue += value;
    if (card === "<:heartA:1314435334641156238>") aceCount++;
  });

  while (totalValue > 21 && aceCount > 0) {
    totalValue -= 10; // Adjust Ace from 11 to 1
    aceCount--;
  }

  return totalValue;
}

export async function blackjack(id, amount, channel, context) {
  const ctx = context || channel;
  try {
    const userMeta = discordUser(ctx);
    const userId = id || userMeta.id;
    const name = userMeta.name || userMeta.username || 'Player';

    let userData = await getUserData(userId);
    if (!userData) {
      return await handleMessage(ctx, {
        content: `⚠️ Account not found! Please register with \`kas help\`.`
      });
    }

    if (amount === "all") {
      amount = Math.min(300000, Number(userData.cash || 0));
    } else {
      amount = parseInt(amount, 10);
    }

    if (isNaN(amount) || amount < 1 || !Number.isInteger(amount)) {
      return await handleMessage(ctx, `⚠️ **${name}**, please enter a valid positive bet amount (minimum 1).`);
    }

    if (amount > 300000) amount = 300000;

    if (userData.cash < 1) {
      return await handleMessage(ctx, `⚠️ **${name}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **1**.`);
    }

    if (userData.cash < amount) {
      return await handleMessage(ctx, `⚠️ **${name}**, you don't have <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash.`);
    }

    // Deduct bet amount
    userData.cash -= amount;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Initialize deck and shuffle
    let deck = [...cardDeck, ...cardDeck, ...cardDeck, ...cardDeck];
    deck = deck.sort(() => Math.random() - 0.5);

    // Deal cards
    let playerHand = [deck.pop(), deck.pop()];
    let botHand = [deck.pop(), deck.pop()];

    const playerHandValue = calculateHandValue(playerHand);
    const botHandValue = calculateHandValue([botHand[0], "X"]);

    const Container = new ContainerBuilder()
      .addSectionComponents(
        section => section
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`### 🃏 **${name}**'s 𝘽𝙡𝙖𝙘𝙠 𝙅𝙖𝙘𝙠 𝙂𝙖𝙢𝙚`)
          )
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Blackjack')
              .setURL("https://harshtiwari47.github.io/kasiko-public/images/blackjack-icon.png")
          )
      )
      .addSeparatorComponents(separate => separate)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(
          `> ***\`${name}, you are playing Blackjack!\`***`
        )
      )
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(
          `** <:follow_reply:1368224897003946004>𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎** :\n` +
          `## ${playerHand.join(" ")} (**${playerHandValue}**)\n` +
          `** <:reply:1368224908307468408> 𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎** :\n` +
          `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)`
        )
      )
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# **Bet: <:kasiko_coin:1300141236841086977> ${amount.toLocaleString()}**`)
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('hit')
        .setLabel('HIT')
        .setEmoji({ name: "⚡" })
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('stand')
        .setLabel('STAND')
        .setEmoji({ name: "⭕" })
        .setStyle(ButtonStyle.Secondary)
    );

    const gameMessage = await handleMessage(ctx, {
      components: [Container, row],
      flags: MessageFlags.IsComponentsV2
    });

    if (!gameMessage || typeof gameMessage.createMessageComponentCollector !== 'function') {
      return;
    }

    const filter = (btn) => btn.user.id === userId;
    const collector = gameMessage.createMessageComponentCollector({
      filter,
      time: 120000
    });

    collector.on('collect', async (btnInteraction) => {
      try {
        if (btnInteraction.customId === 'hit') {
          playerHand.push(deck.pop());
          const newPlayerValue = calculateHandValue(playerHand);

          if (newPlayerValue > 21) {
            let botHandFinalValue = calculateHandValue(botHand);
            while (botHandFinalValue < 17) {
              botHand.push(deck.pop());
              botHandFinalValue = calculateHandValue(botHand);
            }

            Container.components[2].data.content = `> 🚫 ***\`${name}, you busted! Your hand value is over 21.\`***`;
            Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎:**\n` +
              `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
              `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
              `## ${botHand.join(" ")} (**${botHandFinalValue}**)`;

            await btnInteraction.update({
              components: [Container],
              flags: MessageFlags.IsComponentsV2
            });
            collector.stop("busted");
            return;
          } else {
            Container.components[2].data.content = `> ***\`${name}, you hit!\`***`;
            Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎 :**\n` +
              `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
              `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
              `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)`;

            await btnInteraction.update({
              components: [Container, row],
              flags: MessageFlags.IsComponentsV2
            });
          }
        } else if (btnInteraction.customId === 'stand') {
          let botHandFinalValue = calculateHandValue(botHand);
          const finalPlayerHandValue = calculateHandValue(playerHand);

          while (botHandFinalValue < 17) {
            botHand.push(deck.pop());
            botHandFinalValue = calculateHandValue(botHand);
          }

          let resultMessage = '';
          let color = "#ed8484";
          if (botHandFinalValue > 21) {
            resultMessage = `<:wine:1356880010866069562> ***\`${name}, the bot busted! You win!\`***`;
            color = "#94edc2";
            userData.cash += amount * 2;
          } else if (finalPlayerHandValue > botHandFinalValue) {
            resultMessage = `<:wine:1356880010866069562> ***\`${name}, you win!\`***`;
            userData.cash += amount * 2;
            color = "#94edc2";
          } else if (finalPlayerHandValue < botHandFinalValue) {
            resultMessage = `🚫 ***\`${name}, you lost. Bot wins.\`***`;
          } else {
            color = "#a0adb7";
            resultMessage = `🤝 ***\`${name}, it's a tie!\`***`;
            userData.cash += amount;
          }

          await updateUser(userId, {
            cash: userData.cash
          });

          Container.components[2].data.content = `> ${resultMessage}`;
          Container.setAccentColor(Number(`0x${color.replace("#", "")}`));
          Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎 :**\n` +
            `## ${playerHand.join(" ")} (**${finalPlayerHandValue}**)\n` +
            `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
            `## ${botHand.join(" ")} (**${botHandFinalValue}**)`;

          await btnInteraction.update({
            components: [Container],
            flags: MessageFlags.IsComponentsV2
          });

          collector.stop("result");
          return;
        }
      } catch (err) {
        await btnInteraction.update({
          content: `ⓘ Something went wrong with your blackjack game!\n-# **Error**: ${err.message}`
        }).catch(e => ![50001, 50013, 10008].includes(e.code) && console.error(e));
      }
    });

    collector.on('end', async (collected, reason) => {
      if (gameMessage && reason === "time") {
        Container.components[2].data.content = "<:sand_timer:1386589414846631947> Time Out";
        await gameMessage.edit({
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    });
  } catch (error) {
    if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
      console.error(error);
    }
    await handleMessage(ctx, {
      content: `ⓘ Oops! Something went wrong during the Blackjack game.\n**Error**: ${error.message}`
    }).catch(() => {});
  }
}

export default {
  name: 'blackjack',
  description: "Play a game of Blackjack! Try your luck and beat the dealer by getting as close to 21 as possible without going over. Will you hit, stand, or go all in?",
  category: '🎲 Games',
  example: ["blackjack 250", "bj 250"],
  aliases: ["bj"],
  emoji: "🃏",
  cooldown: 10000,
  intract: (interaction) => {
    const bet = interaction.options?.getInteger?.('bet') || 1;
    return blackjack(interaction.user.id, bet, null, interaction);
  },
  execute: async (args, context) => {
    try {
      const { id } = discordUser(context);
      let amount = args[1] || args[0] || "1";

      if (String(amount).toLowerCase() !== "all") {
        amount = parseInt(amount, 10);
        if (isNaN(amount) || amount < 1) {
          return await handleMessage(context, "Please provide a valid bet amount.");
        }
        if (amount > 300000) {
          return await handleMessage(context, `ⓘ The maximum bet for blackjack is <:kasiko_coin:1300141236841086977> 300,000.`);
        }
      } else {
        amount = "all";
      }

      await blackjack(id, amount, null, context);
    } catch (err) {
      console.error(err);
      await handleMessage(context, `⚠️ Something went wrong with blackjack!`);
    }
  }
};