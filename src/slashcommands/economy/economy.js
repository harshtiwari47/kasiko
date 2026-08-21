import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  EmbedBuilder
} from 'discord.js';
import {
  userExists,
  getUserData
} from '../../../database.js';
import { getUserBankDetails } from '../../txtcommands/bank/bankHanlder.js';
import workCommand from '../../txtcommands/economy/work.js';
import crimeCommand from '../../txtcommands/economy/crime.js';
import begCommand from '../../txtcommands/economy/beg.js';
import taskCommand from '../../txtcommands/economy/task.js';
import voteCommand from '../../txtcommands/economy/vote.js';
import spyCommand from '../../txtcommands/economy/spy.js';
import lootCommand from '../../txtcommands/economy/loot.js';
import giveawayCommand from '../../txtcommands/economy/giveaway.js';
import bankCommand from '../../txtcommands/economy/bank.js';
import giveCommand from '../../txtcommands/economy/give.js';
import robCommand from '../../txtcommands/economy/rob.js';
import { dailylogin } from '../../txtcommands/economy/dailylogin.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Core economy operations and progression commands.')
    .addSubcommand(sub =>
      sub
        .setName('balance')
        .setDescription('Check your or another user\'s cash, bank deposit, and wealth.')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user whose balance you want to check')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('daily')
        .setDescription('Claim your daily login reward and pet food bonus.')
    )
    .addSubcommand(sub =>
      sub
        .setName('bank')
        .setDescription('Manage your bank account: view status, open an account, or upgrade storage.')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Bank action to perform')
            .setRequired(false)
            .addChoices(
              { name: '📊 View Bank Status', value: 'status' },
              { name: '🏦 Open Bank Account', value: 'open' },
              { name: '⚡ Upgrade Bank Capacity', value: 'upgrade' }
            )
        )
        .addIntegerOption(option =>
          option.setName('upgrade_times')
            .setDescription('Number of levels to upgrade (default: 1)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('deposit')
        .setDescription('Deposit an amount into your bank account.')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('The amount to deposit')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('withdraw')
        .setDescription('Withdraw an amount from your bank account.')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('The amount to withdraw')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('give')
        .setDescription('Give cash to another user.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to give money to')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('The amount to give')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('rob')
        .setDescription('Attempt a risky heist to rob cash from another member.')
        .addUserOption(opt =>
          opt
            .setName('target')
            .setDescription('The user you want to rob')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('work')
        .setDescription('Work at your career job to earn steady cash and climb promotions.')
    )
    .addSubcommand(sub =>
      sub
        .setName('crime')
        .setDescription('Commit high-risk crimes for huge payouts (boostable with energy drinks).')
    )
    .addSubcommand(sub =>
      sub
        .setName('beg')
        .setDescription('Beg for cash and discover rare item drops.')
    )
    .addSubcommand(sub =>
      sub
        .setName('task')
        .setDescription('View daily and weekly community tasks, progress, and rewards.')
    )
    .addSubcommand(sub =>
      sub
        .setName('vote')
        .setDescription('Claim Top.gg voting rewards or toggle reminder notifications.')
        .addStringOption(opt =>
          opt
            .setName('reminder')
            .setDescription('Enable or disable automatic vote reminders')
            .addChoices(
              { name: '🔔 Enable Reminders', value: 'yes' },
              { name: '🔕 Disable Reminders', value: 'no' }
            )
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('spy')
        .setDescription('Embark on a covert spy mission for top-secret classified rewards.')
    )
    .addSubcommand(sub =>
      sub
        .setName('loot')
        .setDescription('Use mission tickets to embark on vehicle heist missions.')
    )
    .addSubcommand(sub =>
      sub
        .setName('giveaway')
        .setDescription('View active server giveaways or check current drops.')
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      return handleMessage(interaction, {
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in a server.`,
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'balance': {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetId = targetUser.id;
        const targetName = targetUser.globalName || targetUser.username;

        const userData = await getUserData(targetId);
        if (!userData) {
          return await handleMessage(interaction, {
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

        const embed = new EmbedBuilder()
          .setTitle(`<:bank_card:1368183874378666096> ${targetName.toUpperCase()}'S BALANCE`)
          .setColor(0x2B2D31)
          .setDescription(
            `<:kasiko_coin:1300141236841086977> **Wallet:** **${cash.toLocaleString()}** Cash\n` +
            `<:bank:1352897312606785576> **Bank:** **${bankDeposit.toLocaleString()}** Cash *(Lvl.${bankLevel})*\n` +
            `<:spark:1355139233559351326> **Interest:** **${bankInterest.toLocaleString()}** Cash\n` +
            `<:moneybag:1365976001179553792> **Liquid Wealth:** **${totalWealth.toLocaleString()}** Cash\n` +
            `<:trophy:1352897371595477084> **Net Worth:** **${networth.toLocaleString()}** Cash`
          )
          .setFooter({ text: "Use /shop inventory · /wildlife team · /stocks for more details" });

        return await handleMessage(interaction, {
          embeds: [embed]
        });
      }

      case 'daily': {
        return dailylogin(interaction);
      }

      case 'bank': {
        const action = interaction.options.getString('action');
        const upgradeTimes = interaction.options.getInteger('upgrade_times') || 1;
        if (!bankCommand?.execute) {
          return await handleMessage(interaction, `Failed to execute bank command!`);
        }
        if (action === 'open') {
          return await bankCommand.execute(['bank', 'open'], interaction);
        } else if (action === 'upgrade' || interaction.options.getInteger('upgrade_times')) {
          return await bankCommand.execute(['bank', 'upgrade', upgradeTimes], interaction);
        } else {
          return await bankCommand.execute(['bank'], interaction);
        }
      }

      case 'deposit': {
        const amount = interaction.options.getInteger('amount');
        if (bankCommand?.execute) {
          return await bankCommand.execute(["deposit", amount], interaction);
        }
        return handleMessage(interaction, { content: 'Deposit command is currently unavailable.' });
      }

      case 'withdraw': {
        const amount = interaction.options.getInteger('amount');
        if (bankCommand?.execute) {
          return await bankCommand.execute(["withdraw", amount], interaction);
        }
        return handleMessage(interaction, { content: 'Withdraw command is currently unavailable.' });
      }

      case 'give': {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        if (giveCommand?.execute) {
          return await giveCommand.execute(["give", amount, targetUser.id], interaction);
        }
        return handleMessage(interaction, { content: 'Give command is currently unavailable.' });
      }

      case 'rob': {
        const targetUser = interaction.options.getUser('target');
        if (robCommand?.execute) {
          return await robCommand.execute(['rob', targetUser.id], interaction);
        }
        return handleMessage(interaction, { content: 'Rob command is currently unavailable.' });
      }

      case 'work': {
        if (workCommand?.interact) return await workCommand.interact(interaction);
        if (workCommand?.execute) return await workCommand.execute(['work'], interaction);
        return handleMessage(interaction, { content: 'Work command is currently unavailable.' });
      }

      case 'crime': {
        if (crimeCommand?.interact) return await crimeCommand.interact(interaction);
        if (crimeCommand?.execute) return await crimeCommand.execute(['crime'], interaction);
        return handleMessage(interaction, { content: 'Crime command is currently unavailable.' });
      }

      case 'beg': {
        if (begCommand?.execute) return await begCommand.execute(['beg'], interaction);
        return handleMessage(interaction, { content: 'Beg command is currently unavailable.' });
      }

      case 'task': {
        if (taskCommand?.execute) return await taskCommand.execute(['task'], interaction);
        return handleMessage(interaction, { content: 'Task command is currently unavailable.' });
      }

      case 'vote': {
        const reminder = interaction.options.getString('reminder');
        const args = ['vote'];
        if (reminder) args.push(reminder);
        if (voteCommand?.execute) return await voteCommand.execute(args, interaction);
        return handleMessage(interaction, { content: 'Vote command is currently unavailable.' });
      }

      case 'spy': {
        if (spyCommand?.interact) return await spyCommand.interact(interaction);
        if (spyCommand?.execute) return await spyCommand.execute(['spy'], interaction);
        return handleMessage(interaction, { content: 'Spy mission is currently unavailable.' });
      }

      case 'loot': {
        if (lootCommand?.execute) return await lootCommand.execute(['loot'], interaction);
        return handleMessage(interaction, { content: 'Loot mission is currently unavailable.' });
      }

      case 'giveaway': {
        if (giveawayCommand?.execute) return await giveawayCommand.execute(['giveaway'], interaction);
        return handleMessage(interaction, { content: 'Giveaway command is currently unavailable.' });
      }

      default:
        return handleMessage(interaction, { content: 'Unknown economy action.' });
    }
  }
};
