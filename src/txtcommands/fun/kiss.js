import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "kiss",
  description: "Send a sweet kiss to someone.",
  aliases: ["smooch",
    "mwah"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      if (!args[1]) {
        return message.reply("You need to mention someone to kiss!");
      }

      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to kiss.");
      }

      // List of random texts
      const texts = [
        "gave a sweet kiss! 💋",
        "planted a gentle smooch! 😘",
        "shared a romantic kiss! 💞",
        "blew a kiss across the room! 😚",
        "stole a kiss sneakily! 🥰",
        "shared a passionate kiss! 💓",
        "gave a quick peck! 💕",
        "kissed like they’re in a romantic movie! 🎥",
        "blew a playful kiss! 😜",
        "gave a loving kiss! 💖"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://i.gifer.com/8ZwP.gif',
        'https://i.gifer.com/2uEt.gif',
        'https://i.gifer.com/FChS.gif',
        'https://i.gifer.com/XrqL.gif',
        'https://i.gifer.com/67d3.gif',
        'https://i.gifer.com/G9IU.gif',
        'https://i.gifer.com/XkMW.gif',
        'https://i.gifer.com/Lyne.gif',
        'https://i.gifer.com/8R91.gif',
        'https://i.gifer.com/AODj.gif',
        'https://i.gifer.com/D0EE.gif',
        'https://i.gifer.com/Hivs.gif'
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomText} **${target.username}**`)
      .setFooter({
        text: `giphy`
      })
      .setImage(randomGif); // Set a randomly selected GIF

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};