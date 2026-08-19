import {
  EmbedBuilder,
  version as discordVersion
} from "discord.js";
import os from "os";
import { hasPower } from "../../owner/ownerManager.js";

export default {
  name: "botstats",
  description: "Displays system resource metrics for authorized team members.",
  aliases: ["sysinfo", "botinfo"],
  cooldown: 10000,
  visible: false,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      if (!hasPower(message.author.id, 'VIEW_ANALYTICS')) {
        return message.channel.send(`☕ Ooops, you are not allowed to perform this command!`);
      }

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

      const cpuUsage = process.cpuUsage();
      const userCPUTime = cpuUsage.user / 1000;
      const systemCPUTime = cpuUsage.system / 1000;
      const totalCPUTime = userCPUTime + systemCPUTime;

      const embedDescription = `
🖥️ **RAM Usage:** ${usedMemory.toFixed(2)} MB / ${totalHeap.toFixed(2)} MB
🔌 **Total Host Memory:** ${(totalMemory / 1024 / 1024).toFixed(2)} MB
⏳ **Process Uptime:** ${hours}h ${minutes}m ${seconds}s
📈 **CPU Model:** ${cpuModel}
⚙️ **CPU Cores:** ${cpuCores}
⚡ **User CPU Time:** ${userCPUTime.toFixed(2)} ms
⚡ **System CPU Time:** ${systemCPUTime.toFixed(2)} ms
⚡ **Total CPU Time:** ${totalCPUTime.toFixed(2)} ms
🖥️ **Platform:** ${platform} (${architecture})
⚡ **Node.js Version:** ${nodeVersion}
📦 **Discord.js Version:** ${discordVersion}
      `;

      const embed = new EmbedBuilder()
        .setTitle("📊 System & Process Diagnostics")
        .setColor(0x2ecc71)
        .setDescription(embedDescription)
        .setFooter({
          text: "Kasiko Diagnostics"
        })
        .setTimestamp();

      return message.reply({
        embeds: [embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error('[BotStats] Error:', e);
      }
    }
  },
};