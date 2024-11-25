import {
  SlashCommandBuilder
} from '@discordjs/builders';

export default {
  data: new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong and shows latency!'),
  async execute(interaction) {
    try {
      // Defer reply to avoid timeout
      await interaction.deferReply();

      // Simulate latency calculation
      const sent = await interaction.fetchReply();
      const latency = sent.createdTimestamp - interaction.createdTimestamp;

      // Edit reply with latency
      return await interaction.editReply(`Pong! Latency: **${latency}ms**.`);
    } catch (error) {
      console.error('Error executing ping command:', error);
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply('An error occurred while processing your request.');
      } else {
        return await interaction.reply('An error occurred while processing your request.');
      }
    }
  },
};