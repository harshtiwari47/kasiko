import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "cry",
  description: "Express sadness with a crying GIF.",
  aliases: ["tears",
    "sob", "sad"],
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
    'https://media3.giphy.com/media/cxTOMfjEyMwNmu6de5/giphy.gif?cid=6c09b9526d99y2w9phn7jcb4nim5zgp7wosw3zzlbf66vfo5&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/4pk6ba2LUEMi4/giphy.gif?cid=6c09b952wmri462oi7ph1e40uxhh5f0nfj4p6ikhrguh3yx2&ep=v1_internal_gi  f_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/b9wQvtFlehup2/giphy.gif?cid=6c09b952i3scnbiq953k0mogd7fr8a0sgpsnlm4gnh7u3yew&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/4iusP4Pbf1L8c/giphy.gif?cid=6c09b9523qr3eis0upflipsao9zu745n7q2rt3p5uorkymuq&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/oAW9QPkQwJqJq/giphy.gif?cid=6c09b9524kuyvmu9h8d85hikuwzifga6vv6c9p64l8qq3ca4&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media2.giphy.com/media/11N961lfRaZWfu/giphy.gif?cid=6c09b952xwsiske88rdrs8g8tioqi0zspx3penzjhk66efqh&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/8YutMatqkTfSE/giphy.gif?cid=6c09b952a97puyachmb8u7o9lqa8trxhk6yllt0re62tvbxv&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/2SviMQehkY0lG/giphy.gif?cid=6c09b952hnf441g62ke7x8ekc0z0cm47hwhaexbozcemvmbo&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media0.giphy.com/media/WMs5Nx50lrsGI/giphy.gif?cid=6c09b952q03gbptjca9yw3c4fglkm7qz6b319uyxs6zyxq8e&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/HyOOyynWxMxig/giphy.gif?cid=6c09b952au8t9q2q606zgua4rlokbl8ucbtch03gcc9iagz3&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/h6C6f4phY7MU8/giphy.gif?cid=6c09b952ky86awpv6up460382cfywxqvywjb6uhcx8hxdevf&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media0.giphy.com/media/VSvRlGiwV6ZxK/giphy.gif?cid=6c09b952p7623lttf1t887qnkj914yovc7l9sep9jfv4v7l3&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media2.giphy.com/media/BSxFhxneZPCvK/giphy.gif?cid=6c09b952bjn7n1y5erh2i46b4w0d95xd4nsshgg99sq2ght3&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media2.giphy.com/media/AI7yqKC5Ov0B2/giphy.gif?cid=6c09b9525cqt51edxyx6onw0njconuzsirfpl20c32wmsiz9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/3ohjUW8ME9uHDh8EI8/giphy.gif?cid=6c09b952tudif10zozh37qj7e24vmj40iq97f7jw93wreodl&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media0.giphy.com/media/xT1R9yzqpvhPETYoV2/giphy.gif?cid=6c09b9529fzmz86qhnqxdhve5kb6xagigfaqg72bobd90adz&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/N0zizM2fKgGm4/giphy.gif?cid=6c09b952ytbrt620c747pndyka8i4dmpl0rvou19636tblvy&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/shVJpcnY5MZVK/giphy.gif?cid=6c09b9523gh5c38tah3yavy6wn0bvr5xsi0z9a0clg1q5vpk&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/8VB1I9YtdGBFu/giphy.gif?cid=6c09b9523y7wi2g5bbjoyfluy0drss0b8jli2sevuxkruwwe&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/XGfajNnqS29Y4/giphy.gif?cid=6c09b9525zrftrnvirgr90i6uq3ervq3pyuib87n7oq0gksp&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media3.giphy.com/media/OuKTQaitZH8Y/giphy.gif?cid=6c09b952d4678bx0k2ivpf0h9ec4th6ys58lg6zttqnxx2x2&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/EdInbVEktp3sA/giphy.gif?cid=6c09b952ynv2hlgeyrsw15bpf7p29vdut4z3mhun901qw88i&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
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