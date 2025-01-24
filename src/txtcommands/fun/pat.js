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
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340845625610312/aharen-san-aharen-san-anime.mp4?ex=6794e69b&is=6793951b&hm=7ffe642c9ebf760fd473f3708d27bc521c13dbf7cdc2b47344e90162ba942088&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340845973602336/pat-head-gakuen-babysitters.mp4?ex=6794e69b&is=6793951b&hm=44383de9f1ef8910088b3c9dee34589befaf0ce1a177a1a99a9ad64435724917&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340846254886982/aharen-aharen-san.mp4?ex=6794e69b&is=6793951b&hm=fa4ca36265db560d5cea28ae31d9f9ef467120c9bb54a17fa94c124e19c6faac&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340846720192543/sakuta-azusagawa-mai-sakurajima.mp4?ex=6794e69b&is=6793951b&hm=2ea5a5eeb4af99540b694f46687bf676b4a5de93b97445d3405e8987ed7b4f79&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340847068582001/higurashi-no-naku-koro-ni-mal-piro.mp4?ex=6794e69b&is=6793951b&hm=81234e12b891c830c91533263caa1f732438df9849ec995e7f4e3f38fc8325d8&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332340847328624700/anime-anime-headpat.mp4?ex=6794e69b&is=6793951b&hm=6e5b1c08ff836a9d53c1c21228efb88b62a1f5917b60cd6276dc5e45217d682b&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332342634437541968/pat-pat.mp4?ex=6794e845&is=679396c5&hm=4cd5ba323a35c24d9d7374a6fe19b9aa2db1a25fe791e9ad8bd007b07aa60c37&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332342634936537098/pokemon-anime.mp4?ex=6794e845&is=679396c5&hm=1f9182855c7d9e6e5e7c59cff6a718eebd2e390de85b5df569bd7f1d72908e46&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332342635259756564/anime-head-pat-anime-pat.mp4?ex=6794e845&is=679396c5&hm=42d36c4381475959750be3c495aafe644f04011f4abbc05a0dad1fed411f621f&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332342640292663386/rika-higurashi.mp4?ex=6794e847&is=679396c7&hm=a0a739a58ecba15dc3b99551e682b43b11d0dd8e45c87d600b8d23185d9a0dc4&'
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