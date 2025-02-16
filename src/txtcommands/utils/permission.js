import {
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";

export default {
  name: "permissions",
  description: "Displays the bot's permissions in the server.",
  aliases: ["perms",
    "botperms"],
  cooldown: 6000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      // Get the bot's permissions in the current guild
      const botMember = message.guild.members.me; // Bot's member instance
      const permissions = botMember.permissions;

      const embed = new EmbedBuilder()
      .setTitle("🔑 Bot Permissions")
      .setColor(0x00ff00)
      .addFields(
        {
          name: "🗨️ Send Messages",
          value: permissions.has(PermissionsBitField.Flags.SendMessages)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🔍 Read Message History",
          value: permissions.has(PermissionsBitField.Flags.ReadMessageHistory)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "📎 Attach Files",
          value: permissions.has(PermissionsBitField.Flags.AttachFiles)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🔗 Embed Links",
          value: permissions.has(PermissionsBitField.Flags.EmbedLinks)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🔄 Add Reactions",
          value: permissions.has(PermissionsBitField.Flags.AddReactions)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🔒 Manage Roles",
          value: permissions.has(PermissionsBitField.Flags.ManageRoles)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🔔 Use External Emojis",
          value: permissions.has(PermissionsBitField.Flags.UseExternalEmojis)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "👥 Use Application Commands",
          value: permissions.has(PermissionsBitField.Flags.UseApplicationCommands)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        },
        {
          name: "🎟️ Use External Stickers",
          value: permissions.has(PermissionsBitField.Flags.UseExternalStickers)
          ? "✅ Allowed": "❌ Denied",
          inline: true,
        }
      )
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

      // Reply with the embed
      await message.reply({
        embeds: [embed],
      })
    } catch (e) {
      console.error(e);
    }
  },
};