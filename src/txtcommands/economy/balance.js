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
          t => t.setContent(`### <:bank_card:1368183874378666096> **${targetName.toUpperCase()}'S BALANCE**`)
        )
        .addSeparatorComponents(s => s)
        .addTextDisplayComponents(
          t => t.setContent(
            `<:kasiko_coin:1300141236841086977> **Wallet:** **${cash.toLocaleString()}** Cash\n` +
            `<:bank:1352897312606785576> **Bank:** **${bankDeposit.toLocaleString()}** Cash *(Lvl.${bankLevel})*\n` +
            `<:spark:1355139233559351326> **Interest:** **${bankInterest.toLocaleString()}** Cash\n` +
            `<:moneybag:1365976001179553792> **Liquid Wealth:** **${totalWealth.toLocaleString()}** Cash\n` +
            `<:trophy:1352897371595477084> **Net Worth:** **${networth.toLocaleString()}** Cash`
          )
        )
        .addSeparatorComponents(s => s)
        .addTextDisplayComponents(
          t => t.setContent(`-# <:reply:1368224908307468408> \`kas deposit all\` · \`kas withdraw <amt>\` · \`kas daily\``)
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
