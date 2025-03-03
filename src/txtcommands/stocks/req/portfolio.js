import Company from '../../../../models/Company.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionCollector,
  InteractionType,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder
} from 'discord.js';
import {
  client
} from '../../../../bot.js';

import {
  sellSharesCommand
} from './sell.js';

// Helper function to handle messages for interactions vs. plain messages
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return await context.followUp(data);
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function handleNumberInput(interaction, companyName) {
  const numberInput = interaction.fields.getTextInputValue('companySellingInput');
  const numShares = parseInt(numberInput, 10);
  if (isNaN(numShares) || numShares < 1) {
    return await interaction.reply({
      content: 'Invalid input! Please enter a number greater than 0.',
      ephemeral: true
    });
  }

  // Directly invoke the sell command logic and reply without deferring.
  return await sellSharesCommand(interaction, [null, companyName, numShares]);
}

// Portfolio command for companies with summary details (Total Portfolio Value, Total Bought Price, Net Profit/Loss)
export async function portfolioCommand(context) {
  try {
    const userId = context.user ? context.user.id: context.author.id;
    const username = context.user ? context.user.username: context.author.username;

    // Query companies where the user is a shareholder
    const companies = await Company.find({
      "shareholders.userId": userId
    });
    if (!companies || companies.length === 0) {
      return handleMessage(context, {
        content: `ⓘ **${username}**, you do not own any shares in any companies.`
      });
    }

    let portfolioDetails = "";
    let totalPortfolioValue = 0;
    let totalBoughtPrice = 0;
    const selectOptions = [];

    companies.forEach(company => {
      const shareholder = company.shareholders.find(s => s.userId === userId);
      if (!shareholder) return;

      const sharesOwned = shareholder.shares;
      // Assume each shareholder record has a 'cost' property representing total bought price for these shares.
      const boughtPrice = shareholder.cost || 0;
      // Calculate current holding value, rounded to one decimal place
      const currentValue = Math.round(sharesOwned * company.currentPrice * 10) / 10;

      totalPortfolioValue += currentValue;
      totalBoughtPrice += boughtPrice;

      const isProfit = currentValue > boughtPrice;

      portfolioDetails += `**${company.name}**\n` +
      `𝐒𝐡𝐚𝐫𝐞𝐬: **${sharesOwned}** ${isProfit ? "<:stocks_profit:1321342107574599691>": "<:stocks_loss:1321342088020885525>"}\n` +
      `𝐕𝐚𝐥𝐮𝐞: <:kasiko_coin:1300141236841086977> ${currentValue.toLocaleString()}\n\n`;

      // Add company option for selling if the user owns shares
      if (sharesOwned > 0) {
        selectOptions.push({
          label: company.name,
          value: company.name
        });
      }
    });

    // Compute net profit or loss percentage
    let profitLossPercent = 0;
    if (totalBoughtPrice > 0) {
      profitLossPercent = ((totalPortfolioValue - totalBoughtPrice) / totalBoughtPrice) * 100;
    }
    const profitLossLabel = profitLossPercent >= 0 ? "Profit": "Loss";
    const profitLossSymbol = profitLossPercent >= 0 ? "+": "-";
    const finalPercentage = `${profitLossSymbol}${Math.abs(profitLossPercent).toFixed(2)}`;

    // Embed 1: Portfolio Overview (detailed list)
    const embed1 = new EmbedBuilder()
    .setTitle(`📈 ${username}'s 𝗖𝗼𝗺𝗽𝗮𝗻𝘆 𝗣𝗼𝗿𝘁𝗳𝗼𝗹𝗶𝗼`)
    .setDescription(portfolioDetails || "No companies found.")
    .addFields({
      name: "𝙏𝙤𝙩𝙖𝙡 𝙋𝙤𝙧𝙩𝙛𝙤𝙡𝙞𝙤 𝙑𝙖𝙡𝙪𝙚",
      value: `<:kasiko_coin:1300141236841086977> ${totalPortfolioValue.toLocaleString()} Cash`,
      inline: false
    })
    .setColor("#f2dada");

    // Embed 2: Portfolio Summary (bought price and net profit/loss)
    const embed2 = new EmbedBuilder()
    .addFields([{
      name: "𝙏𝙤𝙩𝙖𝙡 𝘽𝙤𝙪𝙜𝙝𝙩 𝙋𝙧𝙞𝙘𝙚",
      value: `<:kasiko_coin:1300141236841086977> ${totalBoughtPrice.toLocaleString()} Cash`,
      inline: false
    },
      {
        name: `𝙉𝙚𝙩 ${profitLossLabel}`,
        value: `${isNaN(finalPercentage) ? "0": finalPercentage}%`,
        inline: false
      }])
    .setColor(profitLossPercent >= 0 ? "#a8dabf": "#f56056");

    // Build a select menu for companies from which the user can sell shares
    let components = [];
    if (selectOptions.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('company_select')
      .setPlaceholder('Select a company to sell shares')
      .addOptions(selectOptions);
      const row = new ActionRowBuilder().addComponents(selectMenu);
      components.push(row);
    }

    const replyData = {
      embeds: [embed1,
        embed2],
      components
    };
    const replyMessage = await handleMessage(context, replyData);

    // Create a collector for select menu interactions (active for 30 seconds)
    const collector = replyMessage.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 30000
    });

    collector.on('collect', async interaction => {
      try {
        if (interaction.customId === 'company_select') {
          // If the interaction hasn't been replied or deferred, defer it.
          if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({
              ephemeral: true
            });
          }

          const selectedCompanyName = interaction.values[0];
          const company = companies.find(c => c.name === selectedCompanyName);
          if (!company) {
            return interaction.editReply({
              content: 'Company not found.'
            });
          }

          const shareholder = company.shareholders.find(s => s.userId === userId);
          if (!shareholder) {
            return interaction.editReply({
              content: `You don't own shares in ${selectedCompanyName}.`
            });
          }

          const sharesOwned = shareholder.shares;
          const currentPrice = company.currentPrice;
          const currentValue = Math.round(sharesOwned * currentPrice * 10) / 10;
          const detailEmbed = new EmbedBuilder()
          .setColor("#f5bbaf")
          .setDescription(`📊 **${username}**, you currently own **${sharesOwned}** shares of **${selectedCompanyName}**.\n𝙑𝙖𝙡𝙪𝙚: <:kasiko_coin:1300141236841086977> **${currentValue}** 𝑪𝒂𝒔𝒉.\n\nClick **SELL** to sell your shares.`);

          // Create a SELL button for triggering the sale modal.
          const sellButton = new ButtonBuilder()
          .setCustomId(`sellCompany-btn${selectedCompanyName}`)
          .setLabel("SELL")
          .setStyle(ButtonStyle.Danger);
          const buttonRow = new ActionRowBuilder().addComponents(sellButton);

          // Since we already deferred, we update the reply.
          await interaction.editReply({
            embeds: [detailEmbed], components: [buttonRow]
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    collector.on('end',
      async () => {
        try {
          await replyMessage.edit({
            components: []
          });
        } catch (e) {}
      });
  } catch (error) {
    console.error("Error in portfolioCommand:",
      error);
    return handleMessage(context,
      {
        content: `⚠ An error occurred while retrieving your portfolio.\n**Error**: ${error.message}`
      });
  }
}


// Listen for the SELL button press to show the sell modal.
client.on('interactionCreate', async (interaction) => {
  // Check if this is a button interaction and if the customId starts with 'sellCompany-btn'
  if (interaction.isButton() && interaction.customId.startsWith('sellCompany-btn')) {

    if (interaction.replied && interaction.deferred) return;

    const companyName = interaction.customId.replace('sellCompany-btn', '');
    const modal = new ModalBuilder()
    .setCustomId(JSON.stringify({
      action: 'companySell-modal', name: companyName
    }))
    .setTitle(`Sell ${companyName} Shares`);

    const numberInput = new TextInputBuilder()
    .setCustomId('companySellingInput')
    .setLabel('Enter the number of shares to sell:')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 10')
    .setRequired(true);

    // Add the input to an action row, then add it to the modal.
    const actionRow = new ActionRowBuilder().addComponents(numberInput);
    modal.addComponents(actionRow);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.showModal(modal);
      }
    } catch (err) {
      // If the modal cannot be shown (e.g. token expired), reply with an error.
      if (!interaction.replied && !interaction.deferred) {
        console.error("Error showing modal:", err);
        await interaction.reply({
          content: "⚠ Unable to show modal. The interaction may have expired.", ephemeral: true
        });
      }

      return;
    }
  }
});

// Listen for modal submissions.
client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.ModalSubmit) {
    try {
      const customData = JSON.parse(interaction.customId);
      if (customData.action === 'companySell-modal') {
        await handleNumberInput(interaction, customData.name);
      }
    } catch (e) {
      console.error("Modal submission error:", e);
    }
  }
});