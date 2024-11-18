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
  // Create the embed for Terms and Conditions
  const embed = new EmbedBuilder()
  .setColor('#2537e8')
  .setTitle('Terms and Conditions Agreement')
  .setDescription(
    'Welcome to our game bot! Before proceeding, please carefully read and accept our Terms and Conditions.\n\n' +
    '[Click here to read the full Terms and Conditions](https://yourlink.com/terms)\n\n' +
    '**Important:** Violating the terms may result in severe consequences including temporary or permanent bans from the bot.'
  )
  .addFields(
    {
      name: 'Rules and Regulations',
      value: 
        '1. **No Spamming**: Spamming commands or messages will result in a warning or ban.\n' +
        '2. **Respect All Users**: Treat others with respect. Toxic behavior will not be tolerated.\n' +
        '3. **In-Game Currency Only**: Do not engage in real money transactions for in-game goods or services. If we detect this activity, it may result in a permanent ban from the bot.\n' +
        '4. **Suspicious Activity**: Any attempt to exploit the game system or engage in unfair practices may lead to an immediate investigation and a potential ban.'
    }
  )
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
  return await message.channel.send({
    embeds: [embed], components: [row]
  });
}