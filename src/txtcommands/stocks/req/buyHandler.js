import {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  InteractionType,
  ButtonBuilder,
  ButtonStyle,
  InteractionCollector
} from 'discord.js';

import {
  buySharesCommand
} from './buy.js';

import {
  client
} from "../../../../bot.js";

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

async function handleNumberInput(interaction, stockName) {
  const number = interaction.fields.getTextInputValue('stockBuyingInput');
  const parsedNumber = parseInt(number, 10);

  if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
    await interaction.reply({
      content: 'Invalid input! Please enter a number between 1 and 100.', ephemeral: true
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    await interaction.deferReply();
    return await buySharesCommand(interaction.user.id, interaction.user.username, stockName, parsedNumber, interaction);
  }
}

export async function handleBuyRequest(userId, username, stockName, context) {
  const customData = {
    action: 'stockBuy-modal',
    name: stockName
  };
  const encodedData = JSON.stringify(customData);

  const modal = new ModalBuilder()
  .setCustomId(encodedData)
  .setTitle(`Buy ${stockName}`);

  const numberInput = new TextInputBuilder()
  .setCustomId('stockBuyingInput')
  .setLabel(`Enter the number of stocks:`)
  .setStyle(TextInputStyle.Short)
  .setMinLength(1)
  .setMaxLength(3)
  .setPlaceholder('e.g., 42 (0-100)')
  .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(numberInput);
  modal.addComponents(actionRow);

  await context.showModal(modal);
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId) {
      try {
        const customData = JSON.parse(interaction.customId);

        if (customData.action === 'stockBuy-modal') {
          await handleNumberInput(interaction, customData.name);
        }
      } catch (e) {}
    }
  }
});