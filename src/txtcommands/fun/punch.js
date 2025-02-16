import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "punch",
  description: "Punch another user with style.",
  aliases: ["hit",
    "smack"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to punch.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
        'https://i.gifer.com/OWKl.gif',
        'https://media4.giphy.com/media/xUPGckXfbVgnITuvYY/giphy.gif?cid=6c09b952i6bzhp6bfypyo7usavd6fvxrb9saww38vsp7vnxj&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({
        name: `${message.author.username} ${randomText} ${target.username}`,
        iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })
      .setImage(randomGif); // Set a randomly selected GIF

      await message.channel.send({
        embeds: [embed]
      })
      return;
    } catch (e) {
      console.error(e);
      return;
    }
  },
};