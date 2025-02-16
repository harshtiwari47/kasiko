import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "rage",
  description: "Express your rage, with or without a target.",
  aliases: ["anger",
    "mad"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();

      const textsWithTarget = [
        "is furious at",
        "is raging at",
        "is losing it with",
        "is yelling at",
        "is completely mad at",
        "is venting anger at",
        "is upset with",
        "is fuming at",
        "is glaring at",
        "is shouting at"
      ];

      const textsWithoutTarget = [
        "is raging uncontrollably",
        "is furious",
        "is losing their temper",
        "is completely enraged",
        "is yelling at the world",
        "is venting their anger",
        "is fuming with anger",
        "is glaring at everything",
        "is mad beyond reason",
        "is exploding with rage"
      ];

      const gifs = [
        'https://media4.giphy.com/media/1noCATyp4I4qIHbsKY/giphy.gif?cid=6c09b952n5bslvhslk445pfbt7ivm6buzhixr568mzuun9nt&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/3ohzdX0xTqz5TLZZK0/giphy.gif?cid=6c09b9527659h71fh9hcddf3tg2fuzc646zb6q2f385v93ty&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/yVVLTxKvwWERW/giphy.gif?cid=6c09b952csb523c57zf8r0kgohm0pvginsmrtwjrlc9cmq4y&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/zwPRprvrP4Lm0/giphy.gif?cid=6c09b9525z0eauqep82uuqz2t8v1m7hql1f1tuhrga515mwd&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/xUPGcC4A6ElcqtUJck/giphy.gif?cid=6c09b952px9vtr9kfy1bou2yfw3bnem1rt5o9q8ij3a7gvfm&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ]

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const randomText = target
      ? textsWithTarget[Math.floor(Math.random() * textsWithTarget.length)]: textsWithoutTarget[Math.floor(Math.random() * textsWithoutTarget.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setImage(randomGif)
      .setAuthor({
        name: target
        ? `${message.author.username} ${randomText} ${target.username}`: `${message.author.username} ${randomText}`,
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
      return;
    }
  },
};