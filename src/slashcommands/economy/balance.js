import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import { getUserData } from '../../../database.js';
import { getUserBankDetails } from '../../txtcommands/bank/bankHanlder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or another user\'s cash, bank deposit, and wealth.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose balance you want to check')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      if (!interaction.deferred) {
        await interaction.deferReply({ ephemeral: false });
      }

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const targetId = targetUser.id;
      const targetName = targetUser.globalName || targetUser.username;

      const userData = await getUserData(targetId);
      if (!userData) {
        return await interaction.editReply({
          content: `<:warning:1366050875243757699> Account not found for **${targetName}**.`
        });
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
          t => t.setContent(`-# <:reply:1368224908307468408> Use \`/inventory\` · \`/team\` · \`/stocks\` for more details`)
        );

      return await interaction.editReply({
        components: [C],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      console.error('[SlashBalance] Error:', error);
      return await interaction.editReply({
        content: `<:warning:1366050875243757699> An error occurred while retrieving balance information.`
      });
    }
  }
};
