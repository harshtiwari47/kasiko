import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "ping",
  description: "Checks the bot's latency and responds with the ping.",
  aliases: ["latency",
    "pong"],
  cooldown: 6000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const start = Date.now();
    const pingMessage = await message.reply("🏓 Pinging...");

    const latency = Date.now() - start;
    const apiPing = message.client.ws.ping;

    const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setColor(0x00ff00)
    .addFields(
      {
        name: "Latency", value: `**${latency}ms**`, inline: true
      },
      {
        name: "API Latency", value: `**${apiPing}ms**`, inline: true
      }
    )
    .setTimestamp();

    await pingMessage.edit({
      embeds: [embed]
    });
  },
};