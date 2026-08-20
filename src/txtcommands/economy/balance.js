import {
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { getUserData } from '../../../database.js';
import { getUserBankDetails } from '../bank/bankHanlder.js';
import { discordUser, handleMessage } from '../../../helper.js';

export default {
  name: 'balance',
  description: 'Check your wallet cash, bank deposit, interest, and total wealth.',
  aliases: ['bal', 'cash', 'wallet', 'money'],
  args: '[@user]',
  example: [
    'balance',
    'bal',
    'cash @user'
  ],
  cooldown: 3000,
  category: '🏦 Economy',

  execute: async (args, context) => {
    try {
      const { id: senderId, username: senderUsername, name: senderName } = discordUser(context);

      let targetId = senderId;
      let targetName = senderName;

      // Check for user mention
      if (context.mentions?.users?.first()) {
        const mentioned = context.mentions.users.first();
        targetId = mentioned.id;
        targetName = mentioned.globalName || mentioned.username;
      }

      const userData = await getUserData(targetId);
      if (!userData) {
        return handleMessage(context, `<:warning:1366050875243757699> User account not found.`);
      }

      const bankData = await getUserBankDetails(targetId);

      const cash = Number(userData.cash || 0);
      const bankDeposit = Number(bankData?.deposit || 0);
      const bankInterest = Number(bankData?.interest || 0);
      const bankLevel = Number(bankData?.level || 1);
      const totalWealth = cash + bankDeposit;
      const networth = Number(userData.networth || totalWealth);

      const C = new ContainerBuilder()
        .setAccentColor(0x2B2D31)
        .addTextDisplayComponents(
          t => t.setContent(`### 💳 **${targetName.toUpperCase()}'S FINANCIAL BALANCE**`),
          t => t.setContent(`-# Financial overview & bank status`)
        )
        .addSeparatorComponents(s => s)
        .addTextDisplayComponents(
          t => t.setContent(
            `• 💵 **Wallet Cash:** <:kasiko_coin:1300141236841086977> **${cash.toLocaleString()} Cash**\n` +
            `• 🏛️ **Bank Deposit:** <:kasiko_coin:1300141236841086977> **${bankDeposit.toLocaleString()} Cash** *(Lvl.${bankLevel})*\n` +
            `• 📈 **Accumulated Interest:** <:kasiko_coin:1300141236841086977> **${bankInterest.toLocaleString()} Cash**\n` +
            `• 💎 **Total Liquid Wealth:** <:kasiko_coin:1300141236841086977> **${totalWealth.toLocaleString()} Cash**`
          )
        )
        .addSeparatorComponents(s => s)
        .addTextDisplayComponents(
          t => t.setContent(`-# 💡 Quick Actions: \`kas deposit all\` · \`kas withdraw <amt>\` · \`kas daily\``)
        );

      return await handleMessage(context, {
        components: [C],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (err) {
      console.error('[BalanceCommand] Error:', err);
      return handleMessage(context, {
        content: `**Balance Error**: ${err.message}`
      });
    }
  }
};
