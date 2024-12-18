import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "guidelines",
  description: "Provides important links and guidelines for the bot.",
  aliases: ["rules"],
  cooldown: 8000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const embed = new EmbedBuilder()
    .setTitle("📜 Important Links & Guidelines")
    .setDescription(
      "Here are some important links and guidelines for using the bot:\n\n" +
      "**Important Links**:\n" +
      "[Terms and Conditions](https://kasiko-bot.vercel.app/terms.html) | " +
      "[Support](https://kasiko-bot.vercel.app/contact.html)"
    )
    .setColor(0x00AE86);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setLabel("Terms and Conditions")
      .setStyle(ButtonStyle.Link)
      .setURL("https://kasiko-bot.vercel.app/terms.html"),
      new ButtonBuilder()
      .setLabel("Support")
      .setStyle(ButtonStyle.Link)
      .setURL("https://kasiko-bot.vercel.app/contact.html")
    );

    await message.reply({
      embeds: [embed], components: [row]
    });
  },
};