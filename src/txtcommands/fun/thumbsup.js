import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "thumbs",
  description: "Give a thumbs up to another user.",
  aliases: ["like",
    "approve",
    "thumbsup"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const gifs = ["https://media.discordapp.net/attachments/1331633832251887711/1331634719661625404/alarm.gif?ex=679254f9&is=67910379&hm=f3a83b07748b524e569c4c0916fc878cd6cdf248df025eaa84c8d2c31ccbd547&"];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setImage(randomGif)
      .setAuthor({
        name: "Great job!",
        iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })

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