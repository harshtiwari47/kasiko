export default {
  name: "uwu",
  description: "UwU-fies your message!",
  aliases: ["uwufy", "cuteify"],
  cooldown: 3000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    args.shift();
    if (!args.length) {
      return message.reply("Pwease pwovide text to UwU-fy~ 🥺");
    }
    const uwuText = args
      .join(" ")
      .replace(/r|l/g, "w")
      .replace(/R|L/g, "W")
      .replace(/n([aeiou])/gi, "ny$1")
      .replace(/ove/g, "uv");

    await message.channel.send(`🌸 UwU-fied Message: "${uwuText}"`);
  },
};