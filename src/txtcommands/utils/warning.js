import {
  EmbedBuilder
} from "discord.js";

// WARNING Command
export default {
  name: "warning",
  description: "Sends a warning about gambling-related commands for user awareness.",
  aliases: ["disclaimer",
    "alert"],
  cooldown: 10000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const warningEmbed = new EmbedBuilder()
    .setDescription(
      `# ⚠️ Important Warning\n**Please Note:** Some of the commands available in this bot involve gambling-like games intended for entertainment purposes only. These games are not related to real-life gambling, and no real money is involved. We **strictly prohibit** any form of real money trading or transactions within this bot.\n`

      + `\nIf you or someone you know is struggling with gambling addiction, we strongly encourage seeking professional help. Your well-being is important to us. 💙\n` + `\n-# Additionally, if you find any user engaging in malpractices or violating the bot's terms, please report them to the server administrators or moderators. Maintaining a safe and friendly community is a shared responsibility.`
    )
    .setFooter({
      text: "Stay Safe and Enjoy Responsibly!"
    });

    try {
      await message.author.send({
        embeds: [warningEmbed], ephemeral: true
      });
    } catch {
      await message.reply({
        embeds: [warningEmbed], ephemeral: true
      });
    }
  },
};