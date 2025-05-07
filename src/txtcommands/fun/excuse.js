import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "excuse",
  description: "Gives you a funny excuse to get out of trouble!",
  aliases: ["reason"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const response = await fetch("https://excuser-three.vercel.app/v1/excuse/funny/");
      const data = await response.json();
      const excuse = data[0]?.excuse || "I ran out of excuses!";

      const embed = new EmbedBuilder()
        .setDescription(`# 📝 𝑬𝒙𝒄𝒖𝒔𝒆\n**${excuse}**`)
        .setColor("Random");

      await message.channel.send({
        embeds: [embed]
      });

      return;
    } catch (err) {
      console.error("Error fetching excuse:", err);
      return;
    }
  },
};