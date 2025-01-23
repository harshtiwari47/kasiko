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
        'https://media4.giphy.com/media/X2fB80sJ5mjny/giphy.gif?cid=6c09b952gy7t1ykukft8dhu0arit1xwkeafbhkr2g3lxh722&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({
        name: `**${message.author.username}** ${randomText} **${target.username}**`,
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