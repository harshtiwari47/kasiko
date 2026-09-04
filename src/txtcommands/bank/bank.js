import {
  updateBankDetails,
  getUserBankDetails,
  openBankAccount
} from "./bankHanlder.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags
} from "discord.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

import {
  checkPassValidity
} from "../explore/pass.js";

const BankInfo = {
  security: 1,
  charge: 0,
  levelUpCost: 300000,
  storage: 500000,
  maxLevel: 2700
};

export function getSingleLevelBankUpgradeCost(lvl, additionalReward = 0) {
  const baseCost = BankInfo.levelUpCost || 300000;
  // After level 50, cost increases according to level: +8,000 per level above 50
  const extra = lvl > 50 ? (lvl - 50) * 8000 : 0;
  return Math.max(50000, baseCost + extra - additionalReward);
}

export function getTotalBankUpgradeCost(startLevel, times, additionalReward = 0) {
  let total = 0;
  for (let i = 0; i < times; i++) {
    total += getSingleLevelBankUpgradeCost(startLevel + i, additionalReward);
  }
  return total;
}

export function buildBankStatusContainer({ name, userData, account, additionalReward = 0, disabled = false }) {
  const isMaxLevel = (account?.level || 1) >= (BankInfo.maxLevel || 2700);

  const container = new ContainerBuilder()
    .addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### <:bank:1352897312606785576> 𝐑𝐨𝐲𝐚𝐥 𝐁𝐚𝐧𝐤`),
        textDisplay => textDisplay.setContent(`-# <:spark:1355139233559351326> **LEVEL:** **${account?.level || 1}**${isMaxLevel ? ' (MAX)' : ` / ${BankInfo.maxLevel}`}`)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('Bank')
        .setURL("https://harshtiwari47.github.io/kasiko-public/images/royal-bank.jpg")
      )
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<:reply:1368224908307468408> \` 𝖠𝖼𝖼𝗈𝗎𝗇𝗍 — ${name} \``)
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`**𝘋𝘌𝘗𝘖𝘚𝘐𝘛**`),
      textDisplay => textDisplay.setContent(`-# <:kasiko_coin:1300141236841086977> ${(account?.deposit || 0).toLocaleString()}`)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`**𝘊𝘈𝘗𝘈𝘊𝘐𝘛𝘠**`),
      textDisplay => textDisplay.setContent(`-# <:kasiko_coin:1300141236841086977> ${((account?.level || 1) * BankInfo.storage).toLocaleString()}`)
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`<:bank_card:1368183874378666096>  **𝘊𝘈𝘚𝘏 𝘐𝘕 𝘏𝘈𝘕𝘋**`),
      textDisplay => textDisplay.setContent(`-# <:kasiko_coin:1300141236841086977> ${(userData?.cash || 0).toLocaleString()}`)
    );

  if (!account?.open) {
    container.addActionRowComponents(
      row => row.addComponents(
        new ButtonBuilder()
          .setCustomId('open_bank')
          .setLabel('𝗢𝗣𝗘𝗡 𝗕𝗔𝗡𝗞 𝗔𝗖𝗖𝗢𝗨𝗡𝗧')
          .setEmoji(`1300141236841086977`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled)
      )
    );
  } else if (!isMaxLevel) {
    const nextUpgradeCost = getSingleLevelBankUpgradeCost(account.level || 1, additionalReward);
    const canAfford = (account.deposit || 0) >= nextUpgradeCost;
    container.addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`**𝘕𝘌𝘟𝘛 𝘜𝘗𝘎𝘙𝘈𝘋𝘌**`),
        textDisplay => textDisplay.setContent(`-# <:kasiko_coin:1300141236841086977> ${nextUpgradeCost.toLocaleString()} (to Lv.${(account.level || 1) + 1}) · \`kas bank upgrade\``)
      )
      .setButtonAccessory(
        btn => btn
        .setCustomId('bank_upgrade')
        .setLabel('Upgrade')
        .setEmoji('1355139233559351326')
        .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(disabled)
      )
    );
  } else {
    container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`**𝘜𝘗𝘎𝘙𝘈𝘋𝘌**`),
      textDisplay => textDisplay.setContent(`-# 🏆 Bank Vault is at MAX LEVEL (${(BankInfo.maxLevel || 2700).toLocaleString()})!`)
    );
  }

  return container;
}

export const Bank = {
  async deposit(amount, context) {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      const userData = await getUserData(userId);

      if (!userData) return;

      const account = userData.bankAccount;
      if (!account || !account?.open) {
        return await handleMessage(context,
          `ⓘ **${name}**, you don't have a bank account yet. Open one first!\nOpen through **\`bank\`** or *USE*: **\`bank open\`**\n**COST**: <:kasiko_coin:1300141236841086977> 1,000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const walletCash = Math.max(0, Number(userData.cash || 0));
      const currentDeposit = Math.max(0, Number(account.deposit || 0));
      const bankLimit = (account.level || 1) * (BankInfo.storage || 500000);
      const spaceAvailable = Math.max(0, bankLimit - currentDeposit);

      if (spaceAvailable <= 0) {
        return await handleMessage(context, `ⓘ **${name}**, your bank vault is already at maximum capacity (<:kasiko_coin:1300141236841086977> **${bankLimit.toLocaleString()}**)! Upgrade your bank level (\`kas bank upgrade\`) to store more.`);
      }

      if (walletCash <= 0) {
        return await handleMessage(context, `ⓘ **${name}**, you have no cash in your wallet to deposit!`);
      }

      let depositAmount;
      const isAll = (amount === "all" || String(amount).toLowerCase() === "all" || String(amount).toLowerCase() === "max");

      if (isAll) {
        depositAmount = Math.min(walletCash, spaceAvailable);
      } else {
        const parsed = parseInt(amount, 10);
        if (isNaN(parsed) || parsed <= 0) {
          return await handleMessage(context,
            `ⓘ **${name}**, please enter a valid positive integer amount to deposit (or \`all\`)!`
          ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        if (walletCash < parsed) {
          return await handleMessage(context,
            `ⓘ **${name}**, you don't have enough cash to deposit that amount! (Wallet: <:kasiko_coin:1300141236841086977> ${walletCash.toLocaleString()})`
          ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        depositAmount = Math.min(parsed, spaceAvailable);
      }

      if (depositAmount <= 0) {
        return await handleMessage(context, `ⓘ **${name}**, your bank vault is already at maximum capacity! Upgrade your bank level to store more.`);
      }

      const newDeposit = currentDeposit + depositAmount;
      const remainingCash = walletCash - depositAmount;

      try {
        await updateUser(userId, {
          cash: remainingCash,
          'bankAccount.deposit': newDeposit
        });

        const Container = new ContainerBuilder()
        .addTextDisplayComponents(td =>
          td.setContent(`### <:bank:1352897312606785576> **${name}** __deposited__ <:kasiko_coin:1300141236841086977> **${depositAmount.toLocaleString()}**.`)
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(td =>
          td.setContent(
            `-# ⇆ ᴛʀᴀɴꜱᴀᴄᴛɪᴏɴ ꜱᴜᴍᴍᴀʀʏ\n` +
            `**ɴᴇᴡ ʙᴀɴᴋ ʙᴀʟᴀɴᴄᴇ ┊ <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()} / ${bankLimit.toLocaleString()}**\n` +
            `**ʀᴇᴍᴀɪɴɪɴɢ ᴄᴀꜱʜ ┊ <:kasiko_coin:1300141236841086977> ${remainingCash.toLocaleString()}**`
          )
        );

        return await handleMessage(context, {
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        });

      } catch (err) {
        console.error(`❌ Error updating bank details for ${username}:`, err);

        // Rollback: If updating the bank fails, refund the cash amount back to the user
        await updateUser(userId, {
          cash: walletCash
        });

        return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, an error occurred while processing your deposit. Your cash balance has been restored.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      return await handleMessage(context, `Error depositing funds: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },

  async withdraw(amount, context) {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      const userData = await getUserData(userId);
      if (!userData) return;
      const account = userData.bankAccount;

      if (!account || !account?.open) {
        return await handleMessage(context,
          `ⓘ **${name}**, you don't have a bank account yet. Open one first!\nOpen through **\`bank\`** or *USE*: **\`bank open\`**\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (String(amount).toLowerCase() === "all") {
        amount = Math.max(0, Number(account.deposit || 0));
      } else {
        amount = Number(amount);
      }

      if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return await handleMessage(context,
          `ⓘ **${name}**, please enter a valid positive integer amount to withdraw!`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const totalWithdrawal = amount;

      if (totalWithdrawal > (account.deposit || 0)) {
        return await handleMessage(context,
          `ⓘ **${name}**, you don't have enough funds in your bank account to withdraw <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**. You can withdraw <:kasiko_coin:1300141236841086977> **${(account.deposit || 0).toLocaleString()}**`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Calculate the new bank deposit and update the user's cash balance.
      const newDeposit = Math.max(0, (account.deposit || 0) - totalWithdrawal);
      const originalCash = userData.cash;
      userData.cash = Number(userData.cash || 0) + amount;

      try {
        await updateUser(userId, {
          cash: userData.cash,
          'bankAccount.deposit': newDeposit
        });

        const Container = new ContainerBuilder()
        .addTextDisplayComponents(td =>
          td.setContent(`### <:bank:1352897312606785576> **${name}** __withdrew__ <:kasiko_coin:1300141236841086977> **${amount.toLocaleString()}**.`)
        )
        .addSeparatorComponents(sep => sep)
        .addTextDisplayComponents(td =>
          td.setContent(
            `-# ⇆ ᴛʀᴀɴꜱᴀᴄᴛɪᴏɴ ꜱᴜᴍᴍᴀʀʏ\n` +
            `**ɴᴇᴡ ʙᴀɴᴋ ʙᴀʟᴀɴᴄᴇ ┊ <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}**\n` +
            `**ʀᴇᴍᴀɪɴɪɴɢ ᴄᴀꜱʜ ┊ <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}**`
          )
        )

        return await handleMessage(context, {
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        })

      } catch (err) {
        console.error(
          `❌ Error updating bank details for ${username}:`,
          err
        );

        // Rollback: Restore the user's original cash balance if something goes wrong.
        try {
          await updateUser(userId, {
            cash: originalCash
          });
        } catch (rollbackError) {
          console.error(
            `❌ Rollback failed for ${username}:`,
            rollbackError
          );
        }

        return await handleMessage(context,
          `<:warning:1366050875243757699> **${name}**, an error occurred while processing your withdrawal. Your cash balance has been restored.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
        console.error(err);
      }
      return await handleMessage(context, `Error withdrawing funds: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
  async openAccount(context) {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      const userData = await getUserData(userId);

      if (!userData) return;

      if (userData.cash < 1000) {
        return await handleMessage(context,
          `**${name}**, you need at least <:kasiko_coin:1300141236841086977> 1000 cash to open a bank account.`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (userData.bankAccount && userData.bankAccount.open) {
        return await handleMessage(context, `**${name}**, you already have a bank account.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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
            return await handleMessage(context, `Error opening bank account: ${err.message}\nⓘ Please try again!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        }
      }

      if (isOpened) {
        return await handleMessage(context,
          `<:bank:1352897312606785576> 𝐁𝐀𝐍𝐊\n**${name}** successfully opened a bank account! Remaining cash: <:kasiko_coin:1300141236841086977> ${userData.cash.toLocaleString()}`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      return await handleMessage(context, `Error opening bank account: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },

  async showStatus(context) {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      let userData = await getUserData(userId);

      if (!userData) return;

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

      let account = userData.bankAccount;
      let container = buildBankStatusContainer({ name, userData, account, additionalReward });

      const resMsg = await handleMessage(context, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      if (!resMsg || !resMsg.createMessageComponentCollector) return;

      const collector = resMsg.createMessageComponentCollector({
        filter: i => i.user.id === userId && ['open_bank', 'bank_upgrade'].includes(i.customId),
        time: 60000
      });

      collector.on('collect', async interaction => {
        try {
          if (interaction.customId === 'open_bank') {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
            await Bank.openAccount(interaction);
            userData = await getUserData(userId);
            account = userData?.bankAccount;
            const updatedContainer = buildBankStatusContainer({ name, userData, account, additionalReward });
            await resMsg.edit({
              components: [updatedContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => {});
          } else if (interaction.customId === 'bank_upgrade') {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});
            await Bank.upgrade(interaction, 1);
            userData = await getUserData(userId);
            account = userData?.bankAccount;
            const updatedContainer = buildBankStatusContainer({ name, userData, account, additionalReward });
            await resMsg.edit({
              components: [updatedContainer],
              flags: MessageFlags.IsComponentsV2
            }).catch(() => {});
          }
        } catch (err) {
          console.error("Error handling bank button interaction:", err);
        }
      });

      collector.on('end', async () => {
        try {
          const disabledContainer = buildBankStatusContainer({ name, userData, account, additionalReward, disabled: true });
          await resMsg.edit({
            components: [disabledContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        } catch (e) {}
      });

      return resMsg;

    } catch (err) {
      return await handleMessage(context,
        `Error fetching bank status: ${err.message}`).catch(err => ![50001,
          50013,
          10008].includes(err.code) && console.error(err));
    }
  },

  async upgrade(context,
    times = 1) {
    try {

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      const account = await getUserBankDetails(userId);
      if (!account) {
        return await handleMessage(context,
          `**${name}**, you don't have a bank account yet. Open one first!\n**USE**: \`bank open\`\n**COST**: <:kasiko_coin:1300141236841086977> 1000`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const currentLevel = account.level || 1;
      const MAX_LEVEL = BankInfo.maxLevel || 2700;

      if (currentLevel >= MAX_LEVEL) {
        return await handleMessage(context,
          `<:bank:1352897312606785576> **${name}**, your bank vault has already reached the maximum level of ***${MAX_LEVEL.toLocaleString()}*** (Max Storage: <:kasiko_coin:1300141236841086977> **${(MAX_LEVEL * BankInfo.storage).toLocaleString()}**)!`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (!times || times < 1 || !Number.isInteger(Number(times))) times = 1;

      // Prevent exceeding MAX_LEVEL
      if (currentLevel + times > MAX_LEVEL) {
        times = MAX_LEVEL - currentLevel;
      }

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

      const upgradeCost = getTotalBankUpgradeCost(currentLevel, times, additionalReward);

      if (account.deposit < upgradeCost) {
        return await handleMessage(context,
          `<:warning:1366050875243757699> **${name}**, you need <:kasiko_coin:1300141236841086977> **${upgradeCost.toLocaleString()}** cash in Bank to upgrade ${times > 1 ? `**${times}** levels` : `to Level ${currentLevel + 1}`}. (Current Deposit: <:kasiko_coin:1300141236841086977> **${account.deposit.toLocaleString()}**)`
        ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const newLevel = currentLevel + times;
      const newDeposit = account.deposit - upgradeCost;

      await updateBankDetails(userId, {
        level: newLevel, deposit: newDeposit
      });

      const nextLevelNotice = newLevel >= MAX_LEVEL
        ? `\n🏆 **Your bank has reached MAX LEVEL (${MAX_LEVEL.toLocaleString()})!**`
        : `\n-# Next upgrade cost: <:kasiko_coin:1300141236841086977> ${getSingleLevelBankUpgradeCost(newLevel, additionalReward).toLocaleString()} · Max Lv.${MAX_LEVEL.toLocaleString()}`;

      return await handleMessage(context,
        `<:bank:1352897312606785576> **${name}** upgraded their bank to level ***${newLevel}*** successfully! ▲\n\n**COST**: <:kasiko_coin:1300141236841086977> ${upgradeCost.toLocaleString()}\n𖢻 **Remaining bank balance**: <:kasiko_coin:1300141236841086977> ${newDeposit.toLocaleString()}\n𖢻 **New Storage Capacity**: <:kasiko_coin:1300141236841086977> ${(newLevel * BankInfo.storage).toLocaleString()}${nextLevelNotice}`
      ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    } catch (err) {
      return await handleMessage(context, `Error upgrading bank: ${err.message}`).catch(console.error);
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
  emoji: "<:bank:1352897312606785576>",
  cooldown: 10000,
  category: "🏦 Economy",

  // Execute function based on the command alias
  execute: async (args, context) => {
    try {
      const action = args[0] ? args[0].toLowerCase(): null;

      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

      switch (action) {
      case "deposit":
      case "dep": {
        let depositAmount;
        const depArg = args[1] ? String(args[1]).toLowerCase().trim() : "all";
        if (depArg === "all" || depArg === "max" || depArg === "a") {
          depositAmount = "all";
        } else {
          depositAmount = parseInt(depArg, 10);
          if (isNaN(depositAmount) || depositAmount <= 0) {
            return await handleMessage(context, `ⓘ **${username}**, please specify a valid amount to deposit (or \`all\`).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        }

        // Call a function to deposit the amount
        return Bank.deposit(depositAmount, context);
      }

      case "bs":
      case "ba":
        return Bank.showStatus(context);

      case "withdraw":
      case "with": {
        let withdrawAmount;
        const withArg = args[1] ? String(args[1]).toLowerCase().trim() : "all";
        if (withArg === "all" || withArg === "max" || withArg === "a") {
          withdrawAmount = "all";
        } else {
          withdrawAmount = parseInt(withArg, 10);
          if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            return await handleMessage(context, `ⓘ **${username}**, please specify a valid amount to withdraw (or \`all\`).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        }

        // Call a function to withdraw the amount
        return Bank.withdraw(withdrawAmount, context);
      }

      case "bank":
        let subcommand = args[1] ? args[1].toLowerCase(): null;
        switch (subcommand) {
        case "status":
        case "account":
          return Bank.showStatus(context);

        case "open":
          return Bank.openAccount(context);

        case "upgrade":
          const times = args[2] ? Number(args[2]): 1;
          return Bank.upgrade(context, times);

        case "help":
          const helpContainer = new ContainerBuilder()
            .setAccentColor(0xd4e6f6)
            .addTextDisplayComponents(
              textDisplay => textDisplay.setContent(`### <:bank:1352897312606785576> 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝑩𝒂𝒏𝒌`),
              textDisplay => textDisplay.setContent(
                `Hello **${username}**, manage your bank using the following commands:\n\n` +
                '**`bank open`**\n- Open a bank account.\n' +
                '**`deposit <amount>`**\n- Deposit funds into your bank.\n' +
                '**`withdraw <amount>`**\n- Withdraw funds from your bank.\n' +
                '**`bank`**\n- Check your bank status (you can use **bs** or **ba**).\n' +
                '**`bank upgrade <times (default 1)>`**\n- Upgrade your bank level (Max Lv.2,700). Each level increases capacity by <:kasiko_coin:1300141236841086977> 500k. (COST: <:kasiko_coin:1300141236841086977> 300k per level; increases scalingly after Lv.50).'
              )
            )
            .addSeparatorComponents(separate => separate)
            .addTextDisplayComponents(
              textDisplay => textDisplay.setContent(`-# 💡 Use your bank wisely!`)
            );

          return await handleMessage(context, {
            components: [helpContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

        default:
          return Bank.showStatus(context);
        }

      default:
        return await handleMessage(context, `ⓘ **${username}**, please provide a valid bank action (e.g., \`deposit\`, \`withdraw\`, \`bank status\`).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, an unexpected error occurred. Please try again later.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};