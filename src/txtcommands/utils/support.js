import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "support",
  description: "Provides a bot's support link and donation link.",
  aliases: ["assist"],
  cooldown: 8000,
  category: "Utility",

  execute: async (args, message) => {
    const embed = new EmbedBuilder()
    .setTitle("🛠 Need Support?")
    .setDescription("If you need help or have any questions, click the button below to join our support server!\n\nWant to support us? **Donate** to keep the bot running and unlock exclusive privileges!")
    .setColor(0x00AE86);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setLabel("Join Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/DVFwCqUZnc"),
      new ButtonBuilder()
      .setLabel("Donate (Soon)")
      .setStyle(ButtonStyle.Link)
      .setURL("https://www.buymeacoffee.com/")
    );

    await message.reply({
      embeds: [embed], components: [row]
    });
  },
};