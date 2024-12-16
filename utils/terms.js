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

import {
  createUser
} from "../database.js";

export const termsAndcondition = async (message) => {
  try {
    // Create the embed for Terms and Conditions
    const embed = new EmbedBuilder()
    .setColor('#2537e8')
    .setTitle('Terms and Conditions Agreement')
    .setDescription(
      'Welcome to our game bot! Before proceeding, please carefully read and accept our Terms and Conditions.\n\n' +
      '[Click here to read the full Terms and Conditions](https://kasiko-bot.vercel.app/terms.html)\n\n' +
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

        let user = await createUser(message.author.id);
        if (user) {
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
        } else {
          return message.reply({
            content: '⚠️ Something went wrong! Please contact the support or try again',
            ephemeral: true
          });
        }
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
    return await message.channel.send(
      'Your channel is missing the following permissions that the bot needs:\n' +
      '1. **Send Messages**\n' +
      '2. **Embed Links**\n' +
      '3. **Manage Messages**\n' +
      '4. **Read Message History**\n' +
      '5. **View Channel**\n' +
      '6. **Message Components (Buttons)**\n' +
      'Please update the bot permissions and try again!'
    );
  }
};