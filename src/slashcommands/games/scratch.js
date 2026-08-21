import {
  SlashCommandBuilder
} from '@discordjs/builders';
import useCommand from '../../txtcommands/shop/use.js';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('scratch')
    .setDescription('Scratch a lottery card from your inventory to win cash prizes!'),

  async execute(interaction) {
    if (useCommand?.execute) {
      return await useCommand.execute(['use', 'scratch'], interaction);
    }
    return handleMessage(interaction, {
      content: 'Scratch card command is currently unavailable.',
      ephemeral: true
    });
  }
};
