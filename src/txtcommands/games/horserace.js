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

// Utility: convert user input into our horse string
function convertHorse(input) {
  if (!input) return null;
  input = input.toLowerCase();
  if (input === "1" || input === "horse1" || input === "horse 1") return "horse1";
  if (input === "2" || input === "horse2" || input === "horse 2") return "horse2";
  if (input === "3" || input === "horse3" || input === "horse 3") return "horse3";
  return null;
}

// Main function – supports multiple opponents (up to three) and same-horse betting
export async function horseRace(initiatorId, amount, channel, chosenHorseInput, allowedOpponentIds = []) {
  try {
    // Fetch initiator's member and data
    const guildMember = await channel.guild.members.fetch(initiatorId);
    let initiatorData = await getUserData(initiatorId);
    if (!initiatorData) return;

    // Convert the initiator’s chosen horse (e.g. "1" becomes "horse1")
    const chosenHorse = convertHorse(chosenHorseInput);
    if (!chosenHorse) {
      return channel.send("ⓘ Invalid horse selection. Please choose **1**, **2** or **3**.");
    }

    // Create participants list with the initiator included
    let participants = [{
      id: initiatorId,
      username: guildMember.user.username,
      chosenHorse,
      data: initiatorData
    }];

    // If opponents were pinged, allow them to join via a message collector.
    if (allowedOpponentIds.length > 0) {
      const mentionList = allowedOpponentIds.map(id => `<@${id}>`).join(" ");
      const gameMessage = await channel.send(
        `🏇 **${guildMember.user.username}** has started a horse race and bet <:kasiko_coin:1300141236841086977> **${parseInt(amount).toLocaleString()}**!\n\n` +
        `To join the race, type: **\`join [1/2/3]\`**\n` +
        `-# Choose your horse by entering **1**, **2** or **3**.\n\n` +
        `⏱️ ${mentionList}, you have ***25 seconds!***`
      );

      // Only allow join messages from those who were pinged.
      const filter = m => allowedOpponentIds.includes(m.author.id) && m.content.toLowerCase().startsWith("join");
      const collector = channel.createMessageCollector({
        filter, time: 25000
      });

      collector.on("collect", async (msg) => {
        try {
          // Prevent duplicate joins
          if (participants.some(p => p.id === msg.author.id)) return;

          // Expect join command like: "join 1" (or 2/3)
          const args = msg.content.slice("join".length).trim().split(/ +/);
          let joinInput = args[0];
          let opponentChosen = convertHorse(joinInput);
          // If invalid, default to "horse1"
          if (!opponentChosen) opponentChosen = "horse1";

          // Fetch opponent's member and data
          const opponentMember = await channel.guild.members.fetch(msg.author.id);
          let opponentData = await getUserData(msg.author.id);
          if (!opponentData) {
            await channel.send(`ⓘ Could not retrieve data for **${opponentMember.user.username}**.`);
            return;
          }

          // Check if the user has enough cash for the bet
          if (opponentData.cash < amount) {
            return channel.send(`ⓘ **${opponentMember.user.username}**, you don't have enough cash for a bet of <:kasiko_coin:1300141236841086977> **${parseInt(amount).toLocaleString()}**.`);
          }

          // Add this opponent to the participants list
          participants.push({
            id: msg.author.id,
            username: opponentMember.user.username,
            chosenHorse: opponentChosen,
            data: opponentData
          });

          await channel.send(`🏇🏻 **${opponentMember.user.username}** has joined the race, betting on **${opponentChosen === "horse1" ? "Horse 1": opponentChosen === "horse2" ? "Horse 2": "Horse 3"}!** 🥂`);

          // Stop collecting if all allowed opponents have joined
          if (participants.length >= (1 + allowedOpponentIds.length)) {
            collector.stop("max_joined");
          }
        } catch (error) {
          console.error("Error handling join:", error);
          await channel.send("⚠ An error occurred while processing a join entry.");
        }
      });

      collector.on("end",
        async (collected, reason) => {
          // If only the initiator is in the game, cancel and refund
          if (participants.length === 1) {
            return channel.send(`⏱️ No one joined the race. The game has been canceled and your bet has been refunded.`);
          }
          // Start the race with all participants
          await startRace(amount, participants, channel);
        });
    } else {
      // If no opponents were pinged, start the race immediately (solo race)
      await startRace(amount, participants, channel);
    }
    return;
  } catch (e) {
    console.error(e);
    return channel.send(`⚠ Oops! Something went wrong during the horse race!\n-# **Error**: ${e.message}`);
  }
}

// Function to simulate the race and handle winnings (friendly bet redistribution)
async function startRace(amount, participants, channel) {
  try {
    amount = parseInt(amount);

    // Deduct bet amount for each participant and update the database.
    for (const participant of participants) {
      participant.data.cash -= amount;
      await updateUser(participant.id, {
        cash: participant.data.cash
      });
    }

    // Setup race details
    const trackLength = 20;
    const horsesEmoji = {
      horse1: "<a:runningHorse:1326785483866374265>",
      horse2: "<a:runningHorse:1326785483866374265>",
      horse3: "<a:runningHorse:1326785483866374265>"
    };

    const suspenseMessage = await channel.send(`🏁 The race is about to begin!`);
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(2000);

    // Initialize positions for each horse.
    const horsePositions = {
      horse1: 0,
      horse2: 0,
      horse3: 0
    };

    // Start the race – update every 2 seconds.
    const raceInterval = setInterval(async () => {
      try {
        // Increase each horse's position by a random step
        horsePositions.horse1 += Math.floor(Math.random() * 8);
        horsePositions.horse2 += Math.floor(Math.random() * 8);
        horsePositions.horse3 += Math.floor(Math.random() * 8);

        // Build the race track strings.
        const track1 = `${' '.repeat(horsePositions.horse1)}${horsesEmoji.horse1}${' '.repeat(Math.max(0, trackLength - horsePositions.horse1))}|`;
        const track2 = `${' '.repeat(horsePositions.horse2)}${horsesEmoji.horse2}${' '.repeat(Math.max(0, trackLength - horsePositions.horse2))}|`;
        const track3 = `${' '.repeat(horsePositions.horse3)}${horsesEmoji.horse3}${' '.repeat(Math.max(0, trackLength - horsePositions.horse3))}|`;

        // List all participants and their chosen horses.
        let participantsInfo = participants.map(p => {
          const horseStr = p.chosenHorse === "horse1" ? "Horse 1": p.chosenHorse === "horse2" ? "Horse 2": "Horse 3";
          return `**${p.username}**: ${horseStr}`;
        }).join("\n");

        const embedTitle = new EmbedBuilder()
        .setDescription(`🏁 The race is on!\n\n**Participants:**\n${participantsInfo}`);

        await suspenseMessage.edit({
          content: "```Cheers for your horse 🐎```" +
          `\n${track1}\n${track2}\n${track3}\n`,
          embeds: [embedTitle]
        });

        // If any horse has finished, end the race.
        if (horsePositions.horse1 >= trackLength || horsePositions.horse2 >= trackLength || horsePositions.horse3 >= trackLength) {
          clearInterval(raceInterval);

          // Determine which horse(s) crossed the finish line.
          const finishedHorses = Object.entries(horsePositions).filter(([_, pos]) => pos >= trackLength);
          // Choose the winning horse: the one with the highest position.
          let winningHorse = finishedHorses.reduce((a, b) => a[1] > b[1] ? a: b)[0];

          // Identify winners and losers.
          const winners = participants.filter(p => p.chosenHorse === winningHorse);
          const losers = participants.filter(p => p.chosenHorse !== winningHorse);

          let resultEmbed;
          if (winners.length > 0) {
            // Calculate extra winnings: each winner gets their original bet back plus a share of the total losing bets.
            const losingPot = losers.length * amount;
            const share = losingPot / winners.length;

            if (participants.length === 1) {
              const winner = winners[0];
              winner.data.cash += amount * 3;
              await updateUser(winner.id, {
                cash: winner.data.cash
              });
            } else {
              for (const winner of winners) {
                winner.data.cash += amount + share;
                await updateUser(winner.id, {
                  cash: winner.data.cash
                });
              }
            }
            const winnersString = winners.map(w => `**${w.username}**`).join(", ");
            resultEmbed = new EmbedBuilder()
            .setTitle(`🏇🏻 ${winners.length === 1 ? "𝙒𝙞𝙣𝙣𝙚𝙧:": "𝙒𝙞𝙣𝙣𝙚𝙧𝙨:"} ${winnersString}`)
            .setDescription(
              `### ***:mirror_ball: The winning horse is \`${winningHorse === "horse1" ? "Horse 1": winningHorse === "horse2" ? "Horse 2": "Horse 3"}\`! ${horsesEmoji[winningHorse]}***\n` +
              `🏁┊ <:orange_fire:1336344438464839731> ${participants.length === 1 ? ` 𝘊𝘰𝘯𝘨𝘳𝘢𝘵𝘶𝘭𝘢𝘵𝘪𝘰𝘯𝘴! 𝘠𝘰𝘶'𝘷𝘦 𝘫𝘶𝘴𝘵 𝘸𝘰𝘯 𝘢𝘯 𝘦𝘹𝘵𝘳𝘢 <:kasiko_coin:1300141236841086977> **${amount * 2}**!`: `𝘌𝘢𝘤𝘩 𝘸𝘪𝘯𝘯𝘦𝘳 𝘳𝘦𝘤𝘦𝘪𝘷𝘦𝘴 𝘵𝘩𝘦𝘪𝘳 𝘣𝘦𝘵 𝘣𝘢𝘤𝘬 𝘱𝘭𝘶𝘴 𝘢𝘯 𝘦𝘹𝘵𝘳𝘢 <:kasiko_coin:1300141236841086977> **${share.toLocaleString()}** 𝘤𝘢𝘴𝘩 𝘧𝘳𝘰𝘮 𝘵𝘩𝘦 𝘭𝘰𝘴𝘪𝘯𝘨 𝘱𝘰𝘵.`}`
            )
            .setImage(`https://harshtiwari47.github.io/kasiko-public/images/horserace.jpg`)
            .setFooter({
              text: '𝑪𝒐𝒏𝒈𝒓𝒂𝒕𝒖𝒍𝒂𝒕𝒊𝒐𝒏𝒔 𝒐𝒏 𝒚𝒐𝒖𝒓 𝒘𝒊𝒏!'
            });
          } else {

            let participantsInfoNames = participants.map(p => {
              return `**${p.username}**`;
            }).join(" ");


            // (Edge case: Should not occur since at least one participant must have bet on the winning horse.)
            resultEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`🏇🏻 𝙉𝙤 𝙬𝙞𝙣𝙣𝙚𝙧𝙨 𝙩𝙝𝙞𝙨 𝙩𝙞𝙢𝙚***!***`)
            .setDescription(`🚫 The winning horse is **${winningHorse === "horse1" ? "Horse 1": winningHorse === "horse2" ? "Horse 2": "Horse 3"}!**\n-# ⪩ BET: <:kasiko_coin:1300141236841086977> **${amount}**\n-# ⪩ PARTICIPANT${participants.length > 0 ? "S": ""}: ${participantsInfoNames}`)
            .setImage(`https://harshtiwari47.github.io/kasiko-public/images/horserace.jpg`)
            .setFooter({
              text: `⨳ Better luck next time!`
            })
          }
          await suspenseMessage.edit({
            content: "",
            embeds: [resultEmbed]
          });
        }
      } catch (err) {
        if (!["Unknown Message", "Missing Permissions"].includes(err.message)) console.error(err);
      }
    },
      2000);
  } catch (e) {
    console.error(e);
    return channel.send(`⚠ Oops! Something went wrong during the horse race!\n-# **Error**: ${e.message}`);
  }
}

export default {
  name: "horserace",
  description: "Bet on a horse race and win or lose based on the result. Now you can invite up to 3 opponents and even bet on the same horse.",
  aliases: ["hr"],
  args: "<amount> <horse (1/2/3)> [@opponent(s) (optional)]",
  example: [
    "horserace 250 1",
    "hr 500 2 @Opponent1 @Opponent2"
  ],
  category: "🎲 Games",
  emoji: "🏇🏻",
  cooldown: 20000,

  async execute(args,
    message) {
    try {
      if (!args[1]) {
        return message.channel.send("ⓘ Please specify an amount. Use `horserace <amount/all> <1/2/3> [@opponent(s) (optional)]`.")
        .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let chosenHorse = "horse1"; // default
      const selectedHorse = args[2];
      if (selectedHorse) {
        const converted = convertHorse(selectedHorse);
        if (converted) chosenHorse = converted;
      }

      let amount;
      if (args[1].toLowerCase() === "all") {
        // If "all" is specified, use the initiator's full cash (after retrieving user data)
        const userData = await getUserData(message.author.id);
        if (!userData) return;
        amount = Math.min(userData.cash, 1500000);
      } else {
        amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 1000 || amount > 1500000) {
          return message.channel.send("⚠ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗮𝗺𝗼𝘂𝗻𝘁! The betting range is between <:kasiko_coin:1300141236841086977> **1,000** and <:kasiko_coin:1300141236841086977> **15,00,000**.")
          .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (amount > userData.cash) {
        return message.channel.send(`⚠ **${message.author.username}**, you don't have sufficient cash.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Get all mentioned opponents (up to 3), excluding the initiator.
      const opponentMentions = message.mentions.users.filter(u => u.id !== message.author.id);
      const opponentIds = opponentMentions.map(u => u.id).slice(0, 3);

      await horseRace(message.author.id, amount, message.channel, chosenHorse, opponentIds);
      return;
    } catch (error) {
      if (!["Unknown Message", "Missing Permissions"].includes(error.message)) console.error(error);
      return message.channel.send(`⚠ An unexpected error occurred while processing your bet. Please try again later.\n-# **Error:** ${error.message}`)
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};