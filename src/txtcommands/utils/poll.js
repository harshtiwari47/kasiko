import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "poll",
  description: "Create a poll with a yes/no question.",
  aliases: ["survey"],
  example: ["poll How many users agree with mod?"],
  cooldown: 6000,
  category: "Utility",

  execute: async (args, message) => {
    args.shift();
    // Ensure the user has provided a question for the poll
    if (!args.length) {
      return message.reply("❌ Please provide a question for the poll!");
    }

    // Join the user's arguments into a single string for the poll question
    const question = args.join(" ");

    // Create the poll embed
    const embed = new EmbedBuilder()
    .setTitle("Poll")
    .setDescription(`${question}`)
    .setColor(0x212438)
    .setFooter({
      text: "React with 👍 for Yes, 👎 for No"
    });

    // Send the poll message
    const pollMessage = await message.reply({
      embeds: [embed]
    });

    // React with thumbs up and thumbs down for voting
    await pollMessage.react("👍");
    await pollMessage.react("👎");

    return;
  },
};