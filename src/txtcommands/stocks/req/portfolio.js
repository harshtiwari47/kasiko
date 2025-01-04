import {
  getUserData,
  updateUser,
  readStockData,
  writeStockData
} from '../../../../database.js';

import {
  client
} from "../../../../bot.js";

import {
  sellStock
} from './sell.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  InteractionCollector,
  InteractionType,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data);
  } else {
    return context.send(data);
  }
}

async function handleNumberInput(interaction, stockName) {
  const number = interaction.fields.getTextInputValue('stockSellingInput');
  const parsedNumber = parseInt(number, 10);

  if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
    await interaction.reply({
      content: 'Invalid input! Please enter a number between 1 and 100.', ephemeral: true
    });
  } else {
    await interaction.deferReply();
    return await sellStock(interaction.user.id, interaction.user.username, stockName, parsedNumber, interaction);
  }
}

export async function portfolio(userId, context, viewerId) {
  try {
    let userData = await getUserData(userId);
    const stockData = readStockData();

    if (!userData.stocks) {
      return await handleMessage(context, {
        content: "⚠️ User doesn't own any 📊 stocks.",
      });
    }

    let portfolioDetails = "";
    let portfolioValue = 0;
    let cost = 0;

    for (const stockName in userData.stocks.toJSON()) {
      if (stockName === "_id") continue;
      if (
        userData &&
        userData.stocks &&
        userData.stocks[stockName] &&
        stockData[stockName] &&
        userData.stocks[stockName].shares === 0
      )
        continue;

      const numShares = userData.stocks[stockName].shares;
      const stockPrice = stockData[stockName].currentPrice;
      const stockValue = numShares * stockPrice;

      portfolioValue += stockValue;
      cost += userData.stocks[stockName].cost;

      let isProfit = false;

      if (stockValue > userData.stocks[stockName].cost) isProfit = true;

      portfolioDetails += `ᯓ★ **${stockName}**\n𝖲𝗁𝖺𝗋𝖾𝗌: **${numShares}** ${isProfit ? "<:stocks_profit:1321342107574599691>": "<:stocks_loss:1321342088020885525>"}\n`;
    }

    const profitLossPercent = ((portfolioValue - cost) / cost) * 100;
    const profitLossLabel = profitLossPercent >= 0 ? "Profit": "Loss";
    const profitLossSymbol = profitLossPercent >= 0 ? "+": "-";
    const finalPercentage = `${profitLossSymbol}${Math.abs(profitLossPercent).toFixed(2)}`;

    // Embed 1: Portfolio Overview
    const embed1 = new EmbedBuilder()
    .setTitle(`📈 <@${userId}>'s 𝐒𝐭𝐨𝐜𝐤𝐬 𝐏𝐨𝐫𝐭𝐟𝐨𝐥𝐢𝐨`)
    .setDescription(portfolioDetails || "No stocks found.")
    .addFields([{
      name: "𝑻𝒐𝒕𝒂𝒍 𝑷𝒐𝒓𝒕𝒇𝒐𝒍𝒊𝒐 𝑽𝒂𝒍𝒖𝒆",
      value: `<:kasiko_coin:1300141236841086977>${portfolioValue.toFixed(0).toLocaleString()} 𝑪𝒂𝒔𝒉`,
    },
    ])
    .setColor("#f2dada");

    // Embed 2: Portfolio Summary
    const embed2 = new EmbedBuilder()
    .addFields([{
      name: "𝑻𝒐𝒕𝒂𝒍 𝑩𝒐𝒖𝒈𝒉𝒕 𝑷𝒓𝒊𝒄𝒆",
      value: `<:kasiko_coin:1300141236841086977>${cost.toFixed(0).toLocaleString()} 𝑪𝒂𝒔𝒉`,
    },
      {
        name: `𝑁𝑒𝑡 ${profitLossLabel}`,
        value: `${isNaN(finalPercentage) ? "0": finalPercentage}%`,
      },
    ])
    .setColor(profitLossPercent >= 0 ? "#a8dabf": "#f56056");

    let stockSelectMenu;
    let stocksNumber = Object.keys(userData.stocks.toJSON()).filter(stock => userData.stocks[stock] && userData.stocks[stock].shares > 0).length;

    if (stocksNumber > 0) {
      stockSelectMenu = new StringSelectMenuBuilder()
      .setCustomId('stocks_select')
      .setPlaceholder('📈 𝘝𝘐𝘌𝘞 𝘗𝘈𝘙𝘛𝘐𝘊𝘜𝘓𝘈𝘙 𝘚𝘛𝘖𝘊𝘒')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        Object.keys(userData.stocks.toJSON()).filter(stock => userData.stocks[stock] && userData.stocks[stock].shares > 0).reduce((available, stock) => {
          available.push({
            label: `${stock.toUpperCase()}`,
            value: stock
          })
          return available
        },
          [])
      );
    }

    let components = [];
    if (viewerId === userId && stockSelectMenu && stocksNumber > 0) {
      const selectRow = new ActionRowBuilder().addComponents(stockSelectMenu);
      if (selectRow) {
        components = [selectRow]
      }
    }

    let contentMessage = {
      embeds: [embed1,
        embed2]
    }

    if (components.length > 0) {
      contentMessage.components = components
    }
    // Send Embeds
    const selectMessage = await handleMessage(context, contentMessage);

    const collector = selectMessage.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 30000
    });

    let selectedStock;

    collector.on('collect', async interaction => {
      try {
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: 'You are not allowed to interact!',
            ephemeral: true,
          });
        }

        selectedStock = interaction.values[0];

        const stockPrice = stockData[selectedStock].currentPrice;

        await interaction.deferReply();

        const embed = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`
          📊 **${interaction.user.username}**, you have bought **${userData.stocks[selectedStock].shares}** of **${selectedStock}** for price <:kasiko_coin:1300141236841086977> **${userData.stocks[selectedStock].cost.toFixed(0).toLocaleString()}** 𝑪𝒂𝒔𝒉.\nCurrent Value: <:kasiko_coin:1300141236841086977> **${(Number(stockPrice) * Number(userData.stocks[selectedStock].shares)).toFixed(1).toLocaleString()}** 𝑪𝒂𝒔𝒉.
          `);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`sellStocks-btn${selectedStock}`).setLabel("SELL").setStyle(ButtonStyle.Danger).setDisabled(false)
        );

        return await interaction.editReply({
          embeds: [embed],
          components: [buttons]
        })

      } catch (err) {
        console.error(err)
      }
    })

    collector.on('end',
      async (collected, reason) => {
        try {
          selectMessage.edit({
            components: []
          })
        } catch (e) {}
      });
  } catch (e) {
    console.error(e);
    return await handleMessage(context,
      {
        content: "⚠️ Something went wrong while viewing stock portfolio.",
      });
  }
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.customId && interaction.isButton() && interaction.customId.startsWith('sellStocks-btn')) {
    if (interaction.replied || interaction.deferred) return; // Do not reply again

    let stockName = interaction.customId.replace("sellStocks-btn", "");
    const customDataModal = {
      action: 'stockSell-modal',
      name: stockName
    };

    const encodedData = JSON.stringify(customDataModal);

    const modal = new ModalBuilder()
    .setCustomId(encodedData)
    .setTitle(`Sell ${stockName}`);

    const numberInput = new TextInputBuilder()
    .setCustomId('stockSellingInput')
    .setLabel(`Enter the number of stocks:`)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(3)
    .setPlaceholder('e.g., 42 (0-100)')
    .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(numberInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.ModalSubmit) {
    try {
      const customData = JSON.parse(interaction.customId);

      if (customData.action === 'stockSell-modal') {
        await handleNumberInput(interaction, customData.name);
      }
    } catch (e) {}
  }
});