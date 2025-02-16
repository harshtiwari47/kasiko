import {
  getPlayerSvInfo
} from '../../../utils/battleUtils.js';

export default {
  name: "current",
  description: "Check your current dragon, powers, and health while a **Skyraid** match is active.",
  aliases: ["matchinfo"],
  args: "",
  example: ["current"],
  related: ["dragon"],
  cooldown: 10000,
  // 10 seconds cooldown
  category: "🐉 Skyraid",

  // Main function to execute the command
  execute: async (args, message) => {
    try {
      let response = await getPlayerSvInfo({
        guildId: message.guild.id,
        channelId: message.channel.id,
        userId: message.author.id,
      });

      if (response.success) {
        return message.channel.send({
          embeds: [response.embed]
        })
      }

      return message.channel.send({
        content: `**${message.author.username}** — ${response.replyContent}`
      });

    } catch (e) {
      console.error(e);
      return message.channel.send("⚠️ An error occurred while executing the `current` command.");
    }
  }
};