import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "ily",
  description: "Express your love to another user.",
  aliases: ["loveu",
    "iloveyou"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();

      const texts = [
        "said I love you to",
        "expressed their love for"
      ];

      const gifs = [
        'https://media.discordapp.net/attachments/1331633832251887711/1331634719217160214/oz-oz-yarimasu.gif?ex=679254f9&is=67910379&hm=8f0251f7636c52bdb385f4efb6329e8c5d39643ac677b5d891dd6c0ddf5e184c&'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setImage(randomGif)

      if (target) {
        embed.setDescription(`**${message.author.username}** ${randomText} **${target.username}**! ❤️`)
      }

      await message.channel.send({
        embeds: [embed]
      })
      return;
    } catch (e) {
      console.error(e);
    }
  },
};