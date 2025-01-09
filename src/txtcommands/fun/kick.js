import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "kick",
  description: "Playfully kick another user.",
  aliases: ["boot",
    "punt"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      if (!args[1]) {
        return message.reply("You need to mention someone to kick!");
      }

      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to kick.");
      }

      const texts = [
        "gave a strong kick to",
        "booted",
        "playfully kicked",
        "sent flying with a powerful kick",
        "delivered a swift kick to",
        "karate kicked"
      ];

      const gifs = [
        'https://media1.giphy.com/media/fGZ8DxgMbzb0jEtb88/giphy.gif?cid=6c09b952mccq91w6fhb1abitl7bq5o8g7d7w3mcto4zeanfm&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/EBDuUkEh5ctI7augD8/giphy.gif?cid=6c09b952pcvoussiuurc25bnvb2bi7utfvdevnmuubvqjzqn&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/iktwOqgZTJoIxmDyhz/giphy.gif?cid=6c09b952fgrkh1htzr9mc0brvu8gpaoejgopd9sio766pdmg&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/HgGXyNdAgDK5uXSjuM/giphy.gif?cid=6c09b952dezwc91yti7eyhwaot7nesl4etpewe44sjp0x5gp&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/LmaWcS1P2g6ptGkkrn/giphy.gif?cid=6c09b952c6r4adggwc6g4ia98legc21ed16oi2qwngh9n99z&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/GjJsRwNeSXKtBrTZuQ/giphy.gif?cid=6c09b952s6fg2jf8b0ug59lm9t6b9tixu4lhs25vow9qml5w&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/KmG26GNmdWOUE/giphy.gif?cid=6c09b9523y3dahhmfj8d592uxasgbzc1y0yd4z84prc8qo7y&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/UnKxk4jwkJZRBXJawn/giphy.gif?cid=6c09b952hajulwylfj42plpio3aixfmnacg47wnueujgdjsm&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/u2LJ0n4lx6jF6/giphy.gif?cid=6c09b9526kiwrk3x0erfrefqphxc1489xbix4sgb8agtv06u&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/CeUnEtCZbhllsN20CP/giphy.gif?cid=6c09b952ebi6abc7cnx4sfs0ajsi4pdpi3tfhauzjcrbo60j&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/ve0hNVJmBzarrwcQ1F/giphy.gif?cid=6c09b952erlwgug6ka9wktgycqvngwsvoe1lmfvbhkvdskyy&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)]: null;

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`**${message.author.username}** ${randomText} **${target.username}**!`)
      .setFooter({
        text: `giphy`
      });

      if (randomGif) embed.setImage(randomGif); // Add GIF only if available

      await message.channel.send({
        embeds: [embed]
      });
    } catch (e) {
      console.error(e);
    }
  },
};