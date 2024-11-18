import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default  {
  name: "support",
  description: "Provides a support link with a styled embed and donation message.",
  aliases: ["assist"],
  cooldown: 4000,
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
        .setURL("https://discord.gg/supportserverlink"),
      new ButtonBuilder()
        .setLabel("Donate to Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://www.buymeacoffee.com/YOUR_PROFILE")
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};