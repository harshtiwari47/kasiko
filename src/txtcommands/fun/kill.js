import {
  EmbedBuilder
} from 'discord.js';

export default {
  name: "kill",
  description: "Playfully 'eliminate' another user.",
  aliases: ["slay",
    "destroy"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      // Get the mentioned user
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply("Please mention a valid user to 'kill'.");
      }

      // List of random texts
      const texts = [
        "unleashed bullets on",
        "sniped down",
        "sprayed ~chaotic~ fire at",
        "bazooka-blasted",
        "turret-locked onto",
        "John-Wick’d",
        "airstriked",
        "minigun’d into",
        "misfired toward",
        "laser-zapped",
        "~plasma~ blasted",
        "cowboy-aimed at",
        "rained lead on",
        "robo-assassinated",
        "spin-fired at"
      ];

      // List of random GIF URLs
      const gifs = [
        'https://media2.giphy.com/media/crYGq0N2DoqYnhif32/giphy.gif?cid=6c09b9522mn4loj7kvux7sj7v891842aanwwdmk2nwss1rsr',
        'https://media1.giphy.com/media/iU1NUdMq3sx3O/giphy.gif?cid=6c09b952miskvqb064e08mkqpnonlfl5p23dehpoyf2lbmrx',
        'https://media3.giphy.com/media/Ea2zGT6aRZfY0aIOnk/giphy.gif?cid=6c09b952wnni7ig0txriqkgn1xlh2e7dqc35tp2m10ak26e7',
        'https://media3.giphy.com/media/J8jdRmc2dWLXW/giphy.gif?cid=6c09b9520o4ooqhl503px33h5p4o39l540f5xnjjwhu69vhk',
        'https://media1.giphy.com/media/Qi0rWYpdkj4M8/giphy.gif?cid=6c09b9526mf42a7z8sjl7w0ptixc7hm5oqhivusxxlgz8cim',
        'https://media1.giphy.com/media/eR7OEDQDyA7Cg/giphy.gif?cid=6c09b9524ej8gyiwaf02du7mgl0s037xmqco8xigdlh24rpa',
        'https://media2.giphy.com/media/7J866R06v0Prs4onGh/giphy.gif?cid=6c09b952fe1kqtpug2fyal28drztyg7otapkxwc83t9vmjt0&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/Rfkm8WGSt89FWnlTDw/giphy.gif?cid=6c09b952ngxzfqz4gpnd5raqd42y54c0rz4tbfqoe8n884on&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/3vAbCfUkafcwJPm9eD/giphy.gif?cid=6c09b952debt6ll0pxllu3iqwi6tjbbkmzxee2ql8ac31yap&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/Y4bCuJQZ3qy5Z8zDp5/giphy.gif?cid=6c09b952klve3gm2kn2pd6silaq1nv3xvpga51xz9c4p1uiw&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/XVS1b0V6igOSxeQ1fS/giphy.gif?cid=6c09b952bqxt7k6fg1773qh1tvkhcvk75ventxo9dh52tw4s&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/7uuTpm9nC9elW/giphy.gif?cid=6c09b952rmv4gz9k5jczjtkrex9ecql8tteduut5i0r9x9k9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/cUSiRJMwZ3wyc/giphy.gif?cid=6c09b952safr418ap93uf7ka3bbigkcfs4nqs9090gx2ovei&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/kFkhpVwaBrDb2/giphy.gif?cid=6c09b952ts4sibdonvieznu1oj68labxpv8q3tq5tzlqqiwn&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/GEGnqhJcKyYoM/giphy.gif?cid=6c09b952skbakmviot9ehs5s9hzfsub31jjqcpfupn89cn9j&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/10ZuedtImbopos/giphy.gif?cid=6c09b952rxt7inyj8vafh9a6x5p0pawusyvdw4uedg3xxysw&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/a5OCMAro7MGQg/giphy.gif?cid=6c09b9526d90fmwm0e4nss7dcpdrcnbcqzdv5yypvu7mwd5o&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/1dSh339toYJr2/giphy.gif?cid=6c09b952482yabptyf56sd6vhsxxi2ez0py2oqq08awhbeg9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/DWHvFoICM2bja/giphy.gif?cid=6c09b952jnixmeclc04c6eii83o4csydcvx1bmh6pau6pca9&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media3.giphy.com/media/QDz5ag91r9ol2/giphy.gif?cid=6c09b9529rvwrh9nzglxrixoxnl6tnmgfhs26mf5ven8k818&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/BcSfi7jRHsLV6/giphy.gif?cid=6c09b952pdkagsmysy1c2v3ki3vl79x1w7djrmaxmc3gp42i&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media1.giphy.com/media/3XBJV6DLfu06s0H57S/giphy.gif?cid=6c09b952kbf1qhsc0deiy826i9nwl62rksemuk4v22abpapn&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/nXWxE3nbUpJdyTnGRF/giphy.gif?cid=6c09b952sm526jchtb4yzazeg9cyomrmez0jdcx52fr9g58n&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/s8yzk6DeZTfNzbVdlh/giphy.gif?cid=6c09b952gc3luo1fw4a4mbhoumnlj3jaqj6d8el49ueivi50&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media2.giphy.com/media/rnhJwvHjF2Jpgl0J3l/giphy.gif?cid=6c09b952zwqgj09icmg3hpqmj75fa8s9otv1dvxovvxa1ml7&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/TGQPszNWLBggPM2kQA/giphy.gif?cid=6c09b952b5hmsj5zdefuofo0xgln076by865rmekabdn86cg&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media0.giphy.com/media/xUPGcGMZr0nVdMgEnK/giphy.gif?cid=6c09b9521751pu4l9cqmupycetsfw9muj161eju6649iin7v&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g',
        'https://media4.giphy.com/media/CLPSFbwMqpsvf5cRe8/giphy.gif?cid=6c09b952jw81slimpubk10wpvvrrsby5hg8j0bom6vihcee3&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g'
      ];

      // Randomly pick a text and a GIF independently
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

      const embed = new EmbedBuilder()
      .setColor('Random')
      .setDescription(`${message.author.username} ${randomText} ${target.username}! 💀`)
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