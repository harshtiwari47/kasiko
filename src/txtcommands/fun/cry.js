import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "cry",
  description: "Express sadness with a crying GIF.",
  aliases: ["tears",
    "sob"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
    // List of random crying GIF URLs
    const gifs = [
    'https://i.gifer.com/2mla.gif',
    'https://i.gifer.com/DO2.gif',
    'https://i.gifer.com/WWEL.gif',
    'https://i.gifer.com/XJ1C.gif',
    'https://i.gifer.com/ZjWE.gif',
    'https://i.gifer.com/Yf7N.gif',
    'https://i.gifer.com/7JF.gif',
    'https://i.gifer.com/5s83.gif',
    'https://i.gifer.com/8lr.gif',
    'https://i.gifer.com/WJIn.gif',
    'https://i.gifer.com/5Umu.gif',
    'https://i.gifer.com/4k7R.gif',
    'https://i.gifer.com/4w3g.gif',
    'https://i.gifer.com/6d3s.gif',
    'https://i.gifer.com/6B2Z.gif',
    ];

    // Randomly select a GIF
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

    const embed = new EmbedBuilder()
    .setColor('Random')
    .setDescription(`Oh no, **${message.author.tag}** feeling sad. 😢`)
    .setImage(randomGif) // Set a randomly selected crying GIF
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