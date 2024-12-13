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
  storage: 20000
}

export const Bank = {
  async deposit(userId, amount, message) {
    try {
      const userData = await getUserData(userId);
      if (!userData || userData.cash < amount) {
        return message.channel.send(
          `${message.author.username}, you don't have enough cash to deposit ${amount}.`
        );
      }

      const account = await getUserBankDetails(userId);
      if (!account) {
        return message.channel.send(
          `${message.author.username}, you don't have a bank account yet. Open one first!`
        );
      }

      // Deduct cash and increase bank deposit
      userData.cash = userData.cash - amount;
      const newDeposit = account.deposit + amount;

      if (newDeposit > account.level * BankInfo.storage) {
        return message.channel.send(`⚠️ Oops! You can't deposit an amount exceeding your account's deposit limit.`);
      }

      await updateUser(userId, userData);
      await updateBankDetails(userId, {
        deposit: newDeposit
      });

      return message.channel.send(
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** deposited <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** successfully.\n**New bank balance**: <:kasiko_coin:1300141236841086977> **${newDeposit.toLocaleString()}**,\n**Remaining Cash**: <:kasiko_coin:1300141236841086977> **${userData.cash.toLocaleString()}**`
      );
    } catch (err) {
      return message.channel.send(`Error depositing funds: ${err.message}`);
    }
  },

  async withdraw(userId, amount, message) {
    try {
      const userData = await getUserData(userId);
      const account = await getUserBankDetails(userId);

      if (!account) {
        return message.channel.send(
          `**${message.author.username}**, you don't have a bank account yet. Open one first!`
        );
      }

      let intrest = Math.min(BankInfo.charge * account.level * 0.5, 30);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
        let additionalReward = 0.20 * intrest;
        intrest -= additionalReward;
      }

      const charge = Math.ceil((amount * intrest) / 100);
      const totalWithdrawal = amount + charge;

      if (totalWithdrawal > account.deposit) {
        return message.channel.send(
          `**${message.author.username}**, you don't have enough funds in your bank account to withdraw <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**. You can withdraw <:kasiko_coin:1300141236841086977> **${(account.deposit - charge).toLocaleString()}**`
        );
      }

      // Deduct from bank and add to user cash
      const newDeposit = account.deposit - totalWithdrawal;
      userData.cash = userData.cash + amount;

      await updateUser(userId, userData);
      await updateBankDetails(userId, {
        deposit: newDeposit
      });

      message.channel.send(
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** withdrew <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}** successfully.\n**Charge**: <:kasiko_coin:1300141236841086977> ${charge.toLocaleString()},\n**New bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()},\n**Total cash**: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
      );
    } catch (err) {
      return message.channel.send(`Error withdrawing funds: ${err.message}`);
    }
  },

  async showStatus(userId, message) {
    try {
      const account = await getUserBankDetails(userId);
      if (!account) {
        return message.channel.send(`**${message.author.username}**, you don't have a bank account yet.`);
      }

      const userData = await getUserData(userId);

      let intrest = Math.min(BankInfo.charge * account.level * 0.5, 30);
      let specialIntrest = 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (userData.pass && userData.pass.year === currentYear && userData.pass.month === currentMonth && userData.pass.type === "premium") {
        let additionalReward = 0.20 * intrest;
        specialIntrest -= additionalReward;
      }

      const emebedHeader = new EmbedBuilder()
      .setColor("#a4bef2")
      .setDescription("## 🏦 𝐑𝐨𝐲𝐚𝐥 𝐁𝐚𝐧𝐤\n" + `**Bank Status for ${message.author.username}:**\n` + `**𝑳𝒆𝒗𝒆𝒍:** \`${account.level}\` **𝑺𝒉𝒊𝒆𝒍𝒅**: \`${account.shield}\``)

      const embed = new EmbedBuilder()
      .setColor('#dfe9fd') // Choose a color for the embed
      .setImage(`https://harshtiwari47.github.io/kasiko-public/images/bank.jpg`)
      .addFields(
        {
          name: '𝑫𝒆𝒑𝒐𝒔𝒊𝒕 ', value: `<:kasiko_coin:1300141236841086977> ${account.deposit.toLocaleString()}`, inline: true
        },
        {
          name: '𝑺𝒕𝒐𝒓𝒂𝒈𝒆 𝑪𝒂𝒑𝒂𝒄𝒊𝒕𝒚 ', value: `<:kasiko_coin:1300141236841086977> ${(account.level * BankInfo.storage).toLocaleString()}`, inline: true
        },
        {
          name: '𝑰𝒏𝒕𝒓𝒆𝒔𝒕', value: `${intrest} (-${specialIntrest.toFixed(1)})`, inline: true
        },
        {
          name: '𝑪𝒂𝒔𝒉 𝒐𝒏 𝑯𝒂𝒏𝒅', value: `<:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`, inline: true
        }
      )

      return message.channel.send({
        embeds: [emebedHeader, embed]
      });
    } catch (err) {
      return message.channel.send(`Error fetching bank status: ${err.message}`);
    }
  },

  async upgrade(userId, message) {
    try {
      const account = await getUserBankDetails(userId);
      if (!account) {
        return message.channel.send(`**${message.author.username}**, you don't have a bank account yet.`);
      }

      const currentLevel = account.level;
      const upgradeCost = BankInfo.levelUpCost * currentLevel;

      if (account.deposit < upgradeCost) {
        return message.channel.send(
          `${message.author.username}, you need <:kasiko_coin:1300141236841086977> ${upgradeCost.toLocaleString()} cash in Bank to upgrade to the next level.`
        );
      }

      const newLevel = currentLevel + 1;
      const newDeposit = account.deposit - upgradeCost;

      await updateBankDetails(userId, {
        level: newLevel, deposit: newDeposit
      });

      return message.channel.send(
        `**${message.author.username}** upgraded their bank to level ${newLevel} successfully! Remaining bank balance: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}`
      );
    } catch (err) {
      return message.channel.send(`Error upgrading bank: ${err.message}`);
    }
  },

  async openAccount(userId, message) {
    try {
      const userData = await getUserData(userId);

      if (!userData || userData.cash < 1000) {
        return message.channel.send(
          `**${message.author.username}**, you need at least <:kasiko_coin:1300141236841086977> 1000 cash to open a bank account.`
        );
      }

      await openBankAccount(userId);

      // Deduct the account opening cost
      userData.cash = userData.cash - 1000;
      await updateUser(userId, userData);

      message.channel.send(
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** successfully opened a bank account! Remaining cash: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
      );
    } catch (err) {
      if (err.message.includes("already has a bank account")) {
        message.channel.send(`**${message.author.username}**, you already have a bank account.`);
      } else {
        message.channel.send(`Error opening bank account: ${err.message}`);
      }
    }
  }
};

export default {
  name: "bank",
  description: "Banking system for depositing, withdrawing, opening your bank account, and upgrading your bank.",
  aliases: ["bank",
    "deposit",
    "dep",
    "with",
    "withdraw",
    "rob"],
  args: "<action> [amount or target]",
  example: [
    "deposit/dep 500",
    "withdraw/with 200",
    "bank account/status",
    "bank upgrade",
    "bank open (Open your bank account)",
  ],
  related: ["cash",
    "withdraw",
    "rob",
    "deposit"],
  cooldown: 10000,
  category: "🏦 Economy",

  // Execute function based on the command alias
  execute: async (args, message) => {
    try {
      const action = args[0] ? args[0].toLowerCase(): null;
      const userId = message.author.id;

      switch (action) {
      case "deposit":
      case "dep":
        const depositAmount = parseInt(args[1], 10);
        if (isNaN(depositAmount) || depositAmount <= 0) {
          return message.channel.send("Please specify a valid amount to deposit.");
        }

        // Call a function to deposit the amount
        return Bank.deposit(userId, depositAmount, message);

      case "withdraw":
      case "with":
        const withdrawAmount = parseInt(args[1], 10);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
          return message.channel.send("Please specify a valid amount to withdraw.");
        }

        // Call a function to withdraw the amount
        return Bank.withdraw(userId, withdrawAmount, message);

      case "bank":
        let subcommand = args[1] ? args[1].toLowerCase(): null;
        switch (subcommand) {
        case "status":
        case "account":
          // Call a function to display the user's bank status
          return Bank.showStatus(userId, message);

        case "open":
          // Call a function to open a user's bank account
          return Bank.openAccount(userId, message);

        case "upgrade":
          // Call a function to upgrade the user's bank
          return Bank.upgrade(userId, message);

        default:

          const bankEmbed = new EmbedBuilder()
          .setColor('#d4e6f6')
          .setTitle('🏦 **Welcome to Bank**')
          .setDescription(
            'Manage your bank using the following commands:\n\n' +
            '`deposit <amount>` - Deposit funds into your bank.\n' +
            '`withdraw <amount>` - Withdraw funds from your bank.\n' +
            '`bank status` - Check your bank status.\n' +
            '`bank open` - Open a bank account.\n' +
            '`bank upgrade` - Upgrade your bank level.'
          )
          .setFooter({
            text: 'Use your bank wisely!'
          })

          message.channel.send({
            embeds: [bankEmbed]
          });
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
};