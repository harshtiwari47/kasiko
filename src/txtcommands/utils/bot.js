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
    const {
      client
    } = message;

    const uptime = client.uptime; // Bot uptime in milliseconds
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    const embed = new EmbedBuilder()
    .setTitle("Bot Information")
    .setColor(0x00aaff)
    .setThumbnail(client.user.displayAvatarURL())
    .addFields(
      {
        name: "Bot Name", value: client.user.username, inline: true
      },
      {
        name: "Bot ID", value: client.user.id, inline: true
      },
      {
        name: "Bot Tag", value: `#${client.user.discriminator}`, inline: true
      },
      {
        name: "Bot Version", value: "1.0.4", inline: true
      },
      {
        name: "Uptime", value: `${hours} hours, ${minutes} minutes, ${seconds} seconds`, inline: true
      },
      {
        name: "Guild Count", value: `${client.guilds.cache.size} servers`, inline: true
      },
      {
        name: "Live Users", value: `${client.users.cache.size} users`, inline: true
      },
      {
        name: "Ping", value: `${client.ws.ping}ms`, inline: true
      }
    )
    .setTimestamp();

    await message.reply({
      embeds: [embed]
    });
  },
};