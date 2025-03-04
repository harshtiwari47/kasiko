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
      'Welcome to **Kasiko**! Before proceeding, please ***carefully read and accept our Terms and Conditions***.\n\n' +
      '**[Click here to read the full Terms and Conditions](https://kasiko.vercel.app/terms.html)**\n\n' +
      '**Important:** Violating the terms may result in severe consequences including _temporary or permanent bans_ from the bot.'
    )
    .addFields({
      name: 'Rules and Regulations',
      value:
      '1. **No Spamming**: Spamming commands or messages will result in a warning or ban.\n' +
      '2. **In-Game Currency Only**: Do not engage in real money transactions for in-game goods or services. If we detect this activity, it may result in a permanent ban from the bot.\n' +
      '3. **Suspicious Activity**: Any attempt to exploit the game system or engage in unfair practices may lead to an immediate investigation and a potential ban.'
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
      try {
        if (interaction.customId === 'accept_terms') {
          await interaction.deferReply({
            ephemeral: true
          });
          let user = await createUser(message.author.id);
          if (user) {
            await interaction.editReply({
              content: "<:emoji_35:1332676884093337603> **Thank you** for accepting the __Terms and Conditions__! 💐\n\n" +
              "➡️ You can start with `kas help` to see all commands.\n\n" +
              "📌 **Usage:**  \n" +
              "- `kas help <cmd>` → Get details about a specific command.  \n" +
              "- `kas guide <cmd>` → View a guide (if available) for the command.\n\n" +
              "> -# Stack up wealth, outsmart the market, and rule the game economy! 🐦‍🔥",
              ephemeral: true
            });

            // Disable the button after interaction
            const updatedButton = ButtonBuilder.from(button).setDisabled(true);
            const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

            if (!sentMessage || !sentMessage?.edit) return;
            await sentMessage.edit({
              components: [updatedRow]
            });
            return;
          } else {
            await message.editReply({
              content: '⚠️ Something went wrong! Please contact the support or try again',
              ephemeral: true
            });
          }
          collector.stop();
        }
      } catch(e) {
        console.error(e)
      }
    });

    collector.on('end',
      async () => {
        try {
          // Disable the button when the collector times out
          const updatedButton = ButtonBuilder.from(button).setDisabled(true);
          const updatedRow = new ActionRowBuilder().addComponents(updatedButton);

          await sentMessage.edit({
            components: [updatedRow]
          });
          return;
        } catch (e) {}
      });

  } catch (error) {
    console.error('Error in termsAndcondition:',
      error);
    return message.channel.send(
      'This channel might be missing the following permissions that the bot needs:\n' +
      '1. **Send Messages**\n' +
      '2. **Embed Links**\n' +
      '3. **External stickers | emojis**\n' +
      '4. **Read Message History**\n' +
      '5. **Add reactions**\n' +
      '6. **Use Application Commands**\n' +
      '7. **Attach Files**\n' +
      'Please update the bot permissions and try again!'
    ).catch(err => ![50001,
        50013,
        10008].includes(err.code) && console.error(err));
  }
};