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
    let teammateData = teammateId ? await getUserData(teammateId): null;
    // Check if the user and teammate have enough cash
    if (userData.cash < amount || (teammateData && teammateData.cash < amount)) {
      return channel.send(`⚠️ **${guild.user.username}**, you or your teammate don't have enough <:kasiko_coin:1300141236841086977> cash. Minimum is **${amount.toLocaleString()}**.`);
    }

    // Deduct the bet amount
    userData.cash -= amount;
    if (teammateData) teammateData.cash -= amount;

    // Save the updated cash to the database
    await updateUser(id, userData);
    if (teammateData) await updateUser(teammateId, teammateData);

    let gameMessage;

    if (teammateData) {
      gameMessage = await channel.send(
        `🏇 **${guild.user.username}** has started a horse race and bet <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**! Type **participate <horse (optional)>** (horse1, horse2, horse3) to join the race.**<@${teammateId}>**, you have 25 seconds!`
      );

      const filter = (m) => m.content.toLowerCase().startsWith() === "participate" && m.author.id === teammateId;
      const collector = channel.createMessageCollector({
        filter, time: 25000
      });

      collector.on("collect", async (msg) => {
        const opponent = msg.author;

        const msgArgs = msg.slice(prefix.toLowerCase().length).trim().split(/ +/);

        if (msgArgs && msgArgs[1] && (msgArgs[1] === "horse1" || msgArgs[1] === "horse2" || msgArgs[1] === "horse3")) {
          if (msgArgs === betOn) {
            if (betOn === "horse1") opponentBetOn = "horse2"
            if (betOn === "horse2") opponentBetOn = "horse3"
            if (betOn === "horse3") opponentBetOn = "horse1"
          } else {
            opponentBetOn = msgArgs[1];
          }
        } else {
          if (betOn === "horse1") opponentBetOn = "horse2"
          if (betOn === "horse2") opponentBetOn = "horse3"
          if (betOn === "horse3") opponentBetOn = "horse1"
        }

        collector.stop("opponent_joined");
        channel.send(`🎉 **${opponent.username}** has joined the race with bet on **${opponentBetOn}**! Let the race begin!`);
        // Call the function to start the game here once the opponent joins
        await startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild);
      });

      collector.on("end",
        async (collected, reason) => {

          userData.cash += amount;
          if (teammateData) teammateData.cash += amount;

          // Save the updated cash to the database
          await updateUser(id, userData);
          if (teammateData) await updateUser(teammateId, teammateData);

          if (reason !== "opponent_joined") {
            return channel.send(`⏱️ No one joined the race. The game has been canceled, and your bet has been refunded.`);
          }
        });
    } else {
      // If no teammate, skip the message collection and start race directly
      await startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild);
    }
    return;
  } catch (e) {
    console.log(e);
    return channel.send("Oops! Something went wrong during the race!");
  }
}

// Function to start the race logic
async function startRace(amount, betOn, opponentBetOn, teammateId, userData, teammateData, channel, guild) {
  amount = parseInt(amount)
  const suspenseMessage = await channel.send(
    `🏁 The race is about to begin!\n`
  );

  // Race details
  const horse1 = "<:horse_brown:1314077268447985725>";
  const horse2 = "<:horse_red:1314077243881820241>";
  const horse3 = "<:horse_grey:1316729191202558003>";
  const trackLength = 20; // Length of the race track
  let horse1Pos = 0;
  let horse2Pos = 0;
  let horse3Pos = 0;

  const raceInterval = setInterval(async () => {
    horse1Pos += Math.floor(Math.random() * 8); // Random step for horse 1
    horse2Pos += Math.floor(Math.random() * 8); // Random step for horse 2
    horse3Pos += Math.floor(Math.random() * 8); // Random step for horse 2

    // Update the track
    let track1 = `${' '.repeat(horse1Pos)}${horse1}${' '.repeat(Math.max(0, trackLength - horse1Pos))}|`;
    let track2 = `${' '.repeat(horse2Pos)}${horse2}${' '.repeat(Math.max(0, trackLength - horse2Pos))}|`;
    let track3 = `${' '.repeat(horse3Pos)}${horse3}${' '.repeat(Math.max(0, trackLength - horse3Pos))}|`;

    const embedTitle = new EmbedBuilder()
    .setDescription(`🏁 𝑻𝒉𝒆 𝒓𝒂𝒄𝒆 𝒊𝒔 𝒐𝒏!\n\n` + `**${guild.user.username}** bet on **${betOn === "horse1" ? horse1 + " Horse 1": betOn === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** cash!` +
      `${teammateId ? `\n**<@${teammateId}>** is teaming up with the same bet on **${opponentBetOn}**!`: ""}`);

    await suspenseMessage.edit({
      content: `\n\n## ${track1}\n## ${track2}\n## ${track3}\n`,
      embeds: [embedTitle]
    });

    // Check if any horse has finished
    if (horse1Pos >= trackLength || horse2Pos >= trackLength || horse3Pos >= trackLength) {
      clearInterval(raceInterval);

      // Determine the winner
      let winner = (horse1Pos >= trackLength && horse1Pos > horse2Pos) ? "horse1": "horse2";
      if (winner === "horse1") {
        if (horse3Pos >= trackLength && horse3Pos > horse1Pos) {
          winner = "horse3";
        }
      } else {
        if (horse3Pos >= trackLength && horse3Pos > horse2Pos) {
          winner = "horse3";
        }
      }
      const winAmount = Math.floor(amount * 1.5);
      const teammateSplit = teammateId ? Math.floor(winAmount / 2): winAmount;

      if (winner === betOn) {
        userData.cash += amount + winAmount;
        await updateUser(userData.id, userData);

        const embed = new EmbedBuilder()
        .setColor(0xFFD700) // Gold color
        .setTitle(`🎉 ${guild.user.username}, your bet paid off!`)
        .setDescription(
          `Your bet on **${winner === "horse1" ? "<:horse_brown:1314077268447985725> Horse 1": winner === "horse2" ? "<:horse_red:1314077243881820241> Horse 2 ": horse3 + " Horse 3"}** paid off!\n` +
          `**${winner === "horse1" ? horse1: horse2}** won the race! 🏆\n` +
          `You earned <:kasiko_coin:1300141236841086977> **${winAmount.toLocaleString()}** cash${teammateId ? `, split with your teammate.`: '.'}`
        )
        .setFooter({
          text: 'Congratulations on your win!'
        });

        await channel.send({
          embeds: [embed]
        });
      } else {
        if (teammateData && winner === opponentBetOn) {
          teammateData.cash += amount + winAmount;
          await updateUser(teammateId, teammateData);
        }

        const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red color for loss
        .setTitle(`🚨 ${guild.user.username}${teammateData && winner !== opponentBetOn ? " & <@" + teammateId + ">": ""}, better luck next time!`)
        .setDescription(
          `**${guild.user.username}** bet on **${betOn === "horse1" ? horse1 + " Horse 1": betOn === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** didn't win...\n` +
          `${teammateId && winner !== opponentBetOn ? `**<@${teammateId}>** bet on **${opponentBetOn}** didn't win too!`: ""}` +
          `${teammateId && winner === opponentBetOn ? `**<@${teammateId}>**'s `: ""}**${winner === "horse1" ? horse1 + " Horse 1": winner === "horse2" ? horse2 + " Horse 2 ": horse3 + " Horse 3"}** crossed the finish line first! Better luck next time!`
        )
        .setFooter({
          text: 'Keep trying, your big win is just around the corner!'
        }); // Footer text

        await channel.send({
          embeds: [embed]
        });
      }
    }
  },
    2000); // Update every 2 seconds
}

export default {
  name: "horserace",
  description: "Bet on a horse race and win or lose based on the result.",
  aliases: ["hr"],
  args: "<amount> <bet (horse1/horse2)> [teammate (optional)]",
  example: ["horserace 250 horse1", "hr 500 horse2 @Teammate"],
  category: "🎲 Games",
  cooldown: 20000, // 8 seconds cooldown

  async execute(args,
    message) {
    const amount = parseInt(args[1]);
    let betOn = args[2]?.toLowerCase() === "horse2" ? "horse2": "horse1";
    betOn = args[2]?.toLowerCase() === "horse3" ? "horse3": betOn;
    const teammateMention = message.mentions.users.first();
    const teammateId = teammateMention ? teammateMention.id: null;

    if (amount > 200000 || amount < 10000) {
      return message.channel.send(`The range for participating in the horse race is <:kasiko_coin:1300141236841086977> 10,000 to <:kasiko_coin:1300141236841086977> 200,000.`);
    }

    if (!Helper.isNumber(amount) || amount < 1) {
      return message.channel.send("⚠️ Invalid amount! Use `horserace <amount> <horse1/horse2> [teammate (optional)]`.");
    }

    await horseRace(message.author.id, amount, message.channel, betOn, "horse2", teammateId);
  }
};