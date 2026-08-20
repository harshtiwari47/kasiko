import {
  SlashCommandBuilder
} from '@discordjs/builders';
import txtcommands from '../../textCommandHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('scratch')
    .setDescription('Scratch a lottery card from your inventory to win cash prizes!'),

  async execute(interaction) {
    const useCmd = txtcommands.get('use');
    if (useCmd?.execute) {
      return await useCmd.execute(['use', 'scratch'], interaction);
    }
    return interaction.reply({
      content: 'Scratch card command is currently unavailable.',
      ephemeral: true
    });
  }
};
