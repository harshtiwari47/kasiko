import {
  SlashCommandBuilder
} from '@discordjs/builders';
import marriageCommand from '../../txtcommands/social/marriage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propose marriage to another player with a ring.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user you want to propose to')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (marriageCommand?.execute) {
      return await marriageCommand.execute(['marry', `<@${target.id}>`], interaction);
    }
    return interaction.reply({
      content: 'Marriage command is currently unavailable.',
      ephemeral: true
    });
  }
};
