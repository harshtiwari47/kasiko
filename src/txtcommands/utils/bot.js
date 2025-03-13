import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "botinfo",
  description: "Displays information about the bot.",
  aliases: ["binfo",
    "bot"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      const {
        client
      } = message;

      const uptime = client.uptime; // Bot uptime in milliseconds
      const hours = Math.floor(uptime / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

      const botInfoEmbed1 = new EmbedBuilder()
      .setTitle("🤖 Bot Information")
      .setColor(0x00aaff)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        `**Bot Name:** ${client.user.username}\n` +
        `**Bot ID:** ${client.user.id}\n` +
        `**Bot Tag:** #${client.user.discriminator}\n` +
        `**Version:** 1.1.0`
      )

      const botInfoEmbed2 = new EmbedBuilder()
      .setColor(0x00aaff)
      .setDescription(
        `**Uptime:** ${hours}h ${minutes}m ${seconds}s\n` +
        `**Guilds:** ${client.guilds.cache.size} servers\n` +
        `**Live Users:** ${client.users.cache.size} users\n` +
        `**Ping:** ${client.ws.ping}ms\n` +
        `**[Support Server](https://discord.gg/DVFwCqUZnc)**`
      );

      await message.reply({
        embeds: [botInfoEmbed1, botInfoEmbed2]
      });
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  },
};