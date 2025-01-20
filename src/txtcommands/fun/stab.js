import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "stab",
  description: "Playfully stab another user.",
  aliases: ["poke",
    "jab"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to stab.");
      }

      const texts = [
        "playfully stabbed",
        "jabbed",
        "poked",
        "gave a little stab to",
        "lightly jabbed",
        "pretended to stab"
      ];

      const gifs = [
        'https://media4.giphy.com/media/2ttRX4t3KG87kcwDDM/giphy.gif?cid=6c09b9525zmp7501smw3onh4jxhh7hx6vmdscuuly7yj30j9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/l2JdXFe0CBE8mhBNS/giphy.gif?cid=6c09b9529twh2ifflrpv42dobu93khbmon3exmoe309rqsfi&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/xT5LMvOCH65SJhDqdW/giphy.gif?cid=6c09b952qhyxtzxay3vssi2wi4y1w4b23a9ac636jhk96026&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/3o6ZsUA3Ewzn4Nq5Rm/giphy.gif?cid=6c09b952xmw5e6umiw67idzbw9n3fzuk43vkearilxjb85dd&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/4mbL3aNbIHmP6/giphy.gif?cid=6c09b952jszg8x2pidhcu62d92azkifb81d48qw64r4fq73l&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/imRiPoKJB9R9m/giphy.gif?cid=6c09b952i888aj6mgh0w9oyfhpgys686hwtocpwm7034ozr6&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/1TpDdXfCwAB4LhlDsj/giphy.gif?cid=6c09b952uxhktj2wi1yn2vho5t3uktku0x26ugsqqol0xsdy&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/VCMmHqURMoAZnEfOmk/giphy.gif?cid=6c09b952mcb6itwz7nhnbzljaly6sq78vm1991bexlu9gmkv&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/z8xRcmTwu1QU8/giphy.gif?cid=6c09b952dp0m5indrw72qsxndxmr3jgrwy9ebnu7a2ihscl5&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/26uf6J2OmD1lu0lI4/giphy.gif?cid=6c09b952auv3yei38583rb6i8csug1b6jqddjvwoixfyll5m&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/Hvxj9j8itdteCP6ySx/giphy.gif?cid=6c09b952ikvh3cxknqljz2zna3cwz96eytoj00xj403m3hm8&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/dmbZs8ZlTm5NMvr4js/giphy.gif?cid=6c09b9526xqrtitctu9zetqc3agyt2j61lhdqbsg1nenywtv&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/srcLS0USEVFmg/giphy.gif?cid=6c09b952glxb4i13bwsb08j3op0oh22jzv3uv956kq6ldhov&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomText} **${target.username}**!`)
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