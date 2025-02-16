import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "slap",
  description: "Playfully slap another user.",
  aliases: ["smack",
    "hit"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to slap.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const texts = [
        "slapped",
        "smacked",
        "hit",
        "whacked",
        "threw a pillow at",
        "backhanded",
        "gently tapped",
        "playfully smacked",
        "flicked"
      ];

      const gifs = [
        'https://media4.giphy.com/media/tX29X2Dx3sAXS/giphy.gif?cid=6c09b9529oonts9h95awbv6sh7mmtu4f8zbhnqittz587bx7&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/KVoKm1kFnkZ48NUfJd/giphy.gif?cid=6c09b952jl2dtt4hxssncgg9782nicvcp6m9pat48hyar2kd&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/iMCedi21L9MXg1gN43/giphy.gif?cid=6c09b95245ken0a2cpeup1ljowgiffgq7sqwn05bnejn6n7h&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/IT9ki9RzfG3xrltz4b/giphy.gif?cid=6c09b952c5yrduq3ook02b6q5bvgs5sldq09alnwhg3jr3rk&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/1zkr6P5ib14lmLYFZT/giphy.gif?cid=6c09b9528r7omzyocqf63jjlhlivkuqv1jmv10q57vr3pdsi&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/OQ7phVSLg3xio/giphy.gif?cid=6c09b9527ri2zd7qdbd9hb2wwbi9jcpf7m1s3sztv5gm1j1d&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/dqYF5Xuz1kDNbOTjoX/giphy.gif?cid=6c09b952jl2gz3gnnl6sbsuvtw2sx1xbdytqs3h084zwjmpj&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/OzNvVsI8RMRuGqNYs1/giphy.gif?cid=6c09b952pvdhwfybkgu7mrmh2c9e9h6ucvzni6kvy13z2pcs&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/xu80rbPIozrUkchWXs/giphy.gif?cid=6c09b952gqrt1ddo4h2doehlep1g54fiki9wbgj1739zo67g&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/Zau0yrl17uzdK/giphy.gif?cid=6c09b9523mb3ukqtt6r4yxqdqhc0xln58fmkp5brxbvxfg2i&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/90cAvw5mBQHa1QNFG9/giphy.gif?cid=6c09b952d5k9jeyv3r7dsnv7ygc4dj0gxxkpgzo0m39gof61&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/vcShFtinE7YUo/giphy.gif?cid=6c09b952t3syruwwlqktkt0fyd6i519cy30e6dgqj1ft4m1u&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/xUNd9HZq1itMkiK652/giphy.gif?cid=6c09b952j2kgm0zeuol9bk6raw3a9eopzzonxmg4yrqdzzfn&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/u8maN0dMhVWPS/giphy.gif?cid=6c09b9522uw5ih1gkjaegu4qerky9sul3qri3abp7vdivzol&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
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