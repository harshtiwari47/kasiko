import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "punch",
  description: "Punch another user with style.",
  aliases: ["hit",
    "smack"],
  cooldown: 4000,
  category: "Fun",
  execute: async (args, message) => {
    try {
      if (!args[1]) {
        return message.reply("You need to mention someone to punch!");
      }

      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to punch.");
      }

      // List of random texts
      const texts = [
        "threw a mighty punch! 💥",
        "delivered a knockout punch! 🥊",
        "landed a slap so hard, the ground shook! 👊",
        "hit with a whirlwind of punches! 🌀",
        "smacked with a punch of pure power! 🚀",
        "threw a playful punch. Don't take it personally! 😜",
        "landed a punch like a pro boxer! 🥋",
        "came in with a surprise jab! 😲",
        "punched like an anime hero! 💫",
        "unleashed a combo attack! 🎮"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://i.gifer.com/DB7S.gif',
        'https://i.gifer.com/2J9j.gif',
        'https://i.gifer.com/QRJ7.gif',
        'https://i.gifer.com/KiXv.gif',
        'https://i.gifer.com/Y7ek.gif',
        'https://i.gifer.com/ApIn.gif',
        'https://i.gifer.com/BlpF.gif',
        'https://i.gifer.com/AgVM.gif',
        'https://i.gifer.com/B60l.gif',
        'https://i.gifer.com/4msN.gif',
        'https://i.gifer.com/N32W.gif',
        'https://i.gifer.com/OWKl.gif'
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomText} **${target.username}**`)
      .setFooter({
        text: `Requested by ${message.author.tag} | Gif: gifer`
      })
      .setImage(randomGif); // Set a randomly selected GIF

      await message.reply({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};