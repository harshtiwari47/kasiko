import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "bully",
  description: "Playfully bully another user.",
  aliases: ["tease",
    "mock"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to bully.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const texts = [
        "playfully bullied",
        "teased",
        "mocked",
        "made fun of",
        "gently roasted",
        "poked fun at"
      ];

      const gifs = [
        'https://cdn.discordapp.com/attachments/1331633832251887711/1331634720978501642/kuro-usagi-bully.gif?ex=679254fa&is=6791037a&hm=9eccc0c556cb30ce8ae935862e489a181ca12ba34c6f9012a59f848780a9ca97&',
        'https://cdn.discordapp.com/attachments/1331633832251887711/1331635158721232989/kid-luffy.gif?ex=67925562&is=679103e2&hm=d94411de78e0bf4ffc37ccc31f1a55866b9c0617e0be7e2500f057612e4b7f7f&',
        'https://cdn.discordapp.com/attachments/1331633832251887711/1331635158348075089/king-anime.gif?ex=67925562&is=679103e2&hm=a88ff910e9009ab9900c53b4d0b5bc4f8bb6f29d8a4ea8c0f1e54cb606ea0a2b&',
        'https://cdn.discordapp.com/attachments/1331633832251887711/1331634721846984715/dont-toy-with-me-miss-nagatoro-dont-bully-me-miss-nagatoro.gif?ex=679254fa&is=6791037a&hm=cd4051b6cbb31bb5825eee02d3b8f449c3e70aec2c97f8147c1af016803fb835&',
        'https://media.discordapp.net/attachments/1331633832251887711/1331634721360318634/throw-bully.gif?ex=67944f3a&is=6792fdba&hm=8666ae449a34dccabbda51d571d54c4d5a4d689c52ec47fef03a161527e8d647&',
        'https://media.discordapp.net/attachments/1331633832251887711/1331634720064405505/anime-bully.gif?ex=67944f39&is=6792fdb9&hm=fbc36dcead5346217b7c1d5d3d4483312496bdbb39dba83cdeb7340bfcd14b0a&'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setAuthor({
        name: `${message.author.username} ${randomText} ${target.username}!`, iconURL: message.author.displayAvatarURL({
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
    }
  },
};