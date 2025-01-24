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
        'https://media1.giphy.com/media/wnsgren9NtITS/giphy.gif?cid=6c09b9520lp01fp7z36gycmbozikezu926vsibrarhyj6e0m&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332343218263822429/hug-anime.mp4?ex=6794e8d0&is=67939750&hm=ec2ec2b6899acfe0913e12257cecdb765226ef796bcfe6eff7425a58f6f8b69d&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332343218649432134/enage-kiss-anime-hug.mp4?ex=6794e8d1&is=67939751&hm=37bf050fd38f8295907a445fb247c94519b2b51cf40f2fde62ecc7032fa1d192&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332343218959945852/anime-hug.mp4?ex=6794e8d1&is=67939751&hm=5ef2aded74d8a1b1669f834e489a0f11d48fc84d845687a957f4b2aa3470ab8c&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332343219371114601/horimiya-hori.mp4?ex=6794e8d1&is=67939751&hm=359e82c9bff761e35d71678a1d731ec8345dbdd03c65898cf6d445fd0ca10580&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332343219773509752/anime-couples.mp4?ex=6794e8d1&is=67939751&hm=01aa17e7765e295a1ab6bb802bcf130f977af4c1977ba737ee9124a01e344168&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332344666904854538/hug.mp4?ex=6794ea2a&is=679398aa&hm=211e6c470db653a13a8b88e07d1aed6203f3eab09ac5d2f22f503197c85a69ba&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332344667190071356/excited-hug.mp4?ex=6794ea2a&is=679398aa&hm=45f504b751b903cad0a30c906e4511c0c8e86ffbf47c9b55b6b6b774361093f8&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332344667576205342/hug-darker-than-black.mp4?ex=6794ea2a&is=679398aa&hm=499b6521fff7889e8ba82202f45253393e466f6a1a20061b45d2d4e56ef36175&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332344667941113867/hug-anime-1.mp4?ex=6794ea2a&is=679398aa&hm=82df6815771a6e0c5030f668661a9d45cb83bd37f6f3210b773c78e049cc1161&'
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