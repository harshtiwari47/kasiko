import { EmbedBuilder } from "discord.js";

export default {
  name: "poem",
  description: "Get a random short poem (10 lines or fewer)!",
  aliases: ["poetry"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const randomLineCount = Math.floor(Math.random() * 10) + 1; // 1 to 10
      const response = await fetch(`https://poetrydb.org/linecount/${randomLineCount}`);
      const poems = await response.json();

      if (!poems.length) {
        await message.channel.send("No short poems found! Try again.");
        return;
      }

      const poem = poems[Math.floor(Math.random() * poems.length)];

      const embed = new EmbedBuilder()
        .setTitle(`📜 ${poem.title}`)
        .setDescription(`by **${poem.author}**\n\n${poem.lines.join("\n")}`)
        .setFooter({ text: `Lines: ${poem.linecount}` })
        .setColor("Random");

      await message.channel.send({ embeds: [embed] });
      return;
    } catch (err) {
      console.error("Error fetching poem:", err);
      await message.channel.send("Oops! Couldn't fetch a poem right now.");
      return;
    }
  },
};