import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';
import { sendErrorLog } from '../../../utils/errorLogger.js';

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
    try {
      const user = discordUser(message);
      let missionReply = await spyMission(user.id, message.channel, user);

      const finalEmbed = new EmbedBuilder()
      .setDescription(missionReply)
      .setAuthor({
        name: user.name || user.username,
        iconURL: user.avatar
      })
      .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/spy.jpg`)
      .setColor('Random');

      return await handleMessage(message, {
        embeds: [finalEmbed]
      });
    } catch (e) {
      sendErrorLog(e, {
        source: 'Spy Mission Command',
        commandName: 'spy',
        user: message.author || message.user,
        guild: message.guild,
        channel: message.channel,
        interaction: message.isCommand ? message : null
      }).catch(() => {});
      return await handleMessage(message, "Oops! Something went wrong during your spy mission. Please try again later!");
    }
  },

  interact: async (interaction) => {
    try {
      if (!interaction.deferred) {
        await interaction.deferReply({
          ephemeral: false
        });
      }

      const user = discordUser(interaction);
      const channel = interaction.channel;

      const missionReply = await spyMission(user.id, channel, user);

      const finalEmbed = new EmbedBuilder()
      .setDescription(missionReply)
      .setAuthor({
        name: user.name || user.username,
        iconURL: user.avatar
      })
      .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/spy.jpg`)
      .setColor('Random');

      return await handleMessage(interaction, {
        embeds: [finalEmbed]
      });
    } catch (e) {
      console.error(e);
      sendErrorLog(e, {
        source: 'Spy Mission Interaction',
        commandName: 'spy',
        user: interaction.user,
        guild: interaction.guild,
        channel: interaction.channel,
        interaction
      }).catch(() => {});
      return await handleMessage(interaction, {
        content: "Oops! Something went wrong during your spy mission. Please try again later!"
      });
    }
  }
};