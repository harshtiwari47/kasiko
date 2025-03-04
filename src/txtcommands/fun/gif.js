import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "gif",
  description: "Greet another user with a friendly 'hi'!",
  aliases: ["gg"],
  cooldown: 10000,
  category: "🧩 Fun",
  visible: false,
  execute: async (args, message) => {
    try {
      let keyword = args[1]?.toLowerCase();
      let embed = new EmbedBuilder()
      .setColor('Random');

      embed.setImage(`https://media.discordapp.net/attachments/1346413292242866208/1346413436552351835/ezgif-3cb93bd190325e.gif?ex=67c818ba&is=67c6c73a&hm=4077adc9c23029b8d12fabbd8f22ff35ff101e31073bca264ee39dc8a678275a&`);

      if (keyword === "robert") {
        embed.setImage(`https://media.discordapp.net/attachments/1346413292242866208/1346413436959064074/ezgif-34505b1d7fa1d5.gif?ex=67c818ba&is=67c6c73a&hm=395abeec562721e95fc7564342408780bca2820df6fc36ae6e6334681bffd550&`);
      }

      if (keyword === "love") {
        embed.setImage(`https://media.discordapp.net/attachments/1346413292242866208/1346413437776953374/ezgif-3a6065d70e21d8.gif?ex=67c818ba&is=67c6c73a&hm=72873752acf4244f9bc7fd1875f0f556a80cfd6ed2ad163e1effecc5b3cf7364&`);
      }

      if (keyword === "gojo") {
        embed.setImage(`https://media.discordapp.net/attachments/1346413292242866208/1346413437374173214/ezgif-3cfcc36dcb90d6.gif?ex=67c818ba&is=67c6c73a&hm=7446326b7215f8700068deab318d596bed61ea8ed87ae931d4870402c4df93d0&`);
      }

      if (keyword === "saviour") {
        embed.setImage(`https://media.discordapp.net/attachments/1346413292242866208/1346415094879228016/ezgif-3e203e0cace377.gif?ex=67c81a45&is=67c6c8c5&hm=5345d667c54c9cbff6d6656be138fe1ecc0f3bc6d4223c563d4f5219724b8f7f&`);
      }

      await message.channel.send({
        embeds: [embed]
      })
    } catch (e) {
      console.error(e);
    }
  },
};