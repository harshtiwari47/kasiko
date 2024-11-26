import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType
} from 'discord.js';

import {
  client
} from "../bot.js";

export const termsAndcondition = async (message) => {
  try {
    // Create the embed for Terms and Conditions
    const embed = new EmbedBuilder()
    .setColor('#2537e8')
    .setTitle('Terms and Conditions Agreement')
    .setDescription(
      'Welcome to our game bot! Before proceeding, please carefully read and accept our Terms and Conditions.\n\n' +
      '[Click here to read the full Terms and Conditions](https://yourlink.com/terms)\n\n' +
      '**Important:** Violating the terms may result in severe consequences including temporary or permanent bans from the bot.'
    )
    .addFields({
      name: 'Rules and Regulations',
      value:
      '1. **No Spamming**: Spamming commands or messages will result in a warning or ban.\n' +
      '2. **Respect All Users**: Treat others with respect. Toxic behavior will not be tolerated.\n' +
      '3. **In-Game Currency Only**: Do not engage in real money transactions for in-game goods or services. If we detect this activity, it may result in a permanent ban from the bot.\n' +
      '4. **Suspicious Activity**: Any attempt to exploit the game system or engage in unfair practices may lead to an immediate investigation and a potential ban.'
    })
    .setFooter({
      text: 'By clicking "Accept", you agree to our Terms and Conditions and acknowledge the consequences for violating them.'
    });

    // Create the accept button
    const button = new ButtonBuilder()
    .setCustomId('accept_terms')
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success);

    // Create the row with the button
    const row = new ActionRowBuilder().addComponents(button);

    // Send the embed with the button
    const sentMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    // Create an interaction collector for the button
    const filter = (interaction) =>
    interaction.isButton() && interaction.customId === 'accept_terms';
    const collector = sentMessage.createMessageComponentCollector({
      filter,
      time: 60000 // Timeout after 60 seconds
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'accept_terms') {
        await interaction.reply({
          content: 'Thank you for accepting the Terms and Conditions!',
          ephemeral: true
        });
        // Disable the button after interaction
        const updatedButton = ButtonBuilder.from(button).setDisabled(true);
        const updatedRow = new ActionRowBuilder().addComponents(updatedButton);
        return await sentMessage.edit({
          components: [updatedRow]
        });
        collector.stop();
      }
    });

    collector.on('end',
      async () => {
        // Disable the button when the collector times out
        const updatedButton = ButtonBuilder.from(button).setDisabled(true);
        const updatedRow = new ActionRowBuilder().addComponents(updatedButton);
        return await sentMessage.edit({
          components: [updatedRow]
        });
      });

  } catch (error) {
    console.error('Error in termsAndcondition:',
      error);
    return await message.channel.send('An error occurred while processing your request. Please try again later.');
  }
};