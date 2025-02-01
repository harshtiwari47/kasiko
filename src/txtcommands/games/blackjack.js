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

export async function blackjack(id, amount, channel) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (amount === "all") amount = userData.cash;
    if (amount > 300000) amount = 300000;

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

    const avatarUrl = guild.user.displayAvatarURL({
      dynamic: true, size: 1024
    });

    const embedTitle = new EmbedBuilder()
    .setTitle(`🃏 𝘉𝘓𝘈𝘊𝘒𝘑𝘈𝘊𝘒 𝘎𝘈𝘔𝘌`)
    .setAuthor({
      name: `${guild.user.username}'s`, iconURL: avatarUrl
    })
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/blackjack-icon.png`)

    // Create embed for the game state
    const embed = new EmbedBuilder()
    .setDescription(`> **${guild.user.username}**, you are playing Blackjack!\n\n` +
      `**Your cards** :\n` +
      `## ${playerHand.join(" ")} (**${playerHandValue}**)\n` +
      `**Bot's cards**:\n` +
      `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)\n\n` +
      `### Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

    // Create buttons for hit and stand
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('hit')
      .setLabel('Hit')
      .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
      .setCustomId('stand')
      .setLabel('Stand')
      .setStyle(ButtonStyle.Primary)
    );

    // Send the embed with buttons
    const gameMessage = await channel.send({
      embeds: [embedTitle, embed], components: [row]
    });

    // Button interaction handler
    const filter = (interaction) => interaction.user.id === id;
    const collector = gameMessage.createMessageComponentCollector({
      filter, time: 120000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'hit') {
        playerHand.push(deck.pop());
        const newPlayerValue = calculateHandValue(playerHand);

        if (newPlayerValue > 21) {
          const bustEmbed = new EmbedBuilder(embed)
          .setColor("#f43d3d")
          .setDescription(`> 🚨 **${guild.user.username}**, you busted! Your hand value is over 21.\n\n` +
            `**Your cards :**\n` +
            `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `**Bot's cards:**\n` +
            `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)\n\n` +
            `### Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

          await interaction.update({
            embeds: [embedTitle, bustEmbed], components: []
          });
          collector.stop("busted")
          return;
        } else {
          // Update the embed with new player hand
          const newEmbed = new EmbedBuilder(embed)
          .setDescription(`> **${guild.user.username}**, you hit!\n\n` +
            `**Your cards :**\n` +
            `## ${playerHand.join(" ")} (**${newPlayerValue}**)\n` +
            `**Bot's cards:**\n` +
            `## ${botHand[0]} <:unknownCard:1314464932472946768> (**?**)\n\n` +
            `### Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

          await interaction.update({
            embeds: [embedTitle, newEmbed], components: [row]
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
        .setDescription(`> ${resultMessage}\n\n` +
          `**Your cards :**\n` +
          `## ${playerHand.join(" ")} (**${finalPlayerHandValue}**)\n` +
          `**Bot's cards:**\n` +
          `## ${botHand.join(" ")} (**${botHandFinalValue}**)\n\n` +
          `### Bet: <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**`);

        await interaction.update({
          embeds: [embedTitle, finalEmbed], components: []
        });

        collector.stop("result")
        return;
      }
    });

    collector.on('end',
      (collected, reason) => {
        // Handle timeout if the game ends with no interaction
        if (!gameMessage.deleted && reason === "time") {
          gameMessage.edit({
            embeds: [embedTitle, embed.setFooter({
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

    let amount;
    if (!args[0]) {
      amount = 1;
    }

    if (args[0] !== "all") {
      amount = parseInt(args[0] ? args[0] : amount);
      if (amount > 200000 || amount < 1) {
        return message.channel.send(`The range for participating in the blackjack is <:kasiko_coin:1300141236841086977> 1 to <:kasiko_coin:1300141236841086977> 200,000.`);
      }
    } else {
      amount = "all";
    }
    
    try {
      blackjack(message.author.id, amount, message.channel);
    } catch (e) {
      console.error(e);
      message.channel.send(`⚠️ something went wrong with blackjack!`);
    }
  }
}