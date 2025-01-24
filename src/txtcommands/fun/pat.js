import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "pat",
  description: "Gently pat another user.",
  aliases: ["headpat",
    "love"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to pat.");
      }

      const texts = [
        "gently patted",
        "gave a headpat to",
        "softly patted",
        "patted",
        "affectionately patted",
        "gave a warm pat to"
      ];

      const gifs = [
        'https://media2.giphy.com/media/7ihhFw8q0LzBS/giphy.gif?cid=6c09b952ol4sxf1r3jp1lj9ujook0wmh2xdg565cpcvezrhd&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/3o6Mbm9fp9BG68Qi2s/giphy.gif?cid=6c09b9526316z87xpj2vuzoex73l023n5xj112pztljkseb9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/GelPw7ENPaPnW4F3Iw/giphy.gif?cid=6c09b952zeogcwascjqdtxakuui3uj7fgpgytns7bs5umib6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/e7xQm1dtF9Zni/giphy.gif?cid=6c09b952eb0ezn1zlbt9zb593dbs2r9esjesim6vbir5b8sc&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/4HP0ddZnNVvKU/giphy.gif?cid=6c09b95236cf1o4wbn5uagknopivtodjyz189obicdu1zsn6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/ARSp9T7wwxNcs/giphy.gif?cid=6c09b952oas8tnp17oa8oto9d3angmtf6dnwdcdg0pgfyssu&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/109ltuoSQT212w/giphy.gif?cid=6c09b952ut4satde9e4nzrrdoecw0hxs1t0oq4t37ahz1be8&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif?cid=6c09b952wgbnnt0lojorau95la1vp6j0a005iv8bp84wekm3&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/Z7x24IHBcmV7W/giphy.gif?cid=6c09b9525ro8z8i6p897j4yrwd8s0fvk51im3plxe7nnacle&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/X2fB80sJ5mjny/giphy.gif?cid=6c09b952gy7t1ykukft8dhu0arit1xwkeafbhkr2g3lxh722&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367101205413950/ezgif-6-59341b9ff6.gif?ex=6794ff0f&is=6793ad8f&hm=20890234270d81df7f3444045bdf73fc701be56e4202f47e851e7e5330ca3ad7&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367101788160162/ezgif-6-6c1cf1755f.gif?ex=6794ff0f&is=6793ad8f&hm=3c4f2d5b233e914f9b53b53f4984c0d7161668bf19bd85b0120df632420a9f7f&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367102304325663/ezgif-6-7838c20443.gif?ex=6794ff0f&is=6793ad8f&hm=4db59e2fec05d5657119103e434f67e0f7c0a391c0f17d18909e53be6dbd027f&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367102790729860/ezgif-6-d143d0d7d6.gif?ex=6794ff0f&is=6793ad8f&hm=82b3e6c08418d0a3f2f49fd75a38ca7ab66458ea4190cb2e253988e08a5e25af&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367103444910183/ezgif-6-09ba457f33.gif?ex=6794ff0f&is=6793ad8f&hm=e695f0bef2f60e9cac659c72dc5752833497083b0de6397ee4acbfe2785bd6b1&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367103948488734/ezgif-6-0e51bfdbdd.gif?ex=6794ff0f&is=6793ad8f&hm=6b3738a34e17e963dcf5e673d603bc7f53d70e24a5ccfee3cd990bced9b66180&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367104615120947/ezgif-6-0a16b659a1.gif?ex=6794ff0f&is=6793ad8f&hm=02f6e67f5d8587b3c2fe2dd4d7bba9b050ae55e96cb8f3866fcb5177ed000a06&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367105252917299/ezgif-6-05d01e3479.gif?ex=6794ff10&is=6793ad90&hm=d8de3a2478ab0daac486b1a4f6f5f01b884b25c72cc709d720dcfe0c55426d29&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367106230190246/ezgif-6-3a897d0518.gif?ex=6794ff10&is=6793ad90&hm=7b11d1ba8e200f9d6f4117a1d5f73afe87c5524272a141adc9ecc9b934bb9f6c&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332367105751777404/ezgif-6-8058c929ee.gif?ex=6794ff10&is=6793ad90&hm=4f6128e1aae163bfa2169ba7f5dfa9e2c49f7875e0371bad27a674cff391fc63&'
      ];

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
      .setImage(randomGif)
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