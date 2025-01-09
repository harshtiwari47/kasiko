import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "hii",
  description: "Greet another user with a friendly 'hi'!",
  aliases: ["hello",
    "hey", "hi"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const embed = new EmbedBuilder()
      .setColor('Random')
      .setFooter({
        text: `giphy`
      })
      .setImage(`https://media0.giphy.com/media/rtStMh1J4VK4TgiSD6/giphy.gif?cid=6c09b952ulgk34f7be3kkxpghzq1ucit1fpen1g2epg49yh6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g`); // Add GIF only if available

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};