import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "dance",
  description: "Show off your dance moves, with or without a partner.",
  aliases: ["boogie",
    "groove"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();

      const textsWithTarget = [
        "is dancing with",
        "started a dance with",
        "hit the floor with",
        "is showing moves with",
        "is grooving with",
        "is twirling with",
        "is jamming with",
        "is stepping up with",
        "is spinning with",
        "is vibing with"
      ];

      const textsWithoutTarget = [
        "is dancing alone",
        "started grooving solo",
        "hit the floor solo",
        "is showing their own moves",
        "is jamming solo",
        "is dancing in style",
        "is spinning solo",
        "is vibing on their own",
        "is twirling solo",
        "is breaking it down alone"
      ];

      const gifs = [
        'https://media3.giphy.com/media/1448TKNMMg4BFu/giphy.gif?cid=6c09b952n9fxkanf9z1pv0tr045x65l41ek0fmg6i531sg6p&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/cFSbwZr4i0hVe/giphy.gif?cid=6c09b952inqs24xs2ug9wg57h9i6bf7fupizl1j60v2hyz35&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/l41Yk0Ovlxko5oYco/giphy.gif?cid=6c09b952mpdc29vyqojwg02oe1comn33kckddutn8afryj50&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/GFi4fqtMGj4nm/giphy.gif?cid=6c09b952kqf2rbrxl5ofuv0tves98wa2lz6ox7p3n6cpn4f6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/0pKnwwfCn9XYK6Ig4X/giphy.gif?cid=6c09b952tpmk6iafcobqqt8oh721luaaialnk09jlpm0rw5r&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/E0RvYPWdFn6runV33L/giphy.gif?cid=6c09b952ai0prbmixz4nf2lcrtzugkqxutqfd5nx9lko1wcw&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/OOn7N4CfPuUTmNqFD7/giphy.gif?cid=6c09b952cn2od92y68nlhrrajxfv9texkd6x0p21nq9p3jdd&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/jCaU8WfesJfH2/giphy.gif?cid=6c09b9529fuzmsgawc0uqrlsf6nl53kwzl1ciiri2sqesk18&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/11lxCeKo6cHkJy/giphy.gif?cid=6c09b952jmi2ik2xzpewnbu0fjm82f88bi24b3m43urdqyad&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/HZboJ5Pkti9k4/giphy.gif?cid=6c09b952j2pchfrtonrpdhw4l5ne8t7pkrmbxo3wua1g12k4&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/mJIa7rg9VPEhzU1dyQ/giphy.gif?cid=6c09b952trpfxfeiibi67scxcm8bvuxbwaq4ty1fy9zfxokn&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/iwsFHeFMtn3nNxSdP8/giphy.gif?cid=6c09b952f5uva7dwz5ivznz5hv9hog6ja99dp8eljbtcgkbi&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/bOEQUoeqqg4GWO4oXT/giphy.gif?cid=6c09b9529s34sjicimd4l3hfx94rdc58pikxo2050r4d60zv&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/6k6iDdi5NN8ZO/giphy.gif?cid=6c09b9529hiyk7el6bnoj8bbce4opu1sci40t1a1yyyg2e1d&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/z8pi6Q8wTxuFO/giphy.gif?cid=6c09b9529ebzi5u7hnx3r9ira9mw9pt12mq34o6ahd02fuq7&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/W6dHvprT7oks6BpX5R/giphy.gif?cid=6c09b952z71cv9f4qba1ufk7rv2xdnpxmvy30p88phnbwnwx&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/eqCaSzU2sDe8g/giphy.gif?cid=6c09b9527pakrgi5kfnus0zhbam8znogdh1fvl1tyi6464p7&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364494810386546/ezgif-6-59ef71508f.gif?ex=6794fca1&is=6793ab21&hm=2980eadef293d084ae7560005c220c94a83bcd24ed7e13925f5fe91cea039ace&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364495233745007/ezgif-6-08c066adcb.gif?ex=6794fca1&is=6793ab21&hm=8c22dba23cbf454473a7cea77b9bc1dbca05d29c050be37c5972a88a41095529&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364495607173162/ezgif-6-c6475aa6df.gif?ex=6794fca1&is=6793ab21&hm=3823007824b4388d15e5ca97406a1691f70f45632be5da8ad7d4c16b1e394b01&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364496001568860/ezgif-6-634b0add1c.gif?ex=6794fca1&is=6793ab21&hm=81ab11ec790a43f6d3086e765eb5e0263de966a8c13ca1feffb890e11a47a006&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364496382984253/ezgif-6-2aefbec6cd.gif?ex=6794fca2&is=6793ab22&hm=4e935c8a6fc7eeadcc18af37c2bc16c2ca62c3eb3efae3afb4bb24fd87623cac&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332364496794161182/ezgif-6-659abd2c08.gif?ex=6794fca2&is=6793ab22&hm=4a6f583f7c2d22e42eaeddf1b972babaa4c4d79d54b1fba616a29749df90a92c&'
      ]

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const randomText = target
      ? textsWithTarget[Math.floor(Math.random() * textsWithTarget.length)]: textsWithoutTarget[Math.floor(Math.random() * textsWithoutTarget.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setImage(randomGif)
      .setAuthor({
        name: target ? `${message.author.username} ${randomText} ${target.username}`: `${message.author.username} ${randomText}`,
        iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })

      await message.channel.send({
        embeds: [embed]
      })
      return;
    } catch (e) {
      console.error(e);
    }
  },
};