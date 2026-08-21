import {
  SlashCommandBuilder
} from '@discordjs/builders';

export default {
  data: new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong and shows latency!'),
  async execute(interaction) {
    if (!interaction.deferred) {
      await interaction.deferReply();
    }

    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    return await interaction.editReply(`Pong! Latency: **${latency}ms**.`);
  },
};