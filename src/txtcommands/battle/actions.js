import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

/**
* Generates action buttons for the battle.
* @param {boolean} disabled - Whether the buttons should be disabled.
* @param {boolean} disableSpecial - Whether the special buttons should be disabled.
* @returns {ActionRowBuilder} - The action row containing the buttons.
*/
export function getActionButtons(disabled = false, disableSpecial = false) {
  return new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId('attack')
    .setLabel('💥 𝘼𝙏𝙏𝘼𝘾𝙆')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled),
    new ButtonBuilder()
    .setCustomId('defend')
    .setLabel('🛡️ 𝘿𝙀𝙁𝙀𝙉𝘿')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled),
    new ButtonBuilder()
    .setCustomId('special')
    .setLabel('🪝 𝙎𝙋𝙀𝘾𝙄𝘼𝙇')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled ? disabled: disableSpecial),
  );
}