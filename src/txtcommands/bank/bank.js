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

import {
  checkPassValidity
} from "../explore/pass.js";

const BankInfo = {
  security: 1,
  charge: 0,
  levelUpCost: 300000,
  storage: 500000
}

export const Bank = {
  async deposit(userId, amount, message) {
    try {
      const userData = await getUserData(userId);

      if (!userData) return;

      if (amount && String(amount).toLowerCase() === "all") amount = Number(userData.cash || 0);

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
      let newDeposit = account.deposit + amount;
      const bankLimit = account.level * (BankInfo.storage || 300000);

      if (newDeposit > bankLimit) {
        amount = Math.max(0, amount - (newDeposit - bankLimit));
        newDeposit = bankLimit;
      }

      userData.cash = Math.max(0, userData.cash - Number(amount));

      try {
        await updateUser(userId, {
          cash: Math.max(0, userData.cash),
          'bankAccount.deposit': Math.abs(newDeposit)
        });

        return message.channel.send(
          `## <:bank:1352897312606785576> **${message.author.username}** __deposited__ <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.\n` +
          `-# ⇆ ᴛʀᴀɴꜱᴀᴄᴛɪᴏɴ ꜱᴜᴍᴍᴀʀʏ\n` +
          `**ɴᴇᴡ ʙᴀɴᴋ ʙᴀʟᴀɴᴄᴇ ┊ <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}**\n` +
          `**ʀᴇᴍᴀɪɴɪɴɢ ᴄᴀꜱʜ ┊ <:kasiko_coin:1300141236841086977> ${Math.abs(userData.cash).toLocaleString()}**`
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

      if (String(amount).toLowerCase() === "all") {
        amount = Math.max(0, account.deposit);
      }

      const totalWithdrawal = amount;

      if (totalWithdrawal > account.deposit) {
        return message.channel.send(
          `ⓘ **${message.author.username}**, you don't have enough funds in your bank account to withdraw <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**. You can withdraw <:kasiko_coin:1300141236841086977> **${(account.deposit).toLocaleString()}**`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Calculate the new bank deposit and update the user's cash balance.
      const newDeposit = Math.max(0, account.deposit - totalWithdrawal);
      const originalCash = userData.cash; // Save original cash for potential rollback.
      userData.cash = userData.cash + amount;

      try {
        await updateUser(userId, {
          cash: userData.cash,
          'bankAccount.deposit': newDeposit
        });

        return message.channel.send(
          `## <:bank:1352897312606785576> **${message.author.username}** __withdrew__ <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.\n` +
          `-# ⇆ ᴛʀᴀɴꜱᴀᴄᴛɪᴏɴ ꜱᴜᴍᴍᴀʀʏ\n` +
          `**ɴᴇᴡ ʙᴀɴᴋ ʙᴀʟᴀɴᴄᴇ ┊ <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}**\n` +
          `**ʀᴇᴍᴀɪɴɪɴɢ ᴄᴀꜱʜ ┊ <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}**`
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

      const passInfo = await checkPassValidity(userId);
      let additionalReward = 0;
      if (passInfo.isValid) {
        if (passInfo.passType !== "titan") {
          additionalReward = 50000;

          if (passInfo.passType !== "pheonix") {
            additionalReward = 100000;
          }
        }
      }

      const emebedHeader = new EmbedBuilder()
      .setColor("#a4bef2")
      .setDescription("## <:bank:1352897312606785576> 𝐑𝐨𝐲𝐚𝐥 𝐁𝐚𝐧𝐤\n" + `<:spark:1355139233559351326> **𝑳𝒆𝒗𝒆𝒍:** **${account.level}** <:spark:1355139233559351326> **𝑺𝒉𝒊𝒆𝒍𝒅**: **${account.shield}**\n<:spark:1355139233559351326> **𝑼𝒑𝒈𝒓𝒂𝒅𝒆**: ** <:kasiko_coin:1300141236841086977> ${300000 - additionalReward}**`)

      const embed = new EmbedBuilder()
      .setColor('#dfe9fd') // Choose a color for the embed
      .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/royal-bank.jpg`)
      .addFields(
        {
          name: '<:locker:1366052984546656257> 𝗗𝗘𝗣𝗢𝗦𝗜𝗧', value: `<:kasiko_coin:1300141236841086977> ${account.deposit.toLocaleString()}`, inline: true
        },
        {
          name: '<:locker:1366052984546656257> 𝗖𝗔𝗣𝗔𝗖𝗜𝗧𝗬', value: `<:kasiko_coin:1300141236841086977> ${(account.level * BankInfo.storage).toLocaleString()}`, inline: true
        },
        {
          name: '<:locker:1366052984546656257> 𝗖𝗔𝗦𝗛 𝗜𝗡 𝗛𝗔𝗡𝗗', value: `<:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`, inline: true
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

  async upgrade(userId, message, times = 1) {
    try {
      const account = await getUserBankDetails(userId);
      if (!account) {
        return message.channel.send(
          `**${message.author.username}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (!times || times < 0 || !Number.isInteger(Number(times))) times = 1;

      const passInfo = await checkPassValidity(userId);

      let additionalReward = 0;
      if (passInfo.isValid) {
        if (passInfo.passType !== "titan") {
          additionalReward = 50000;

          if (passInfo.passType !== "pheonix") {
            additionalReward = 100000
          }
        }
      }

      const currentLevel = account.level;
      const upgradeCost = (BankInfo.levelUpCost - additionalReward) * times;

      if (account.deposit < upgradeCost) {
        return message.channel.send(
          `<:warning:1366050875243757699> **${message.author.username}**, you need <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()}** cash in Bank to upgrade to the next level.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const newLevel = currentLevel + times;
      const newDeposit = account.deposit - upgradeCost;

      await updateBankDetails(userId, {
        level: newLevel, deposit: newDeposit
      });

      return message.channel.send(
        `<:bank:1352897312606785576> **${message.author.username}** upgraded their bank to level ***${newLevel}*** successfully! ▲\n\n**COST**: <:kasiko_coin:1300141236841086977> ${upgradeCost.toLocaleString()}\n𖢻 **Remaining bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}`
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
          `<:bank:1352897312606785576> 𝐁𝐀𝐍𝐊\n**${message.author.username}** successfully opened a bank account! Remaining cash: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
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
          const times = args[2] ? Number(args[2]): 1;
          return Bank.upgrade(userId, message, times);

        case "help":
          const bankEmbed = new EmbedBuilder()
          .setColor('#d4e6f6')
          .setTitle('<:bank:1352897312606785576> 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝑩𝒂𝒏𝒌')
          .setDescription(
            `Hello **${username}**, manage your bank using the following commands:\n\n` +
            '**`bank open`**\n- Open a bank account.\n' +
            '**`deposit <amount>`**\n- Deposit funds into your bank.\n' +
            '**`withdraw <amount>`**\n- Withdraw funds from your bank.\n' +
            '**`bank status`**\n- Check your bank status (you can use **bs** or **ba**).\n' +
            '**`bank upgrade <times (default 1)>`**\n- Upgrade your bank level. Each level increases capacity by <:kasiko_coin:1300141236841086977> 500k. (COST: <:kasiko_coin:1300141236841086977> 300k per level).'
          )
          .setFooter({
            text: 'Use your bank wisely!'
          });

          return message.channel.send({
            embeds: [bankEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

        default:
          return Bank.showStatus(userId, message);
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