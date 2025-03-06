import {
  EmbedBuilder
} from "discord.js";
import os from "os";
import {
  version as discordVersion
} from "discord.js";

export default {
  name: "botstats",
  description: "Displays detailed bot statistics.",
  aliases: [],
  cooldown: 10000,
  visible: false,
  category: "🔧 Utility",

  execute: async (args, message) => {

    try {

      if (!(message.author.id === "1223321207743582211" || message.author.id === "1318158188822138972")) return message.channel.send(`☕ Ooops, you are not allowed to perform this command!`)

      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const usedMemory = memoryUsage.heapUsed / 1024 / 1024;
      const totalHeap = memoryUsage.heapTotal / 1024 / 1024;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const cpus = os.cpus();
      const cpuModel = cpus?.[0]?.model || "Unknown CPU Model";
      const cpuCores = cpus?.length || "Unknown";
      const platform = os.platform();
      const architecture = os.arch();
      const nodeVersion = process.version;

      // CPU Usage
      const cpuUsage = process.cpuUsage();
      const userCPUTime = cpuUsage.user / 1000; // Convert from microseconds to milliseconds
      const systemCPUTime = cpuUsage.system / 1000; // Convert from microseconds to milliseconds
      const totalCPUTime = userCPUTime + systemCPUTime;

      const embedDescription = `
      🖥️ **RAM Usage:** ${usedMemory.toFixed(2)} MB / ${totalHeap.toFixed(2)} MB\n`+
      `🔌 **Total Memory:** ${(totalMemory / 1024 / 1024).toFixed(2)} MB\n`+
      `⏳ **Uptime:** ${hours}h ${minutes}m ${seconds}s\n`+
      `📈 **CPU Model:** ${cpuModel}\n`+
      `⚙️ **CPU Cores:** ${cpuCores}\n`+
      `⚡ **User CPU Time:** ${userCPUTime.toFixed(2)} ms\n`+
      `⚡ **System CPU Time:** ${systemCPUTime.toFixed(2)} ms\n`+
      `⚡ **Total CPU Time:** ${totalCPUTime.toFixed(2)} ms\n`+
      `🖥️ **Platform:** ${platform} (${architecture})\n`+
      `⚡ **Node.js Version:** ${nodeVersion}\n`+
      `📦 **Discord.js Version:** ${discordVersion}\n
      `;

      const embed = new EmbedBuilder()
      .setTitle("📊 Detailed Bot Statistics")
      .setColor("Green")
      .setDescription(embedDescription)
      .setFooter({
        text: "Bot Stats"
      })
      .setTimestamp();

      return message.reply({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  },
};