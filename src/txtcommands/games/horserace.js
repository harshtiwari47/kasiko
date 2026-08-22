import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper,
  handleMessage,
  discordUser
} from '../../../helper.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

function convertHorse(input) {
  if (!input) return null;
  input = input.toLowerCase();
  if (input === "1" || input === "horse1" || input === "horse 1") return "horse1";
  if (input === "2" || input === "horse2" || input === "horse 2") return "horse2";
  if (input === "3" || input === "horse3" || input === "horse 3") return "horse3";
  return null;
}

export async function horseRace(initiatorId, amount, context, chosenHorseInput, allowedOpponentIds = []) {
  try {
    const { name: initiatorName } = discordUser(context);
    const client = context.client || context.channel?.client;
    const initiatorUser = await client?.users?.fetch(initiatorId).catch(() => null) || { username: initiatorName || 'Challenger', id: initiatorId };

    let initiatorData = await getUserData(initiatorId);
    if (!initiatorData) {
      return await handleMessage(context, "⚠️ Account not found. Please register first.");
    }

    const chosenHorse = convertHorse(chosenHorseInput);
    if (!chosenHorse) {
      return await handleMessage(context, "⚠️ Invalid horse selection. Please choose **1**, **2** or **3**.");
    }

    if (amount > Number(initiatorData.cash || 0)) {
      return await handleMessage(context, `⚠️ **${initiatorUser.username}**, you don't have sufficient cash to place this bet.`);
    }

    let participants = [{
      id: initiatorId,
      username: initiatorUser.username,
      chosenHorse
    }];

    // If opponents were pinged, allow them to join via buttons
    if (allowedOpponentIds.length > 0) {
      const mentionList = allowedOpponentIds.map(id => `<@${id}>`).join(" ");

      const joinRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('hr_join_1')
          .setLabel('Join: Horse 1')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hr_join_2')
          .setLabel('Join: Horse 2')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('hr_join_3')
          .setLabel('Join: Horse 3')
          .setStyle(ButtonStyle.Danger)
      );

      const challengeMsg = await handleMessage(context, {
        content: `🏇 **${initiatorUser.username}** has started a Horse Race for <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**!\n` +
          `${mentionList}, click a button to pick a horse and join the race!\n-# 25 seconds remaining to join.`,
        components: [joinRow]
      });

      if (challengeMsg?.createMessageComponentCollector) {
        const collector = challengeMsg.createMessageComponentCollector({
          filter: i => allowedOpponentIds.includes(i.user.id),
          componentType: ComponentType.Button,
          time: 25000
        });

        collector.on("collect", async (i) => {
          try {
            if (participants.some(p => p.id === i.user.id)) {
              return await i.reply({ content: "⚠️ You have already joined the race!", ephemeral: true });
            }

            const opponentData = await getUserData(i.user.id);
            if (!opponentData || Number(opponentData.cash || 0) < amount) {
              return await i.reply({ content: `⚠️ You don't have enough cash (<:kasiko_coin:1300141236841086977> ${amount.toLocaleString()}) to join!`, ephemeral: true });
            }

            let opponentChosen = "horse1";
            if (i.customId === 'hr_join_2') opponentChosen = "horse2";
            if (i.customId === 'hr_join_3') opponentChosen = "horse3";

            participants.push({
              id: i.user.id,
              username: i.user.username,
              chosenHorse: opponentChosen
            });

            await i.reply({ content: `✅ You joined the race on **${opponentChosen.toUpperCase()}**!`, ephemeral: true });

            if (participants.length >= (1 + allowedOpponentIds.length)) {
              collector.stop("max_joined");
            }
          } catch (error) {
            console.error("Error handling horse race join:", error);
          }
        });

        collector.on("end", async () => {
          if (challengeMsg?.edit) {
            await challengeMsg.edit({ components: [] }).catch(() => {});
          }

          if (participants.length === 1 && allowedOpponentIds.length > 0) {
            return await handleMessage(context, "⌛ No opponents joined the race. The game was cancelled.");
          }

          await startRace(amount, participants, context);
        });
        return;
      }
    }

    // Solo race if no opponents were invited
    await startRace(amount, participants, context);

  } catch (e) {
    console.error('HorseRace Global Error:', e);
    return await handleMessage(context, `⚠️ Oops! Something went wrong during the horse race.`);
  }
}

async function startRace(amount, participants, context) {
  try {
    amount = parseInt(amount, 10);

    // Verify and deduct initial bets
    for (const participant of participants) {
      const freshUser = await getUserData(participant.id);
      if (!freshUser || Number(freshUser.cash || 0) < amount) {
        return await handleMessage(context, `⚠️ Race cancelled: **${participant.username}** no longer has sufficient cash.`);
      }
      await updateUser(participant.id, {
        cash: Math.max(0, Number(freshUser.cash || 0) - amount)
      });
    }

    const trackLength = 20;
    const horsesEmoji = {
      horse1: "<a:runningHorse:1326785483866374265>",
      horse2: "<a:runningHorse:1326785483866374265>",
      horse3: "<a:runningHorse:1326785483866374265>"
    };

    const suspenseMessage = await handleMessage(context, {
      content: "🏇 **The race is about to begin! Hold your breath...**"
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const horsePositions = { horse1: 0, horse2: 0, horse3: 0 };

    for (let round = 0; round < 10; round++) {
      horsePositions.horse1 += Math.floor(Math.random() * 8) + 1;
      horsePositions.horse2 += Math.floor(Math.random() * 8) + 1;
      horsePositions.horse3 += Math.floor(Math.random() * 8) + 1;

      const track1 = `${' '.repeat(Math.min(trackLength, horsePositions.horse1))}${horsesEmoji.horse1}${' '.repeat(Math.max(0, trackLength - horsePositions.horse1))}|`;
      const track2 = `${' '.repeat(Math.min(trackLength, horsePositions.horse2))}${horsesEmoji.horse2}${' '.repeat(Math.max(0, trackLength - horsePositions.horse2))}|`;
      const track3 = `${' '.repeat(Math.min(trackLength, horsePositions.horse3))}${horsesEmoji.horse3}${' '.repeat(Math.max(0, trackLength - horsePositions.horse3))}|`;

      let participantsInfo = participants.map(p => {
        const horseStr = p.chosenHorse === "horse1" ? "Horse 1 🐎" : p.chosenHorse === "horse2" ? "Horse 2 🐎" : "Horse 3 🐎";
        return `• **${p.username}**: ${horseStr}`;
      }).join("\n");

      const embedTitle = new EmbedBuilder()
        .setDescription(`🏇 **The race is on!**\n\n**Participants:**\n${participantsInfo}`)
        .setColor(0xf1c40f);

      if (suspenseMessage?.edit) {
        await suspenseMessage.edit({
          content: "\`\`\`Cheers for your horse!\`\`\`" + `\n${track1}\n${track2}\n${track3}\n`,
          embeds: [embedTitle]
        }).catch(() => {});
      }

      if (horsePositions.horse1 >= trackLength || horsePositions.horse2 >= trackLength || horsePositions.horse3 >= trackLength) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const finished = Object.entries(horsePositions);
    let winningHorse = finished.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    const winners = participants.filter(p => p.chosenHorse === winningHorse);
    const losers = participants.filter(p => p.chosenHorse !== winningHorse);

    let resultDescription = `🏆 **${winningHorse.toUpperCase()}** crossed the finish line first!\n\n`;

    if (winners.length > 0) {
      if (participants.length === 1) {
        // Solo race reward (3x payout)
        const payout = amount * 3;
        const winner = winners[0];
        const freshUser = await getUserData(winner.id);
        await updateUser(winner.id, { cash: Number(freshUser?.cash || 0) + payout });
        resultDescription += `🎉 **${winner.username}** won <:kasiko_coin:1300141236841086977> **${payout.toLocaleString()}** cash!`;
      } else {
        const losingPot = losers.length * amount;
        const share = Math.floor(losingPot / winners.length);
        for (const winner of winners) {
          const payout = amount + share;
          const freshUser = await getUserData(winner.id);
          await updateUser(winner.id, { cash: Number(freshUser?.cash || 0) + payout });
          resultDescription += `🎉 **${winner.username}** won <:kasiko_coin:1300141236841086977> **${payout.toLocaleString()}** cash!\n`;
        }
      }
    } else {
      resultDescription += `😢 None of the participants picked the winning horse! Better luck next time.`;
    }

    const finalEmbed = new EmbedBuilder()
      .setTitle("🏁 Race Results")
      .setDescription(resultDescription)
      .setColor(winners.length > 0 ? 0x2ecc71 : 0xe74c3c);

    if (suspenseMessage?.edit) {
      await suspenseMessage.edit({ content: "🏁 **Race Finished!**", embeds: [finalEmbed] }).catch(() => {});
    } else {
      await handleMessage(context, { embeds: [finalEmbed] });
    }

  } catch (error) {
    console.error("Error in startRace:", error);
  }
}

export default {
  name: "horserace",
  description: "Bet on a horse race and win or lose based on the result. Invite opponents or race solo.",
  aliases: ["hr"],
  args: "<amount> <horse (1/2/3)> [@opponent(s) (optional)]",
  example: [
    "horserace 250 1",
    "hr 500 2 @Opponent1 @Opponent2"
  ],
  category: "🎲 Games",
  emoji: "<:horse_brown:1314077268447985725>",
  cooldown: 10000,

  async execute(args, message) {
    try {
      const { id: authorId, name } = discordUser(message);

      if (!args[1]) {
        return await handleMessage(message, "⚠️ Please specify an amount. Use: horserace <amount/all> <1/2/3> [@opponent(s)]");
      }

      let chosenHorse = "horse1";
      const selectedHorse = args[2];
      if (selectedHorse) {
        const converted = convertHorse(selectedHorse);
        if (converted) chosenHorse = converted;
      }

      let amount;
      if (args[1].toLowerCase() === "all") {
        const userData = await getUserData(authorId);
        if (!userData) return;

        if (Number(userData.cash || 0) < 1000) {
          return await handleMessage(message, "⚠️ You need at least <:kasiko_coin:1300141236841086977> **1,000** to place a bet.");
        }
        amount = Math.min(Number(userData.cash || 0), 1500000);
      } else {
        amount = parseInt(args[1], 10);
        if (isNaN(amount) || amount < 1000 || amount > 1500000) {
          return await handleMessage(message, "⚠️ The betting range is between <:kasiko_coin:1300141236841086977> **1,000** and <:kasiko_coin:1300141236841086977> **1,500,000**.");
        }
      }

      let opponentIds = [];
      if (message.mentions?.users) {
        const opponentMentions = message.mentions.users.filter(u => u.id !== authorId);
        opponentIds = opponentMentions.map(u => u.id).slice(0, 3);
      }

      await horseRace(authorId, amount, message, chosenHorse, opponentIds);
    } catch (error) {
      console.error("HorseRace Execute Error:", error);
      return await handleMessage(message, "⚠️ An unexpected error occurred while processing your bet. Please try again later.");
    }
  }
};
