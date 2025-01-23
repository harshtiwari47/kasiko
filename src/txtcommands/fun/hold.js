import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "hold",
  description: "Give someone a warm and comforting hold.",
  aliases: ["embrace"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to hold.");
      }

      // List of random texts
      const texts = [
        "gave a warm and comforting hold! <3",
        "wrapped them in a gentle hug! <3",
        "offered a loving embrace! <3",
        "shared a tender moment with a warm hold! <3",
        "gave a reassuring hug! <3",
        "held on tightly with love! <3",
        "shared a heartfelt embrace! <3",
        "gave a supportive and caring hold! <3",
        "offered a cozy hug! <3",
        "wrapped them in a protective hold! <3"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://media3.giphy.com/media/NAUtEs7cbhRAc/giphy.gif?cid=6c09b952mu1kqwhxrnm4kc3h0s86y7jmbj86thefmthsi4eg&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/o03ctbYEV55kI/giphy.gif?cid=6c09b952g8jg5u11pj446mlrsl95eerb4qwkt092qhesctme&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/am8u0ds4uo8Io/giphy.gif?cid=6c09b95288eufic01rtqomdg824s7txsm5pn5a0k7jawdpdp&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/nlOXhahTmhDd6/giphy.gif?cid=6c09b952w1p7r97c7ci13capufin54al0furwyvv5g71qehm&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/REjFEaBC6ViHS/giphy.gif?cid=6c09b952lsj6tjrgtscfgn59sc9kvyla44yd6hse3mupofew&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/u49TfFV5XVD0HG3mEE/giphy.gif?cid=6c09b952dgn6aidjnpipfj5ta3dltge3fvsxdjmv5exr8c0f&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/3o7ZeSQEPtgrYCGu0U/giphy.gif?cid=6c09b952vsbsudk8chxst2zie8rcdmxmiwqya4bvbzeog49l&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/K4P0rDpjBf7zO/giphy.gif?cid=6c09b952ytihztekhnmt3alre6t00cu61qqcbu97witzlcxv&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/TScFoeIIhqOqI/giphy.gif?cid=6c09b952bjydliucz128xyc5vu7n800th30diqspparvfy56&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/26u458eVD7z0CbpdK/giphy.gif?cid=6c09b952uiw6q7y2l7pybazxjinykcvpa352egj41wmrh5in&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/iMJwjtL5GLxPYWMob3/giphy.gif?cid=6c09b952fp3kbxjw5vw1395ftbhbqei88mv71ih38ozuy9x0&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/MXjVBz2ZkX3RqmVDP3/giphy.gif?cid=6c09b952x78vhhyytzkfyp8fmz5hqodxli84g4re1brfe05r&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({
        name: `**${message.author.username}** ${randomText} **${target.username}**!`, iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })
      .setFooter({
        text: `giphy`
      })
      .setImage(randomGif); // Set a randomly selected GIF

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};