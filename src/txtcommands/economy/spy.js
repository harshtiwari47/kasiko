import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';

export async function spyMission(id, channel, user) {
  try {
    const userData = await getUserData(id);
    if (!userData || !user) {
      return "Oops! Something went wrong during your spy mission 🕵️‍♂️!";
    }

    if (userData.cash < 5000) {
      return `🕵️‍♂️ **${user.username}**, you need at least <:kasiko_coin:1300141236841086977>5,000 cash to embark on a spy mission!`;
    }

    // Define outcomes with weighted chances and details.
    const outcomes = [{
      type: 'bigSuccess',
      chance: 5,
      description: "You infiltrated a high-security facility and stole top-secret documents, earning you <:kasiko_coin:1300141236841086977>{cash} cash!",
      cashRange: [3000,
        5000]
    },
      {
        type: 'bigSuccess',
        chance: 5,
        description: "Your covert operation uncovered a massive conspiracy, netting you <:kasiko_coin:1300141236841086977>{cash} cash!",
        cashRange: [3000,
          5000]
      },
      {
        type: 'moderateSuccess',
        chance: 10,
        description: "You gathered valuable intel during a stakeout, earning you <:kasiko_coin:1300141236841086977>{cash} cash.",
        cashRange: [1600,
          3000]
      },
      {
        type: 'moderateSuccess',
        chance: 10,
        description: "Your hacking skills intercepted a crucial message, adding <:kasiko_coin:1300141236841086977>{cash} cash to your account.",
        cashRange: [1600,
          3000]
      },
      {
        type: 'failure',
        chance: 10,
        description: "Your mission went sideways when security caught you red-handed. You lost <:kasiko_coin:1300141236841086977>{cash} cash as a penalty.",
        penaltyRange: [500,
          1000]
      },
      {
        type: 'failure',
        chance: 10,
        description: "A rival spy foiled your plan, and you had to pay a hefty fine of <:kasiko_coin:1300141236841086977>{cash} cash.",
        penaltyRange: [500,
          1000]
      }];

    //  random selection.
    const totalChance = outcomes.reduce((sum, outcome) => sum + outcome.chance, 0);
    const randomNum = Math.random() * totalChance;
    let cumulative = 0;
    let selectedOutcome = outcomes.find(outcome => {
      cumulative += outcome.chance;
      return randomNum <= cumulative;
    });

    if (!selectedOutcome) {
      return "The spy mission fizzled out unexpectedly!";
    }

    let finalMessage = "";
    if (selectedOutcome.type === 'bigSuccess' || selectedOutcome.type === 'moderateSuccess') {
      const [min,
        max] = selectedOutcome.cashRange;
      const earnedCash = Math.floor(Math.random() * (max - min + 1)) + min;
      userData.cash += earnedCash;
      await updateUser(id, {
        cash: userData.cash
      });
      finalMessage = selectedOutcome.description.replace("{cash}", earnedCash.toLocaleString());
    } else if (selectedOutcome.type === 'failure') {
      const [min,
        max] = selectedOutcome.penaltyRange;
      const lostCash = Math.floor(Math.random() * (max - min + 1)) + min;
      userData.cash = Math.max(0, userData.cash - lostCash);
      await updateUser(id, {
        cash: userData.cash
      });
      finalMessage = selectedOutcome.description.replace("{cash}", lostCash.toLocaleString());
    }

    return `🕵️‍♂️ **${user.username}**: ${finalMessage}`;
  } catch (e) {
    console.error(e);
    return "Oops! Something went wrong during your spy mission. Please try again later!";
  }
}

export default {
  name: "spymission",
  description: "Embark on a covert spy mission—risk it all to score top-secret cash rewards or face hefty penalties!",
  aliases: ["spy",
    "mission"],
  args: "",
  example: ["spymission",
    "spy",
    "mission"],
  emoji: "🕵️‍♂️",
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🏦 Economy",
  execute: async (args, message) => {
    let missionReply = await spyMission(message.author.id, message.channel, message.author);

    const finalEmbed = new EmbedBuilder()
    .setDescription(missionReply)
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/spy.jpg`)
    .setColor('Random');

    await message.channel.send({
      embeds: [finalEmbed]
    })
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return;
  },

  interact: async (interaction) => {
    try {
      await interaction.deferReply({
        ephemeral: false
      });

      const userId = interaction.user.id;
      const user = interaction.user;
      const channel = interaction.channel;

      const missionReply = await spyMission(userId, channel, user);

      const finalEmbed = new EmbedBuilder()
      .setDescription(missionReply)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({
          dynamic: true
        })
      })
      .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/spy.jpg`)
      .setColor('Random');

      await interaction.editReply({
        embeds: [finalEmbed]
      });
      return;
    } catch (e) {
      console.error(e);
      await interaction.editReply({
        content: "Oops! Something went wrong during your spy mission. Please try again later!"
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      return;
    }
  }
};