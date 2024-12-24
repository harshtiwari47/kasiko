import {
  getUserData,
  updateUser
} from '../../../database.js';

const randomMessages = [
  "💼 **{username}**, you're a powerhouse! You earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Keep up the grind!",
  "🔥 **{username}**, hard work pays off! You've earned <:kasiko_coin:1300141236841086977>**{cash}** cash. You're on fire!",
  "🚀 **{username}**, hustle mode activated! You've earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Your future's looking bright!",
  "🎉 **{username}**, victory is sweet! You earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Who knew work could feel this good?",
  "🌟 **{username}**, you've earned some serious cash: <:kasiko_coin:1300141236841086977>**{cash}**. You're unstoppable!"
];

export async function work(id, channel) {
  let workMessage;
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    const earnedCash = Math.floor(Math.random() * 1500) + 500;

    userData.cash += earnedCash;

    await updateUser(id, userData);

    const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];

    return workMessage = (randomMessage.replace("{username}", guild.user.username).replace("{cash}", earnedCash.toLocaleString()));
  } catch (e) {
    console.log(e);
    return workMessage = ("Oops! Something went wrong while working 💼!");
  }
}

export default {
  name: "work",
  description: "Earn a random amount of cash by working.",
  aliases: ["job",
    "earn"],
  args: "",
  example: ["work",
    "job",
    "earn"],
  related: ["tosscoin",
    "cash",
    "slots",
    "dice"],
  cooldown: 10000,
  category: "🏦 Economy",
  execute: async (args, message) => {
    let workReply = await work(message.author.id, message.channel);
    return message.channel.send(workReply);
  },

  // Interact function to handle Slash Command interaction
  interact: async (interaction) => {
    try {
      const userId = interaction.user.id;
      const channel = interaction.channel;

      // Call the work function
      let workReply = await work(userId, channel);

      // Respond to the slash command interaction
      await interaction.editReply({
        content: workReply
      });
      return;
    } catch (e) {
      console.log(e);
      // Handle any error and respond appropriately
      await interaction.editReply({
        content: "Oops! Something went wrong while working 💼. Please try again later!"
      });
      return;
    }
  }
};