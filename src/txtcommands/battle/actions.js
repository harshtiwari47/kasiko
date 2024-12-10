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
    .setLabel('Attack')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled),
    new ButtonBuilder()
    .setCustomId('defend')
    .setLabel('Defend')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled),
    new ButtonBuilder()
    .setCustomId('special')
    .setLabel('Special')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled ? disabled: disableSpecial),
  );
}