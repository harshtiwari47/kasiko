import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "dance",
  description: "Show off your dance moves, with or without a partner.",
  aliases: ["boogie",
    "groove"],
  cooldown: 4000,
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
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338537974075453/shika-shikanokonokonokoshitan.mp4?ex=6794e475&is=679392f5&hm=9b07cf3e679d4c7fbbb142313d8fea28dbfb6427eec41ddd8700eeaeda2aff23&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338538229796994/aharen-dance.mp4?ex=6794e475&is=679392f5&hm=eee313b2d5d09bdd3318dc42b842f213d4114247f82673b32748af8604e4cdb9&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338538548690964/bocchi-bocchi-the-rock.mp4?ex=6794e475&is=679392f5&hm=a5e020315c7bd17b333187cb65e7a273f41ab3f07b64570a0adf0950377aad9c&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338538871521340/bocchi-the-rock-bocchi.mp4?ex=6794e475&is=679392f5&hm=8e15ebba14a515993e51d06b982fb0938d60c442816a7b4499e1eb678a44a085&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338539295281203/chainsaw-man-dance.mp4?ex=6794e475&is=679392f5&hm=0da72a1216d67bb4bcc89a757bc8a1e17c73802ffa3da75a2a4f7220a461d921&',
        'https://cdn.discordapp.com/attachments/1332338317374783528/1332338539630952531/pulcino-pio.mp4?ex=6794e475&is=679392f5&hm=5582ff4f61f01b4827099c77671e11b9f703953c1c4f71eaf441970e0f0ff2fa&'
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
      });
    } catch (e) {
      console.error(e);
    }
  },
};