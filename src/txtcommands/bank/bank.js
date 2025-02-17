import {
  updateBankDetails,
  getUserBankDetails,
  openBankAccount
} from "./bankHanlder.js";

import {
  EmbedBuilder
} from "discord.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

const BankInfo = {
  security: 1,
  charge: 1.5,
  levelUpCost: 1000,
  storage: 300000
}

export const Bank = {
  async deposit(userId, amount, message) {
    try {
      const userData = await getUserData(userId);

      if (!userData) return;

      if (amount && amount === "all") amount = Number(userData.cash || 0);

      if (userData.cash < Number(amount)) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have enough cash to deposit that amount!`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const account = userData.bankAccount;
      if (!account || !account?.open) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Deduct cash and increase bank deposit
      userData.cash = Math.max(0, userData.cash - Number(amount));
      const newDeposit = account.deposit + amount;
      const bankLimit = account.level * (BankInfo.storage || 300000);

      if (newDeposit > bankLimit) {
        return message.channel.send(`⚠️ Oops! ***${message.author.username}***, you can't deposit an amount exceeding your account's deposit limit of <:kasiko_coin:1300141236841086977> **${bankLimit}**.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      try {
        await updateUser(userId, {
          cash: Math.max(0, userData.cash - Number(amount)),
          'bankAccount.deposit': newDeposit
        });

        return message.channel.send(
          `🏦 **${message.author.username}** deposited <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.\n𖢻 **New bank balance**: <:kasiko_coin:1300141236841086977> **${newDeposit.toLocaleString()}**\n⤿ **Remaining Cash**: <:kasiko_coin:1300141236841086977> **${Math.abs(userData.cash - amount).toLocaleString()}**`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      } catch (err) {
        console.error(`❌ Error updating bank details for ${message.author.username}:`, err);

        // Rollback: If updating the bank fails, refund the cash amount back to the user
        await updateUser(userId, {
          cash: userData.cash
        });

        return message.channel.send(`⚠️ **${message.author.username}**, an error occurred while processing your deposit. Your cash balance has been restored.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      return message.channel.send(`Error depositing funds: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },

  async withdraw(userId, amount, message) {
    try {
      const userData = await getUserData(userId);
      if (!userData) return;
      const account = userData.bankAccount;

      if (!account || !account?.open) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let Interest = Math.min((BankInfo.charge || 0) * account.level * 0.5, 30);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (
        userData.pass &&
        userData.pass.year === currentYear &&
        userData.pass.month === currentMonth &&
        userData.pass.type === "premium"
      ) {
        let additionalReward = 0.20 * Interest;
        Interest -= additionalReward;
      }

      if (amount === "all") {
        amount = Math.max(
          0,
          account.deposit - Math.ceil((account.deposit * Interest) / 100)
        );
      }

      const charge = Math.ceil((amount * Interest) / 100);
      const totalWithdrawal = amount + charge;

      if (totalWithdrawal > account.deposit) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have enough funds in your bank account to withdraw <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**. You can withdraw <:kasiko_coin:1300141236841086977> **${(account.deposit - charge).toLocaleString()}**`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Calculate the new bank deposit and update the user's cash balance.
      const newDeposit = account.deposit - totalWithdrawal;
      const originalCash = userData.cash; // Save original cash for potential rollback.
      userData.cash = userData.cash + amount;

      try {
        await updateUser(userId, {
          cash: userData.cash,
          'bankAccount.deposit': newDeposit
        });

        return message.channel.send(
          `🏦 **${message.author.username}** withdrew <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.\n⚠ **Charge**: <:kasiko_coin:1300141236841086977> ${charge.toLocaleString()}\n𖢻 **New bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}\n⤿ **Total cash**: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      } catch (err) {
        console.error(
          `❌ Error updating bank details for ${message.author.username}:`,
          err
        );

        // Rollback: Restore the user's original cash balance if something goes wrong.
        try {
          await updateUser(userId, {
            cash: originalCash
          });
        } catch (rollbackError) {
          console.error(
            `❌ Rollback failed for ${message.author.username}:`,
            rollbackError
          );
        }

        return message.channel.send(
          `⚠️ **${message.author.username}**, an error occurred while processing your withdrawal. Your cash balance has been restored.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
        console.error(err);
      }
      return message.channel.send(`Error withdrawing funds: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },

  async showStatus(userId, message) {
    try {
      const userData = await getUserData(userId);

      if (!userData) return;

      const account = userData.bankAccount;

      if (!account) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let Interest = Math.min(BankInfo.charge * account.level * 0.5, 30);
      let specialInterest = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
        let additionalReward = 0.20 * Interest;
        specialInterest -= additionalReward;
      }

      const emebedHeader = new EmbedBuilder()
      .setColor("#a4bef2")
      .setDescription("## 🏦 𝐑𝐨𝐲𝐚𝐥 𝐁𝐚𝐧𝐤\n" + `**Bank Status for ${message.author.username}:**\n` + `**𝑳𝒆𝒗𝒆𝒍:** **${account.level}** **𝑺𝒉𝒊𝒆𝒍𝒅**: **${account.shield}** **𝑰𝒏𝒕𝒆𝒓𝒆𝒔𝒕**: **${Interest} ${specialInterest ? "(" + specialInterest.toFixed(1) + ")": ''}**`)

      const embed = new EmbedBuilder()
      .setColor('#dfe9fd') // Choose a color for the embed
      .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/royal-bank.jpg`)
      .addFields(
        {
          name: '𝑫𝒆𝒑𝒐𝒔𝒊𝒕 ', value: `<:kasiko_coin:1300141236841086977> ${account.deposit.toLocaleString()}`, inline: true
        },
        {
          name: '𝑺𝒕𝒐𝒓𝒂𝒈𝒆 𝑪𝒂𝒑𝒂𝒄𝒊𝒕𝒚 ', value: `<:kasiko_coin:1300141236841086977> ${(account.level * BankInfo.storage).toLocaleString()}`, inline: true
        },
        {
          name: '𝑪𝒂𝒔𝒉 𝒐𝒏 𝑯𝒂𝒏𝒅', value: `<:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`, inline: true
        }
      )
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: message.author.displayAvatarURL({
          dynamic: true
        })
      })

      return message.channel.send({
        embeds: [emebedHeader, embed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      return message.channel.send(`Error fetching bank status: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },

  async upgrade(userId, message) {
    try {
      const account = await getUserBankDetails(userId);
      if (!account) {
        return message.channel.send(
          `**${message.author.username}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const currentLevel = account.level;
      const upgradeCost = BankInfo.levelUpCost * currentLevel;

      if (account.deposit < upgradeCost) {
        return message.channel.send(
          `${message.author.username}, you need <:kasiko_coin:1300141236841086977> ${upgradeCost.toLocaleString()} cash in Bank to upgrade to the next level.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const newLevel = currentLevel + 1;
      const newDeposit = account.deposit - upgradeCost;

      await updateBankDetails(userId, {
        level: newLevel, deposit: newDeposit
      });

      return message.channel.send(
        `🏦 **${message.author.username}** upgraded their bank to level ***${newLevel}*** successfully! ▲\n\n𖢻 **Remaining bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      return message.channel.send(`Error upgrading bank: ${err.message}`).catch(console.error);
    }
  },

  async openAccount(userId, message) {
    try {
      const userData = await getUserData(userId);

      if (!userData) return;

      if (userData.cash < 1000) {
        return message.channel.send(
          `**${message.author.username}**, you need at least <:kasiko_coin:1300141236841086977> 1000 cash to open a bank account.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (userData.bankAccount && userData.bankAccount.open) {
        return message.channel.send(`**${message.author.username}**, you already have a bank account.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      let isOpened;

      if (userData.bankAccount && !userData?.bankAccount?.open) {
        if (userData.cash > 1000) {
          userData.cash -= 1000;
          userData.bankAccount.open = true;

          try {
            await updateUser(userId, {
              cash: userData.cash,
              'bankAccount.open': true
            });
            isOpened = true;
          } catch (error) {
            return message.channel.send(`Error opening bank account: ${err.message}\nⓘ Please try again!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        }
      }

      if (isOpened) {
        return message.channel.send(
          `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** successfully opened a bank account! Remaining cash: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      return message.channel.send(`Error opening bank account: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};

export default {
  name: "bank",
  description: "Secure your cash from robbery while managing deposits, withdrawals, accounts, and upgrades.",
  aliases: ["bank",
    "deposit",
    "dep",
    "with",
    "withdraw",
    "rob",
    "bs",
    "ba"],
  args: "<action> [amount or target]",
  example: [
    "deposit 500",
    "withdraw 200",
    "bank account",
    "bank upgrade",
    "bank open",
  ],
  related: ["cash",
    "withdraw",
    "rob",
    "deposit"],
  emoji: "🏦",
  cooldown: 10000,
  category: "🏦 Economy",

  // Execute function based on the command alias
  execute: async (args, message) => {
    try {
      const action = args[0] ? args[0].toLowerCase(): null;
      const userId = message.author.id;
      const username = message.author.username;

      switch (action) {
      case "deposit":
      case "dep":
        let depositAmount;
        if (args[1] !== "all") {
          depositAmount = parseInt(args[1], 10);
          if (isNaN(depositAmount) || depositAmount <= 0) {
            return message.channel.send(`ⓘ **${username}**, please specify a valid amount to deposit.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        } else {
          depositAmount = "all";
        }

        // Call a function to deposit the amount
        return Bank.deposit(userId, depositAmount, message);

      case "bs":
      case "ba":
        return Bank.showStatus(userId, message);

      case "withdraw":
      case "with":
        let withdrawAmount;
        if (args[1] !== "all") {
          withdrawAmount = parseInt(args[1], 10);
          if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return message.channel.send(`ⓘ **${username}**, please specify a valid amount to withdraw.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        } else {
          withdrawAmount = "all";
        }

        // Call a function to withdraw the amount
        return Bank.withdraw(userId, withdrawAmount, message);

      case "bank":
        let subcommand = args[1] ? args[1].toLowerCase(): null;
        switch (subcommand) {
        case "status":
        case "account":
          return Bank.showStatus(userId, message);

        case "open":
          return Bank.openAccount(userId, message);

        case "upgrade":
          return Bank.upgrade(userId, message);

        default:
          const bankEmbed = new EmbedBuilder()
          .setColor('#d4e6f6')
          .setTitle('🏦 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝑩𝒂𝒏𝒌')
          .setDescription(
            `Hello **${username}**, manage your bank using the following commands:\n\n` +
            '`bank open`\n- Open a bank account.\n' +
            '`deposit <amount>`\n- Deposit funds into your bank.\n' +
            '`withdraw <amount>`\n- Withdraw funds from your bank.\n' +
            '`bank status`\n- Check your bank status (you can use \`bs\` or \`ba\`).\n' +
            '`bank upgrade`\n- Upgrade your bank level.'
          )
          .setFooter({
            text: 'Use your bank wisely!'
          });

          return message.channel.send({
            embeds: [bankEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

      default:
        return message.channel.send(`ⓘ **${username}**, please provide a valid bank action (e.g., \`deposit\`, \`withdraw\`, \`bank status\`).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
      return message.channel.send(`⚠️ **${message.author.username}**, an unexpected error occurred. Please try again later.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};