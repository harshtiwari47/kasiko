import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "kiss",
  description: "Send a sweet kiss to someone.",
  aliases: ["smooch",
    "mwah"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to kiss.");
      }

      // List of random texts
      const texts = [
        "gave a sweet kiss! 💋",
        "planted a gentle smooch! 😘",
        "shared a romantic kiss! 💞",
        "blew a kiss across the room! 😚",
        "stole a kiss sneakily! 🥰",
        "shared a passionate kiss! 💓",
        "gave a quick peck! 💕",
        "kissed like they’re in a romantic movie! 🎥",
        "blew a playful kiss! 😜",
        "gave a loving kiss! 💖"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://i.gifer.com/8ZwP.gif',
        'https://i.gifer.com/2uEt.gif',
        'https://i.gifer.com/FChS.gif',
        'https://i.gifer.com/XrqL.gif',
        'https://i.gifer.com/67d3.gif',
        'https://i.gifer.com/G9IU.gif',
        'https://i.gifer.com/XkMW.gif',
        'https://i.gifer.com/Lyne.gif',
        'https://i.gifer.com/8R91.gif',
        'https://i.gifer.com/AODj.gif',
        'https://i.gifer.com/D0EE.gif',
        'https://i.gifer.com/Hivs.gif',
        'https://media4.giphy.com/media/jR22gdcPiOLaE/giphy.gif?cid=6c09b952sctkw4jchw1289koibhqptu898huh83s16iw5934&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/6d1HE6vVDfUze/giphy.gif?cid=6c09b952iky68xri1hyy21c1kn8k02nlzxlgvsrd7of3pqn8&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/Ka2NAhphLdqXC/giphy.gif?cid=6c09b9521w4v3sk8hu5pwm3qzskhpkt6kg7c2q880vhks9gb&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/7z1xs4Fl9Kb8A/giphy.gif?cid=6c09b952v1r8pzk8jbtwbgntegtpjla07o0u5o422stblzeq&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/G3va31oEEnIkM/giphy.gif?cid=6c09b952j4a37wl49sh709bk7mz64sx15yhex1c28p76i8bb&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/flmwfIpFVrSKI/giphy.gif?cid=6c09b9528epxr9wt7mqql0omvwrlfo1l8b92n07nggwc3xdh&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/KmeIYo9IGBoGY/giphy.gif?cid=6c09b952tacop271nrqlw7j9f30bffqlnp0e8t63b7yrevkh&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/QGc8RgRvMonFm/giphy.gif?cid=6c09b952ebystypquymptm3jadu0sokv28l8tayicir2qhx0&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/zkppEMFvRX5FC/giphy.gif?cid=6c09b952j5k854ypxntnmr7yrx2xbnjonsgg1paco0u3lohi&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/VXsUx3zjzwMhi/giphy.gif?cid=6c09b9522zadbc9yp8gesktrbl21t8655ble078ngcb4w8ql&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/P1VHfCYElFTcQ/giphy.gif?cid=6c09b952byzkfbydx0tzisip1942sxa59jehmg2wdz9hrmty&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomText} **${target.username}**`)
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