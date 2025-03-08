import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper
} from '../../../helper.js';

import {
  EmbedBuilder
} from 'discord.js';

export async function horseRace(id, amount, channel, betOn = "horse1", opponentBetOn = "horse2", teammateId = null) {
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    if (!userData) return;

    let teammateData = teammateId ? await getUserData(teammateId): null;

    if (amount === "all") amount = userData.cash;
    if (amount > 5000000) amount = 5000000;
    // Check if the user and teammate have enough cash
    if (userData.cash < amount || (teammateData && teammateData.cash < amount)) {
      return channel.send(`ⓘ  **${guild.user.username}**, you or your teammate doesn't have enough cash for a bet <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    let gameMessage;

    if (teammateData) {
      gameMessage = await channel.send(
        `🏇 **${guild.user.username}** has started a horse race and bet <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**!\n\n` +
        `To join the race, type: **\`join [horse]\`**\n` +
        `-# Horses available: \`horse1\`, \`horse2\`, \`horse3\`\n\n` +
        `⏱️ **<@${teammateId}>**, you have ***25 seconds!***`
      );

      const filter = (m) => m.content.toLowerCase().startsWith("join") && m.author.id === teammateId;
      const collector = channel.createMessageCollector({
        filter, time: 25000
      });

      collector.on("collect", async (msg) => {
        try {
          const opponent = msg.author;
          const msgArgs = msg.content.slice("join".length).trim().split(/ +/);
          let opponentBetOn;

          const availableHorses = ["horse1", "horse2", "horse3"];

          // Remove the user's betOn from available choices
          const remainingHorses = availableHorses.filter(horse => horse !== betOn);

          // Check if a valid horse is chosen and ensure it's not the same as betOn
          if (msgArgs.length > 0 && remainingHorses.includes(msgArgs[0])) {
            opponentBetOn = msgArgs[0];
          } else {
            // Assign the first remaining horse if input is invalid or the same as betOn
            opponentBetOn = remainingHorses[0];
          }

          collector.stop("opponent_joined");

          await channel.send(`🎉 **${opponent.username}** has joined the race, betting on **${opponentBetOn}**! 🏇 Let the race begin!`);

          // Start the race
          await startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild, id);
          return;
        } catch (error) {
          if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
            console.error("Error handling race join:", error);
          }
          await channel.send("⚠ An error occurred while processing the race entry. Please try again.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      });

      collector.on("end",
        async (collected, reason) => {
          if (teammateData && reason !== "opponent_joined") {
            return channel.send(`⏱️ No one joined the race. The game has been canceled, and your bet has been refunded.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        });
    } else {
      // If no teammate, skip the message collection and start race directly
      await startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild, id);
    }
    return;
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return channel.send(`⚠ Oops! Something went wrong during the horse race!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

// Function to start the race logic
async function startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild, userId) {
  try {
    amount = parseInt(amount);
    const suspenseMessage = await channel.send(
      `🏁 The race is about to begin!\n`
    );

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(2000);

    // Deduct the bet amount
    userData.cash -= amount;
    if (teammateData) teammateData.cash -= amount;

    // Save the updated cash to the database
    userData = await updateUser(userId, {
      cash: userData.cash
    });

    if (teammateData) {
      teammateData = await updateUser(teammateId, {
        cash: teammateData.cash
      });
    }

    // Race details
    const horse1 = "<a:runningHorse:1326785483866374265>";
    const horse2 = "<a:runningHorse:1326785483866374265>";
    const horse3 = "<a:runningHorse:1326785483866374265>";

    const trackLength = 20; // Length of the race track
    let horse1Pos = 0;
    let horse2Pos = 0;
    let horse3Pos = 0;

    const raceInterval = setInterval(async () => {
      try {
        horse1Pos += Math.floor(Math.random() * 8); // Random step for horse 1
        horse2Pos += Math.floor(Math.random() * 8); // Random step for horse 2
        horse3Pos += Math.floor(Math.random() * 8); // Random step for horse 3

        // Update the track
        let track1 = `${' '.repeat(horse1Pos)}${horse1}${' '.repeat(Math.max(0, trackLength - horse1Pos))}|`;
        let track2 = `${' '.repeat(horse2Pos)}${horse2}${' '.repeat(Math.max(0, trackLength - horse2Pos))}|`;
        let track3 = `${' '.repeat(horse3Pos)}${horse3}${' '.repeat(Math.max(0, trackLength - horse3Pos))}|`;

        const embedTitle = new EmbedBuilder()
        .setDescription(`🏁 𝑻𝒉𝒆 𝒓𝒂𝒄𝒆 𝒊𝒔 𝒐𝒏!\n\n` + `**${guild.user.username}** bet on **${betOn === "horse1" ? horse1 + " Horse 1": betOn === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash!` +
          `${teammateId ? `\n**<@${teammateId}>** is teaming up with the same bet on **${opponentBetOn}**!`: ""}`);

        await suspenseMessage.edit({
          content: `\`\`\`Cheers for your horse 🐎\`\`\`\n`+`${track1}\n`+`${track2}\n`+`${track3}\n`,
          embeds: [embedTitle]
        });

        // Check if any horse has finished
        if (horse1Pos >= trackLength || horse2Pos >= trackLength || horse3Pos >= trackLength) {
          clearInterval(raceInterval);

          // Get all horses that crossed the finish line
          const crossedHorses = [{
            name: "horse1",
            pos: horse1Pos
          },
            {
              name: "horse2",
              pos: horse2Pos
            },
            {
              name: "horse3",
              pos: horse3Pos
            }].filter(h => h.pos >= trackLength); // Only horses that finished

          // Determine the winner (horse with the highest position)
          let winner;
          if (crossedHorses.length > 0) {
            winner = crossedHorses.reduce((a, b) => a.pos > b.pos ? a: b).name;
          } else {
            winner = "none"; // Edge case (race ended prematurely)
          }

          const winAmount = Math.floor(amount * 2);
          const teammateSplit = teammateId ? Math.floor(winAmount / 2): winAmount;

          if (winner === betOn) {
            userData.cash += winAmount + (!teammateData ? amount: 0);
            await updateUser(userData.id, userData);

            const embed = new EmbedBuilder()
            .setColor(0xFFD700) // Gold color
            .setTitle(`💸 ${guild.user.username}, your bet paid off!`)
            .setDescription(
              `Your bet on **${winner === "horse1" ? "<:horse_brown:1314077268447985725> Horse 1": winner === "horse2" ? "<:horse_red:1314077243881820241> Horse 2 ": horse3 + " Horse 3"}** paid off!\n` +
              `**${winner === "horse1" ? horse1: horse2}** won the race! 🏆\n` +
              `You earned <:kasiko_coin:1300141236841086977> **${winAmount.toLocaleString()}** cash${teammateId ? `, split with your teammate.`: '.'}`
            )
            .setFooter({
              text: 'Congratulations on your win!'
            });

            await suspenseMessage.edit({
              embeds: [embed]
            });
          } else {
            if (teammateData && winner === opponentBetOn) {
              teammateData.cash += winAmount;
              await updateUser(teammateId, teammateData);
            }

            const embed = new EmbedBuilder()
            .setColor(0xFF0000) // Red color for loss
            .setTitle(`🚫 ${guild.user.username}${teammateData && winner !== opponentBetOn ? " & <@" + teammateId + ">": ""}, better luck next time!`)
            .setDescription(
              `**${guild.user.username}** bet on **${betOn === "horse1" ? horse1 + " Horse 1": betOn === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** didn't win...\n` +
              `${teammateId && winner !== opponentBetOn ? `**<@${teammateId}>** bet on **${opponentBetOn}** didn't win too!`: ""}` +
              `${teammateId && winner === opponentBetOn ? `**<@${teammateId}>**'s `: ""}**${winner === "horse1" ? horse1 + " Horse 1": winner === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** crossed the finish line first! Better luck next time!`
            )
            .setFooter({
              text: 'Keep trying, your big win is just around the corner!'
            });
            await suspenseMessage.edit({
              embeds: [embed]
            });
          }
        }
      } catch (err) {
        if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
          console.error(err);
        }
      }
    },
      2000); // Update every 2 seconds
  } catch (e) {
    if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
      console.error(e);
    }
    return channel.send(`⚠ Oops! Something went wrong during the horse race!\n-# **Error**: ${e.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "horserace",
  description: "Bet on a horse race and win or lose based on the result.",
  aliases: ["hr"],
  args: "<amount> <bet (horse1/horse2)> [teammate (optional)]",
  example: ["horserace 250 horse1",
    "hr 500 horse2 @Teammate"],
  category: "🎲 Games",
  emoji: "🏇🏻",
  cooldown: 20000,
  // 8 seconds cooldown

  async execute(args,
    message) {
    try {
      if (!args[1]) {
        return message.channel.send("ⓘ Please specify an amount. Use `horserace <amount/all> <horse1/horse2/horse3> [@teammate (optional)]`.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let betOn = "horse1";
      const selectedHorse = args[2]?.toLowerCase();
      if (["horse2", "horse3"].includes(selectedHorse)) {
        betOn = selectedHorse;
      }

      const teammateMention = message.mentions.users.first();
      const teammateId = teammateMention ? teammateMention.id: null;

      let amount;

      if (args[1].toLowerCase() === "all") {
        amount = "all";
      } else {
        amount = parseInt(args[1]);

        if (isNaN(amount) || amount < 1000 || amount > 1000000) {
          return message.channel.send("⚠ Invalid amount! The betting range is between <:kasiko_coin:1300141236841086977> 1,000 and <:kasiko_coin:1300141236841086977> 10,00,000.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      await horseRace(message.author.id, amount, message.channel, betOn, "horse2", teammateId);
      return;
    } catch (error) {
      if (error.message !== "Unknown Message" && error.message !== "Missing Permissions") {
        console.error(error);
      }
      return message.channel.send(`⚠ An unexpected error occurred while processing your bet. Please try again later.\n-# **Error:** ${error.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};