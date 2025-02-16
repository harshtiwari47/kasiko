import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "magicball",
  description: "Ask the magic ball a question and receive a random answer!",
  aliases: ["8ball",
    "magic",
    "mb"],
  cooldown: 10000,
  args: "<question>",
  example: ["magicball Will I win the lottery?",
    "8ball Is it a good idea?"],
  category: "🧩 Fun",

  execute: async (args, message) => {
    // Check if a question is provided
    if (args.length === 1) {
      return message.reply("❓ Please ask a question! Example: `magicball Will I win the lottery?`").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    args.shift();

    // Magic 8-Ball Responses
    const responses = [
      "Yes, definitely!",
      "It is certain.",
      "Without a doubt.",
      "You may rely on it.",
      "As I see it, yes.",
      "Most likely.",
      "Outlook good.",
      "Yes.",
      "Signs point to yes.",
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      "Don't count on it.",
      "My reply is no.",
      "My sources say no.",
      "Outlook not so good.",
      "Very doubtful.",
    ];

    // Pick a random response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Create the embed
    const embed = new EmbedBuilder()
    .setTitle("🎱 Magic 8-Ball")
    .setDescription(`**Your Question:** ${args.join(" ")}\n**My Answer:** ${randomResponse}`)
    .setColor(0x5865f2)
    .setFooter({
      text: "Ask wisely!"
    });

    // Send the embed response
    return message.reply({
      embeds: [embed]
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  },
};