import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "hi",
  description: "Greet another user with a friendly 'hi'!",
  aliases: ["hello",
    "hey"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      if (!args[1]) {
        return message.reply("You need to mention someone to say hi to!");
      }

      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to greet.");
      }

      const gifs = ["https://media0.giphy.com/media/rtStMh1J4VK4TgiSD6/giphy.gif?cid=6c09b952ulgk34f7be3kkxpghzq1ucit1fpen1g2epg49yh6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g"];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)]: null;

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setFooter({
        text: `giphy`
      });

      if (randomGif) embed.setImage(randomGif); // Add GIF only if available

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};