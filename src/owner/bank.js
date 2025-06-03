import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import OwnerModel from "../../models/Owner.js";
import {
  client
} from "../../bot.js";

export default {
  name: "bank",
  description: "Check or deduct a user's bank balance (Owner only).",
  aliases: [],
  args: "<status|deduct> <@user|userId> [amount]",
  example: [
    "bank status @User",
    "bank status 123456789012345678",
    "bank deduct @User 5000"
  ],
  emoji: "🏦",
  cooldown: 5000,
  category: "🧑🏻‍💻 Owner",
  execute: async (args, message) => {
    const subcommand = args[1];
    const target = message.mentions.users.first();
    const targetId = target?.id || args[2];

    // Owner check
    const ownerDoc = await OwnerModel.findOne({
      ownerId: message.author.id
    });
    if (!ownerDoc) {
      return message.channel.send("❌ You are not authorized to use this command.");
    }

    if (!["status", "deduct"].includes(subcommand)) {
      return message.channel.send("❌ Invalid subcommand. Use `status` or `deduct`.");
    }

    if (!targetId || targetId.length < 18) {
      return message.channel.send("❌ Please mention a valid user or provide a valid user ID.");
    }

    let discordUser;
    try {
      discordUser = target || await client.users.fetch(targetId);
    } catch {
      return message.channel.send("❌ Could not find a user with that ID.");
    }

    const userData = await getUserData(discordUser.id);
    if (!userData) {
      return message.channel.send("❌ Failed to retrieve user's account data.");
    }

    if (subcommand === "status") {
      const embed = new EmbedBuilder()
      .setTitle(`🏦 Bank Status for ${discordUser.username}`)
      .setColor("Blue")
      .addFields(
        {
          name: "Bank", value: `<:kasiko_coin:1300141236841086977> ${userData?.bankAccount?.deposit?.toLocaleString()}`, inline: true
        },
        {
          name: "Cash", value: `<:kasiko_coin:1300141236841086977> ${userData?.cash?.toLocaleString()}`, inline: true
        }
      );

      return message.channel.send({
        embeds: [embed]
      });
    }

    // Handle deduct subcommand
    const amount = parseInt(args[3]);
    if (isNaN(amount) || amount <= 0) {
      return message.channel.send("❌ Please enter a valid amount to deduct.");
    }

    if (userData.bank < amount) {
      return message.channel.send(`❌ The user only has <:kasiko_coin:1300141236841086977> ${userData.bank.toLocaleString()} in their bank.`);
    }

    try {
      userData.bankAccount.deposit -= amount;
      await updateUser(discordUser.id, {
        "bankAccount.deposit": userData.bankAccount.deposit
      });

      const logChannel = client.channels?.cache?.get('1361928841307623506');
      const logEmbed = new EmbedBuilder()
      .setTitle("𝗕𝗔𝗡𝗞 𝗗𝗘𝗗𝗨𝗖𝗧𝗜𝗢𝗡")
      .setColor("Red")
      .setDescription([
        `👤 **User:** ${discordUser.tag}`,
        `🏦 **Deducted By:** ${message.author.tag}`,
        `💰 **Amount Deducted:** <:kasiko_coin:1300141236841086977> ${amount.toLocaleString()}`,
        `🏛️ **New Balance:** <:kasiko_coin:1300141236841086977> ${userData.bankAccount.deposit.toLocaleString()}`
      ].join("\n"));

      if (logChannel) {
        logChannel.send({
          embeds: [logEmbed]
        });
      }

      const confirmEmbed = new EmbedBuilder()
      .setDescription(`✅ Successfully deducted <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** from **${discordUser.username}**'s bank.`)
      .setColor("Green");

      return message.channel.send({
        embeds: [confirmEmbed]
      });
    } catch (err) {
      console.error(err);
      return message.channel.send("❌ An error occurred while deducting the bank balance.");
    }
  }
};