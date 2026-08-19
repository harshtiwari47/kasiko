import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "lick",
  description: "Playfully lick another user.",
  aliases: ["slurp"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to lick.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (target.id === message.author.id) {
        return message.reply("You can't lick yourself! That's a bit strange... 👅").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const texts = [
        "playfully licked",
        "gave a mischievous lick to",
        "licked the cheek of",
        "slurped",
        "sweetly licked"
      ];

      const gifs = [
        'https://media.giphy.com/media/1081222453664/giphy.gif',
        'https://media.giphy.com/media/Gf3fU0qPtVKH6/giphy.gif',
        'https://media.giphy.com/media/x4bWE4CnY66yQ/giphy.gif',
        'https://media.giphy.com/media/12PIT4DOj6Tgek/giphy.gif'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
        .setColor('#ff9ff3')
        .setAuthor({
          name: `${message.author.username} ${randomText} ${target.username}! 👅`,
          iconURL: message.author.displayAvatarURL({
            dynamic: true
          })
        })
        .setImage(randomGif)
        .setFooter({
          text: `👅 Lick requested by ${message.author.username}`
        })
        .setTimestamp();

      return await message.channel.send({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      console.error('[Lick] Error:', err);
    }
  }
};
