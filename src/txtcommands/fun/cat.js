import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "cat",
  description: "Send a random cat GIF.",
  aliases: ["kitty",
    "meow"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // List of random cat GIF URLs
      const gifs = [
        'https://i.gifer.com/3rIx.gif',
        'https://i.gifer.com/XsLh.gif',
        'https://i.gifer.com/TsI0.gif',
        'https://i.gifer.com/7CN1.gif',
        'https://i.gifer.com/NCla.gif',
        'https://i.gifer.com/ZKsV.gif',
        'https://i.gifer.com/fxVv.gif',
        'https://i.gifer.com/Vioe.gif',
        'https://i.gifer.com/7Irn.gif',
        'https://i.gifer.com/4Xli.gif',
        'https://i.gifer.com/VoBm.gif',
        'https://i.gifer.com/PRr0.gif',
        'https://i.gifer.com/fxU4.gif',
        'https://i.gifer.com/oEX.gif',
        'https://i.gifer.com/NFqM.gif',
        'https://i.gifer.com/O2eY.gif',
        'https://i.gifer.com/NOjP.gif',
        'https://i.gifer.com/ZdFt.gif',
        'https://i.gifer.com/Nm02.gif',
        'https://i.gifer.com/NX0s.gif',
        'https://i.gifer.com/2zKU.gif',
        'https://i.gifer.com/3Ky3.gif',
        'https://i.gifer.com/Ysvq.gif',
        'https://i.gifer.com/XJWS.gif',
        'https://i.gifer.com/y9Z.gif',
        'https://i.gifer.com/5etF.gif',
        'https://i.gifer.com/fxTZ.gif',
        'https://i.gifer.com/fxU5.gif',
        'https://i.gifer.com/7ZFG.gif',
        'https://i.gifer.com/EkII.gif',
        'https://i.gifer.com/C2K.gif',
        'https://i.gifer.com/ZEB9.gif',
        'https://i.gifer.com/3QeI.gif',
        'https://i.gifer.com/5GJg.gif',
        'https://i.gifer.com/4OVK.gif',
        'https://i.gifer.com/fy2H.gif'
      ];

      // Randomly select a GIF
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription("Here's a cute cat! 🐱")
      .setImage(randomGif) // Set a randomly selected cat GIF
      .setFooter({
        text: `Requested by ${message.author.tag} |  | Gif: gipher`
      });

      await message.reply({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};