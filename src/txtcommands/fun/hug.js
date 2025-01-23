import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "hug",
  description: "Hug another user warmly.",
  aliases: ["embrace",
    "cuddle"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to hug.");
      }

      // List of random texts
      const texts = [
        "wrapped them in a warm hug! 🫂",
        "gave a bear hug! 🐻",
        "shared a comforting embrace. 💞",
        "hugged like there’s no tomorrow! 🤗",
        "gave a gentle squeeze. 💗",
        "shared a happy cuddle! 🥰",
        "hugged tightly and wouldn’t let go! 🤲",
        "gave a surprise hug from behind! 🎉",
        "shared a heartfelt hug. 💖",
        "hugged like a long-lost friend! 💕"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://i.gifer.com/5VU.gif',
        'https://i.gifer.com/1ak.gif',
        'https://i.gifer.com/8X6d.gif',
        'https://i.gifer.com/5V9.gif',
        'https://i.gifer.com/2MjD.gif',
        'https://i.gifer.com/3XEo.gif',
        'https://i.gifer.com/ZRLJ.gif',
        'https://i.gifer.com/Bvr.gif',
        'https://i.gifer.com/13Vc.gif',
        'https://i.gifer.com/Txh9.gif',
        'https://i.gifer.com/GAMC.gif',
        'https://media4.giphy.com/media/du8yT5dStTeMg/giphy.gif?cid=6c09b95273alyhgkv1nqoxwvavgair8fdlcvdkctoklrjrp4&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/wnsgren9NtITS/giphy.gif?cid=6c09b9520lp01fp7z36gycmbozikezu926vsibrarhyj6e0m&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
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