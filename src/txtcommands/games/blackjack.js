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
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"
];

function getCardValue(card) {
  if (card === "J" || card === "Q" || card === "K") return 10;
  if (card === "A") return 11;
  return parseInt(card);
}

function calculateHandValue(hand) {
  let totalValue = 0;
  let aceCount = 0;

  hand.forEach(card => {
    const value = getCardValue(card);
    totalValue += value;
    if (card === "A") aceCount++;
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
    .setTitle('🃏 Blackjack Game')
    .setDescription(`**${guild.user.username}**, you are playing Blackjack!\n\n` +
      `Your cards: ${playerHand.join(" ")} (Value: ${playerHandValue})\n` +
      `Bot's cards: ${botHand[0]} X (Value: ???)\n\n` +
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

        // Update the embed with new player hand
        const newEmbed = new EmbedBuilder(embed)
        .setDescription(`**${guild.user.username}**, you hit!\n\n` +
          `Your cards: ${playerHand.join(" ")} (Value: ${newPlayerValue})\n` +
          `Bot's cards: ${botHand[0]} X (Value: ???)\n\n` +
          `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

        await interaction.update({
          embeds: [newEmbed], components: [row]
        });

        if (newPlayerValue > 21) {
          await interaction.followUp(`🚨 **${guild.user.username}**, you busted! Your hand value is over 21.`);
          return collector.stop();
        }
      } else if (interaction.customId === 'stand') {
        // Reveal bot's hand and calculate values
        let botHandFinalValue = calculateHandValue(botHand);
        while (botHandFinalValue < 17) {
          botHand.push(deck.pop());
          botHandFinalValue = calculateHandValue(botHand);
        }

        // Determine winner
        let resultMessage = '';
        if (botHandFinalValue > 21) {
          resultMessage = `🎉 **${guild.user.username}**, the bot busted! You win!`;
          userData.cash += amount * 2; // Player wins double the bet
        } else if (playerHandValue > botHandFinalValue) {
          resultMessage = `🎉 **${guild.user.username}**, you win!`;
          userData.cash += amount * 2; // Player wins double the bet
        } else if (playerHandValue < botHandFinalValue) {
          resultMessage = `🚨 **${guild.user.username}**, you lost. Bot wins.`;
        } else {
          resultMessage = `🤝 **${guild.user.username}**, it's a tie!`;
          userData.cash += amount; // Refund bet in case of tie
        }

        // Update user data
        await updateUser(id, userData);

        // Final update to the embed
        const finalEmbed = new EmbedBuilder(embed)
        .setDescription(`${resultMessage}\n\n` +
          `Your cards: ${playerHand.join(" ")} (Value: ${playerHandValue})\n` +
          `Bot's cards: ${botHand.join(" ")} (Value: ${botHandFinalValue})\n\n` +
          `Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

        await interaction.update({
          embeds: [finalEmbed], components: []
        });
        return collector.stop();
      }
    });

    collector.on('end',
      () => {
        // Handle timeout if the game ends with no interaction
        if (!gameMessage.deleted) {
          gameMessage.edit({
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
    blackjack(message.author.id, amount, message.channel);
  }
};