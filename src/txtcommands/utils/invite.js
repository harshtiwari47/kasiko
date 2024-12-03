import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";


export default {
  name: "invite",
  description: "Provides the bot invite link.",
  aliases: ["inv",
    "botinvite"],
  cooldown: 8000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    const embed = new EmbedBuilder()
    .setTitle("🤖 Invite Me!")
    .setDescription("Bring me to your server and enjoy amazing features!")
    .setColor(0x5865f2)
    .addFields({
      name: "Invite Link", value: "[Click Here to Invite](https://discord.com/oauth2/authorize?client_id=1300081477358452756&permissions=1135386416761920&scope=bot)"
    })
    .setFooter({
      text: "Thanks for inviting me!"
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setLabel("Invite Me")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/oauth2/authorize?client_id=1300081477358452756&permissions=1135386416761920&scope=bot")
    );

    await message.reply({
      embeds: [embed], components: [row]
    });
  },
};