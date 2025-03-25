import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';

export async function pizzaToss(id, channel, user) {
  try {
    const userData = await getUserData(id);
    if (!userData || !user) {
      return "Oops! Something went wrong during your pizza toss!";
    }

    // Define outcomes with weighted chances.
    const outcomes = [{
      type: 'bigSuccess',
      chance: 5,
      description: "Your pizza soared perfectly through the air, landing on a gourmet plate with extra cheese! You earned <:kasiko_coin:1300141236841086977>{cash} cash!",
      cashRange: [3000,
        5000]
    },
      {
        type: 'bigSuccess',
        chance: 5,
        description: "Your epic toss set off a chain reaction of applause as your pizza hit the bullseye—extra toppings included! You earned <:kasiko_coin:1300141236841086977>{cash} cash!",
        cashRange: [3000,
          5000]
      },
      {
        type: 'moderate',
        chance: 8,
        description: "Your toss was solid and landed the pizza neatly. You earned <:kasiko_coin:1300141236841086977>{cash} cash.",
        cashRange: [1500,
          2500]
      },
      {
        type: 'moderate',
        chance: 6,
        description: "Your pizza wobbled mid-air but still landed with style—earning you <:kasiko_coin:1300141236841086977>{cash} cash.",
        cashRange: [1500,
          2500]
      },
      {
        type: 'neutral',
        chance: 8,
        description: "Your pizza landed in a rather average manner. Not spectacular, but you got <:kasiko_coin:1300141236841086977>{cash} cash for your effort.",
        cashRange: [1000,
          1500]
      },
      {
        type: 'neutral',
        chance: 4,
        description: "Your toss was oddly balanced—your pizza spins in slow motion before settling. You received <:kasiko_coin:1300141236841086977>{cash} cash.",
        cashRange: [1000,
          1500]
      },
      {
        type: 'failure',
        chance: 7,
        description: "Disaster struck! Your pizza got caught in a tree and turned soggy, costing you <:kasiko_coin:1300141236841086977>{cash} cash.",
        penaltyRange: [1000,
          2000]
      },
      {
        type: 'failure',
        chance: 5,
        description: "Your toss backfired—the pizza collided with a rival delivery guy, leaving a mess. You were fined <:kasiko_coin:1300141236841086977>{cash} cash.",
        penaltyRange: [2000,
          3000]
      },
      {
        type: 'failure',
        chance: 4,
        description: "Your toss went awry—your pizza splattered everywhere, and cleanup costs you <:kasiko_coin:1300141236841086977>{cash} cash.",
        penaltyRange: [1500,
          2500]
      },
      {
        type: 'bonus',
        chance: 4,
        description: "Lucky break! A famous food critic witnessed your toss and tipped you extra. You earned a bonus of <:kasiko_coin:1300141236841086977>{cash} cash!",
        cashRange: [2500,
          3500]
      },
      {
        type: 'bonus',
        chance: 3,
        description: "Your pizza toss was so innovative that a viral video was made about it—bonus <:kasiko_coin:1300141236841086977>{cash} cash added to your account!",
        cashRange: [2000,
          3000]
      }];

    // Calculate total weight and select an outcome based on a weighted random draw.
    const totalChance = outcomes.reduce((sum, outcome) => sum + outcome.chance, 0);
    const randomNum = Math.random() * totalChance;
    let cumulative = 0;
    const selectedOutcome = outcomes.find(outcome => {
      cumulative += outcome.chance;
      return randomNum <= cumulative;
    });

    if (!selectedOutcome) {
      return "The pizza toss ended in utter confusion!";
    }

    let resultMessage = "";
    if (
      selectedOutcome.type === 'bigSuccess' ||
      selectedOutcome.type === 'moderate' ||
      selectedOutcome.type === 'neutral' ||
      selectedOutcome.type === 'bonus'
    ) {
      const [min,
        max] = selectedOutcome.cashRange;
      const earnedCash = Math.floor(Math.random() * (max - min + 1)) + min;
      userData.cash += earnedCash;
      await updateUser(id, {
        cash: userData.cash
      });
      resultMessage = selectedOutcome.description.replace("{cash}", earnedCash.toLocaleString());
    } else if (selectedOutcome.type === 'failure') {
      const [min,
        max] = selectedOutcome.penaltyRange;
      const lostCash = Math.floor(Math.random() * (max - min + 1)) + min;
      userData.cash = Math.max(0, userData.cash - lostCash);
      await updateUser(id, {
        cash: userData.cash
      });
      resultMessage = selectedOutcome.description.replace("{cash}", lostCash.toLocaleString());
    }

    // Construct a markdown UI message.
    const finalMessage = `
    ## 🍕 **Pizza Toss Challenge!**\n`+
    `### **${user.username}**, here are your results:\n` +

    `> **Outcome:** ${resultMessage}\n` +
    `**Current Balance:** <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}
    `;

    return finalMessage;
  } catch (e) {
    console.error(e);
    return "Oops! Something went wrong during your pizza toss!";
  }
}

export default {
  name: "pizzatoss",
  description: "Toss your pizza and see if you land a cheesy masterpiece or end up in a hilarious mess!",
  aliases: ["pizzatoss",
    "pizza"],
  args: "",
  example: ["pizzatoss",
    "pizza"],
  emoji: "🍕",
  // 20 seconds cooldown
  cooldown: 10000,
  category: "🎲 Games",
  execute: async (args, message) => {
    let reply = await pizzaToss(message.author.id, message.channel, message.author);

    const finalEmbed = new EmbedBuilder()
    .setDescription(reply)
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })
    .setColor('Random');

    await message.channel.send({
      embeds: [finalEmbed]
    })
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  },
  interact: async (interaction) => {
    try {
      const userId = interaction.user.id;
      const user = interaction.user;
      const channel = interaction.channel;
      const reply = await pizzaToss(userId, channel, user);

      const finalEmbed = new EmbedBuilder()
      .setDescription(reply)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor('Random');

      await interaction.editReply({
        embeds: [finalEmbed]
      });
      return;
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "Oops! Something went wrong during your pizza toss. Please try again later!"
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    }
  }
};