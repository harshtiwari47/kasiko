import {
  getUserData,
  updateUser
} from "../../database.js";
import {
  EmbedBuilder
} from "discord.js";
import { logBankAction } from "../../utils/auditLogger.js";

export default {
  name: "bank",
  description: "Check or deduct a user's bank balance (Management only).",
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
    const subcommand = args[1]?.toLowerCase();
    const target = message.mentions.users.first();
    const targetId = target?.id || args[2];

    if (!["status", "deduct"].includes(subcommand)) {
      return message.channel.send("❌ Invalid subcommand. Use `status` or `deduct`.");
    }

    if (!targetId || targetId.length < 18) {
      return message.channel.send("❌ Please mention a valid user or provide a valid user ID.");
    }

    let discordUser;
    try {
      discordUser = target || await message.client.users.fetch(targetId);
    } catch {
      return message.channel.send("❌ Could not find a user with that ID.");
    }

    const userData = await getUserData(discordUser.id);
    if (!userData) {
      return message.channel.send("❌ Failed to retrieve user's account data.");
    }

    if (subcommand === "status") {
      const bankDeposit = userData?.bankAccount?.deposit || 0;
      const bankInterest = userData?.bankAccount?.interest || 0;

      const embed = new EmbedBuilder()
        .setTitle(`🏦 ${discordUser.username}'s Bank Details`)
        .setColor("Blue")
        .setDescription(
          `👤 **User:** ${discordUser.tag} (\`${discordUser.id}\`)\n` +
          `💰 **Cash in Hand:** <:kasiko_coin:1300141236841086977> **${(userData.cash || 0).toLocaleString()}**\n` +
          `🏛️ **Bank Deposit:** <:kasiko_coin:1300141236841086977> **${bankDeposit.toLocaleString()}**\n` +
          `📈 **Accumulated Interest:** <:kasiko_coin:1300141236841086977> **${bankInterest.toLocaleString()}**`
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

    const currentDeposit = userData?.bankAccount?.deposit || 0;
    if (currentDeposit < amount) {
      return message.channel.send(`❌ The user only has <:kasiko_coin:1300141236841086977> ${currentDeposit.toLocaleString()} in their bank deposit.`);
    }

    try {
      const newDeposit = Math.max(currentDeposit - amount, 0);
      await updateUser(discordUser.id, {
        "bankAccount.deposit": newDeposit
      });

      // Send Audit Log
      await logBankAction({
        client: message.client,
        executor: message.author,
        target: discordUser,
        action: 'deduct',
        amount,
        newBalance: newDeposit
      });

      const confirmEmbed = new EmbedBuilder()
        .setDescription(`✅ Successfully deducted <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** from **${discordUser.username}**'s bank deposit.`)
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