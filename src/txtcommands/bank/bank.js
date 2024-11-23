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
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** deposited <:kasiko_coin:1300141236841086977> **${amount}** successfully.\n**New bank balance**: <:kasiko_coin:1300141236841086977> **${newDeposit}**,\n**Remaining Cash**: <:kasiko_coin:1300141236841086977> **${userData.cash}**`
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

      const intrest = Math.min(BankInfo.charge * account.level * 0.5, 30);
      const charge = Math.ceil((amount * intrest) / 100);
      const totalWithdrawal = amount + charge;

      if (totalWithdrawal > account.deposit) {
        return message.channel.send(
          `**${message.author.username}**, you don't have enough funds in your bank account to withdraw <:kasiko_coin:1300141236841086977> **${amount}**. You can withdraw <:kasiko_coin:1300141236841086977> **${account.deposit - charge}**`
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
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** withdrew <:kasiko_coin:1300141236841086977> **${amount}** successfully.\n**Charge**: <:kasiko_coin:1300141236841086977> ${charge},\n**New bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit},\n**Total cash**: <:kasiko_coin:1300141236841086977> ${userData.cash}`
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

      const embed = new EmbedBuilder()
      .setColor('#dfe9fd') // Choose a color for the embed
      .setTitle('🏦 𝐁𝐀𝐍𝐊')
      .setDescription(`**Bank Status for ${message.author.username}:**`)
      .addFields(
        {
          name: '𝑳𝒆𝒗𝒆𝒍', value: `${account.level}`, inline: true
        },
        {
          name: '𝑫𝒆𝒑𝒐𝒔𝒊𝒕 ', value: `<:kasiko_coin:1300141236841086977> ${account.deposit}`, inline: true
        },
        {
          name: '𝑺𝒉𝒊𝒆𝒍𝒅 ', value: `${account.shield}`, inline: true
        },
        {
          name: '𝑺𝒕𝒐𝒓𝒂𝒈𝒆 𝑪𝒂𝒑𝒂𝒄𝒊𝒕𝒚 ', value: `<:kasiko_coin:1300141236841086977> ${account.level * BankInfo.storage}`, inline: true
        },
        {
          name: '𝑰𝒏𝒕𝒓𝒆𝒔𝒕', value: `${Math.min(BankInfo.charge * account.level * 0.5, 30)}`, inline: true
        },
        {
          name: '𝑪𝒂𝒔𝒉 𝒐𝒏 𝑯𝒂𝒏𝒅', value: `<:kasiko_coin:1300141236841086977> ${userData.cash}`, inline: true
        }
      )
      .setTimestamp();

      return message.channel.send({
        embeds: [embed]
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
          `${message.author.username}, you need <:kasiko_coin:1300141236841086977> ${upgradeCost} cash in Bank to upgrade to the next level.`
        );
      }

      const newLevel = currentLevel + 1;
      const newDeposit = account.deposit - upgradeCost;

      await updateBankDetails(userId, {
        level: newLevel, deposit: newDeposit
      });

      return message.channel.send(
        `**${message.author.username}** upgraded their bank to level ${newLevel} successfully! Remaining bank balance: <:kasiko_coin:1300141236841086977> ${newDeposit}`
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
        `🏦 𝐁𝐀𝐍𝐊\n**${message.author.username}** successfully opened a bank account! Remaining cash: <:kasiko_coin:1300141236841086977> ${userData.cash}`
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
    "bank status",
    "bank upgrade",
    "bank open (Open your bank account)",
  ],
  cooldown: 5000,
  category: "Economy",

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
          // Call a function to display the user's bank status
          return Bank.showStatus(userId, message);

        case "open":
          // Call a function to open a user's bank account
          return Bank.openAccount(userId, message);

        case "upgrade":
          // Call a function to upgrade the user's bank
          return Bank.upgrade(userId, message);

        default:
          return message.channel.send("🏦 𝐁𝐀𝐍𝐊\nUse `deposit <amount>`, `withdraw <amount>`, `bank status`, `bank open` or `bank upgrade`.");
        }
      default:
        return message.channel.send("🏦 𝐁𝐀𝐍𝐊\nUse `deposit <amount>`, `withdraw <amount>`, `bank status`, `bank open` or `bank upgrade`.");
      }
    } catch (e) {
      console.error(e);
    }
  }
};