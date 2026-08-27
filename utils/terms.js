import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import {
  handleMessage
} from "../helper.js";

import {
  createUser
} from "../database.js";

/**
 * Handle user clicking the [ ✅ Accept Rules ] button globally
 */
export const handleAcceptTerms = async (interaction) => {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({
        ephemeral: true
      });
    }

    const userId = interaction.user.id;
    const res = await createUser(userId);

    if (res && res.success) {
      await interaction.editReply({
        content: "<:emoji_35:1332676884093337603> **Thank you** for accepting the __Terms and Conditions__! <:Bouquet:1356866221529628792>\n\n" +
        "<:left:1350355384111468576> You can start with `kas help` to see all commands.\n\n" +
        "<:help:1350379705689440358> **Usage:**  \n" +
        "- `kas help <cmd>` → Get details about a specific command.  \n" +
        "- `kas guide <cmd>` → View a guide (if available) for the command.\n\n" +
        "> -# Stack up wealth, outsmart the market, and rule the game economy! 🐦‍🔥",
        ephemeral: true
      });

      // Disable button on the original message
      try {
        const disabledButton = new ButtonBuilder()
          .setCustomId('accept_terms_done')
          .setLabel('✅ Rules Accepted')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true);
        const updatedRow = new ActionRowBuilder().addComponents(disabledButton);
        await interaction.message?.edit({
          components: [updatedRow]
        }).catch(() => {});
      } catch (_) {}
    } else {
      await interaction.editReply({
        content: '⚠️ Something went wrong while saving your profile! Please try again.',
        ephemeral: true
      });
    }
  } catch (err) {
    console.error('Error in handleAcceptTerms:', err);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '⚠️ An unexpected error occurred. Please try again.',
          ephemeral: true
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ An unexpected error occurred. Please try again.',
          ephemeral: true
        });
      }
    } catch (_) {}
  }
};

export const termsAndcondition = async (context) => {
  try {
    // Create the embed for Terms and Conditions
    const embed = new EmbedBuilder()
    .setColor('#2537e8')
    .setTitle('Terms and Conditions Agreement')
    .setDescription(
      'Welcome to **Kasiko**! Before proceeding, please ***carefully read and accept our Terms and Conditions***.\n\n' +
      '**[Click here to read the full Terms and Conditions](https://kasiko.vercel.app/terms.html)**\n\n' +
      '**Important:** Violating the terms may result in severe consequences including _temporary or permanent bans_ from the bot.'
    )
    .addFields({
      name: 'Rules and Regulations',
      value:
      '1. **No Spamming**: Spamming commands or messages will result in a warning or ban.\n' +
      '2. **In-Game Currency Only**: Do not engage in real money transactions for in-game goods or services. If we detect this activity, it may result in a permanent ban from the bot.\n' +
      '3. **Suspicious Activity**: Any attempt to exploit the game system or engage in unfair practices may lead to an immediate investigation and a potential ban.\n' +
      '4. **Direct Messages & Notifications**: The bot may send direct messages regarding major game events, seasonal rewards, vote reminders, and security notices. You can toggle or opt out of event notifications anytime using `kas event` or `kas notify`.'
    })
    .setFooter({
      text: 'By clicking "Accept", you agree to our Terms and Conditions and acknowledge the consequences for violating them.'
    });

    // Create the accept button
    const button = new ButtonBuilder()
    .setCustomId('accept_terms')
    .setLabel('✅ Accept Rules')
    .setStyle(ButtonStyle.Success);

    // Create the row with the button
    const row = new ActionRowBuilder().addComponents(button);

    // Send the embed with the button
    return await handleMessage(context, {
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Error in termsAndcondition:', error);
    return await handleMessage(context, {
      content:
        'This channel might be missing the following permissions that the bot needs:\n' +
        '1. **Send Messages**\n' +
        '2. **Embed Links**\n' +
        '3. **External stickers | emojis**\n' +
        '4. **Read Message History**\n' +
        '5. **Add reactions**\n' +
        '6. **Use Application Commands**\n' +
        '7. **Attach Files**\n' +
        'Please update the bot permissions and try again!'
    }).catch(() => null);
  }
};