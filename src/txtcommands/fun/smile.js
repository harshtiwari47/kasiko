import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "happy",
  description: "Share some happiness with a cheerful GIF!",
  aliases: ["joy",
    "smile", "laugh"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // List of random happy GIF URLs
      const gifs = [
        'https://i.gifer.com/84zd.gif',
        'https://i.gifer.com/1FdW.gif',
        'https://i.gifer.com/3YTP.gif',
        'https://i.gifer.com/Dm3l.gif',
        'https://i.gifer.com/Pz0V.gif',
        'https://i.gifer.com/NkvZ.gif',
        'https://i.gifer.com/A9H.gif',
        'https://i.gifer.com/2DV.gif',
        'https://i.gifer.com/RqC8.gif',
        'https://i.gifer.com/7AQ.gif',
        'https://i.gifer.com/ZL.gif',
        'https://i.gifer.com/285U.gif',
        'https://i.gifer.com/VW4M.gif',
        'https://i.gifer.com/Afdn.gif',
        'https://i.gifer.com/Ldb9.gif',
        'https://i.gifer.com/GmUB.gif',
        'https://i.gifer.com/3769.gif',
      ];

      // Randomly select a GIF
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription("Spreading some happiness! 😊")
      .setImage(randomGif) // Set a randomly selected happy GIF
      .setFooter({
        text: `giphy`
      });

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};