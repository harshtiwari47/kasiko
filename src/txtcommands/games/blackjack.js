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
  try {

    const {
      name,
      avatar: avatarUrl
    } = discordUser(context);

    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!userData) return;
    if (!guild) return;

    if (amount === "all") amount = userData.cash || 0;
    if (amount > 300000) amount = 300000;

    if (userData.cash < amount) {
      return await handleMessage(context, `⚠️ **${guild.user.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Required: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.`);
    }

    // Deduct bet amount
    userData.cash -= amount;
    await updateUser(id, {
      cash: userData.cash
    });

    // Initialize deck and shuffle
    let deck = [...cardDeck,
      ...cardDeck,
      ...cardDeck,
      ...cardDeck]; // 4x deck (standard deck)
    deck = deck.sort(() => Math.random() - 0.5); // Shuffle deck

    // Deal cards
    let playerHand = [deck.pop(),
      deck.pop()];
    let botHand = [deck.pop(),
      deck.pop()];

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
        `> ***\`${guild.user.username}, you are playing Blackjack!\`***`
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
    )

    // Create buttons for hit and stand
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('hit')
      .setLabel('HIT')
      .setEmoji({
        name: "⚡"
      })
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId('stand')
      .setLabel('STAND')
      .setEmoji({
        name: "⭕"
      })
      .setStyle(ButtonStyle.Secondary)
    );

    // Send the embed with buttons
    const gameMessage = await handleMessage(context, {
      components: [Container, row],
      flags: MessageFlags.IsComponentsV2
    });

    // Button interaction handler
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage.createMessageComponentCollector({
      filter, time: 120000
    });

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.customId === 'hit') {
          playerHand.push(deck.pop());
          const newPlayerValue = calculateHandValue(playerHand);

          if (newPlayerValue > 21) {
            // Simulate dealer's turn even if player busts
            let botHandFinalValue = calculateHandValue(botHand);
            while (botHandFinalValue < 17) {
              botHand.push(deck.pop());
              botHandFinalValue = calculateHandValue(botHand);
            }

            Container.components[2].data.content = `> 🚫 ***\`${guild.user.username}, you busted! Your hand value is over 21.\`***`;

            Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎:**\n` +
            `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
            `## ${botHand.join(" ")} (**${botHandFinalValue}**)`;

            await interaction.update({
              components: [Container],
              flags: MessageFlags.IsComponentsV2
            });
            collector.stop("busted");
            return;
          } else {
            // Update the embed with new player hand
            Container.components[2].data.content = `> ***\`${guild.user.username}, you hit!\`***`;

            Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎 :**\n` +
            `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
            `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)`;

            await interaction.update({
              components: [Container, row],
              flags: MessageFlags.IsComponentsV2
            });
          }
        } else if (interaction.customId === 'stand') {
          // Reveal bot's hand and calculate values
          let botHandFinalValue = calculateHandValue(botHand);
          const finalPlayerHandValue = calculateHandValue(playerHand);

          while (botHandFinalValue < 17) {
            botHand.push(deck.pop());
            botHandFinalValue = calculateHandValue(botHand);
          }

          // Determine winner
          let resultMessage = '';
          let color = "#ed8484";
          if (botHandFinalValue > 21) {
            resultMessage = `<:wine:1356880010866069562> ***\`${guild.user.username}, the bot busted! You win!\`***`;
            color = "#94edc2";
            userData.cash += amount * 2; // Player wins double the bet
          } else if (finalPlayerHandValue > botHandFinalValue) {
            resultMessage = `<:wine:1356880010866069562> ***\`${guild.user.username}, you win!\`***`;
            userData.cash += amount * 2; // Player wins double the bet
            color = "#94edc2";
          } else if (finalPlayerHandValue < botHandFinalValue) {
            resultMessage = `🚫 ***\`${guild.user.username}, you lost. Bot wins.\`***`;
          } else {
            color = "#a0adb7";
            resultMessage = `🤝 ***\`${guild.user.username}, it's a tie!\`***`;
            userData.cash += amount; // Refund bet in case of tie
          }

          // Update user data
          await updateUser(id, {
            cash: userData.cash
          });

          // Final update to the embed
          Container.components[2].data.content = `> ${resultMessage}`;
          Container.setAccentColor(Number(`0x${color.replace("#", "")}`));

          Container.components[3].data.content = `<:follow_reply:1368224897003946004> **𝙔𝙊𝙐𝙍 𝘾𝘼𝙍𝘿𝙎 :**\n` +
          `## ${playerHand.join(" ")} (**${finalPlayerHandValue}**)\n` +
          `<:reply:1368224908307468408> **𝘿𝙀𝘼𝙇𝙀𝙍'𝙎 𝘾𝘼𝙍𝘿𝙎 :**\n` +
          `## ${botHand.join(" ")} (**${botHandFinalValue}**)`;
          await interaction.update({
            components: [Container],
            flags: MessageFlags.IsComponentsV2
          });

          collector.stop("result")
          return;
        }
      } catch (err) {
        await interaction.update({
          content: `ⓘ Something went wrong with your blackjack game!\n-# **Error**: ${err.message}`
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        return;
      }
    });

    collector.on('end',
      async (collected, reason) => {
        // Handle timeout if the game ends with no interaction
        if (gameMessage && reason === "time") {
          Container.components[2].data.content = "<:sand_timer:1386589414846631947> Time Out";
          await gameMessage?.edit({
            components: [Container],
            flags: MessageFlags.IsComponentsV2
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          return;
        }
      });
  } catch (error) {
    if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
      console.error(error);
    }
    await channel.send(`ⓘ Oops! Something went wrong during the Blackjack game.\n**Error**: ${error.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  }
}

export default {
  name: 'blackjack',
  description: "Play a game of Blackjack! Try your luck and beat the dealer by getting as close to 21 as possible without going over. Will you hit, stand, or go all in?",
  category: '🎲 Games',
  example: ["blackjack 250",
    "bj 250"],
  aliases: ["bj"],
  emoji: "🃏",
  cooldown: 10000,
  execute: async (args, message) => {
    try {
      args.shift();

      let amount;
      if (!args[0]) {
        amount = 1;
      }

      if (String(args[0]).toLowerCase() !== "all") {
        amount = parseInt(args[0] ? args[0]: amount);
        if (isNaN(amount)) {
          return message.channel.send("Please provide a valid number.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
        if (amount > 300000 || amount < 1) {
          return message.channel.send(`ⓘ The range for participating in the blackjack is <:kasiko_coin:1300141236841086977> 1 to <:kasiko_coin:1300141236841086977> 300,000.`)
          .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      } else {
        amount = "all";
      }

      try {
        await blackjack(message.author.id, amount, message.channel, message);
        return;
      } catch (e) {
        console.error(e);
        await message.channel.send(`⚠️ something went wrong with blackjack!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }
}