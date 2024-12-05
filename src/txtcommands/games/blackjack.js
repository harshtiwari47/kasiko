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

const cardDeck = [
  "<:club2:1314220338430738443>", "<:club3:1314220364829560843>", "<:club4:1314220419091533884>", "<:club5:1314220442730500116>", "<:club6:1314220469578235904>", "<:club7:1314220500058378240>", "<:club8:1314220524213243984>", "<:club9:1314220548028633179>", "<:club10:1314220568865935423>", "<:heartJ:1314220885942734888>", "<:heartQ:1314221003076800514>", "<:heartK:1314220904665845761>", "<:heartA:1314220849317941380>"
];

function getCardValue(card) {
  if (card === "<:heartJ:1314220885942734888>" || card === "<:heartQ:1314221003076800514>" || card === "<:heartK:1314220904665845761>") return 10;
  if (card === "<:heartA:1314220849317941380>") return 11;
  if (card === "<:club2:1314220338430738443>") return 2;
  if (card === "<:club3:1314220364829560843>") return 3;
  if (card === "<:club4:1314220419091533884>") return 4;
  if (card === "<:club5:1314220442730500116>") return 5;
  if (card === "<:club6:1314220469578235904>") return 6;
  if (card === "<:club7:1314220500058378240>") return 7;
  if (card === "<:club8:1314220524213243984>") return 8;
  if (card === "<:club9:1314220548028633179>") return 9;
  if (card === "<:club10:1314220568865935423>") return 10;
}

function calculateHandValue(hand) {
  let totalValue = 0;
  let aceCount = 0;

  hand.forEach(card => {
    const value = getCardValue(card);
    totalValue += value;
    if (card === "<:heartA:1314220849317941380>") aceCount++;
  });

  while (totalValue > 21 && aceCount > 0) {
    totalValue -= 10; // Adjust Ace from 11 to 1
    aceCount--;
  }

  return totalValue;
}

export async function blackjack(id, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (userData.cash < amount) {
      return channel.send(`⚠️ **${guild.user.username}**, you don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **${amount.toLocaleString()}**.`);
    }

    // Deduct bet amount
    userData.cash -= amount;
    await updateUser(id, userData);

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

    // Create embed for the game state
    const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🃏 𝐁𝐥𝐚𝐜𝐤𝐣𝐚𝐜𝐤 𝐆𝐚𝐦𝐞')
    .setDescription(`**${guild.user.username}**, you are playing Blackjack!\n\n` +
      `**Your cards**: ${playerHand.join(" ")} (**${playerHandValue}**)\n` +
      `**Bot's cards**: ${botHand[0]} X (**???**)\n\n` +
      `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

    // Create buttons for hit and stand
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('hit')
      .setLabel('Hit')
      .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
      .setCustomId('stand')
      .setLabel('Stand')
      .setStyle(ButtonStyle.Danger)
    );

    // Send the embed with buttons
    const gameMessage = await channel.send({
      embeds: [embed], components: [row]
    });

    // Button interaction handler
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage.createMessageComponentCollector({
      filter, time: 30000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'hit') {
        playerHand.push(deck.pop());
        const newPlayerValue = calculateHandValue(playerHand);

        if (newPlayerValue > 21) {
          const bustEmbed = new EmbedBuilder(embed)
          .setColor("#f43d3d")
          .setDescription(`🚨 **${guild.user.username}**, you busted! Your hand value is over 21.\n` +
            `**Your cards :** ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `**Bot's cards:** ${botHand[0]} X (**???**)\n\n` +
            `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

          await interaction.update({
            embeds: [bustEmbed], components: []
          });

          return;
        } else {
          // Update the embed with new player hand
          const newEmbed = new EmbedBuilder(embed)
          .setDescription(`**${guild.user.username}**, you hit!\n\n` +
            `**Your cards :** ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `**Bot's cards:** ${botHand[0]} X (**???**)\n\n` +
            `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

          await interaction.update({
            embeds: [newEmbed], components: [row]
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
        let color = "#f01d1d";
        if (botHandFinalValue > 21) {
          resultMessage = `🎉 **${guild.user.username}**, the bot busted! You win!`;
          color = "#1df08b";
          userData.cash += amount * 2; // Player wins double the bet
        } else if (finalPlayerHandValue > botHandFinalValue) {
          resultMessage = `🎉 **${guild.user.username}**, you win!`;
          userData.cash += amount * 2; // Player wins double the bet
          color = "#1df08b";
        } else if (finalPlayerHandValue < botHandFinalValue) {
          resultMessage = `🚨 **${guild.user.username}**, you lost. Bot wins.`;
        } else {
          color = "#a0adb7";
          resultMessage = `🤝 **${guild.user.username}**, it's a tie!`;
          userData.cash += amount; // Refund bet in case of tie
        }

        // Update user data
        await updateUser(id, userData);

        // Final update to the embed
        const finalEmbed = new EmbedBuilder(embed)
        .setColor(color)
        .setDescription(`${resultMessage}\n\n` +
          `**Your cards :** ${playerHand.join(" ")} (**${finalPlayerHandValue}**)\n` +
          `**Bot's cards:** ${botHand.join(" ")} (**${botHandFinalValue}**)\n\n` +
          `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

        await interaction.update({
          embeds: [finalEmbed], components: []
        });
        return;
      }
    });

    collector.on('end',
      () => {
        // Handle timeout if the game ends with no interaction
        if (!gameMessage.deleted) {
          gameMessage.edit({
            embeds: [embed.setFooter({
              text: "⏱️ Timeout"
            }).setColor("#f43d3d")],
            components: []
          });
        }
      });
  } catch (error) {
    console.error(error);
    return channel.send("Oops! Something went wrong during the Blackjack game.");
  }
}

export default {
  name: 'blackjack',
  description: 'Play a game of Blackjack!',
  category: '🎲 Games',
  example: ["blackjack 250", "bj 250"],
  aliases: ["bj"],
  execute: async (args,
    message) => {
    args.shift();
    if (!args[0] || isNaN(args[0]) || args[0] <= 0) {
      return message.channel.send("⚠️ Please provide a valid bet amount.");
    }
    const amount = parseInt(args[0]);
    if (amount > 200000 || amount < 1) {
      return message.channel.send(`The range for participating in the blackjack is <:kasiko_coin:1300141236841086977> 1 to <:kasiko_coin:1300141236841086977> 200,000.`);
    }
    try {
      blackjack(message.author.id, amount, message.channel);
    } catch (e) {
      console.error(e);
      message.channel.send(`⚠️ something went wrong with blackjack!`);
    }
  }
}