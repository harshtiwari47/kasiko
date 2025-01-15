export default {
  name: "uwu",
  description: "UwU-fies your message!",
  aliases: ["uwufy",
    "cuteify"],
  cooldown: 3000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    args.shift();
    if (!args.length) {
      return message.reply("Pwease pwovide text to UwU-fy~ 🥺");
    }

    const uwuText = args
    .join(" ")
    .replace(/[rl]/g, "w") // Replace 'r' and 'l' with 'w'
    .replace(/[RL]/g, "W") // Replace 'R' and 'L' with 'W'
    .replace(/n([aeiou])/gi, "ny$1") // Add 'y' after 'n' when followed by a vowel
    .replace(/ove/g, "uv") // Replace 'ove' with 'uv'
    .replace(/\!+/g, " owo") // Add playful 'owo' for exclamation marks
    .replace(/(?<!\w)you/gi, "yuwu") // Replace standalone 'you' with 'yuwu'
    .replace(/\b(?<!\w)the\b/gi, "da") // Replace standalone 'the' with 'da'
    .replace(/\bis\b/gi, "ish") // Replace 'is' with 'ish'
    .replace(/\bthis\b/gi, "dis") // Replace 'this' with 'dis'
    .replace(/\bhas\b/gi, "haz") // Replace 'has' with 'haz'
    .replace(/w{2,}/g, "w") // Reduce consecutive 'w's to one
    .trim() + " ~uwu~"; // Add a cute suffix for extra flair

    await message.channel.send(`🌸 UwU-fied: "${uwuText}"`);
  },
};