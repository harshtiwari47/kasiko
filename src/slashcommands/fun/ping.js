import { SlashCommandBuilder } from '@discordjs/builders';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and shows latency!'),
  async execute(interaction) {
    try {
      // Defer the reply to ensure response doesn't timeout
      await interaction.deferReply();

      // Calculate latency
      const sent = await interaction.fetchReply();
      const latency = sent.createdTimestamp - interaction.createdTimestamp;

      // Edit the deferred reply with the final response
      await interaction.editReply(`Pong! Latency: **${latency}ms**.`);
    } catch (error) {
      console.error('Error executing ping command:', error);
      // Send an error message if something goes wrong
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('An error occurred while processing your request.');
      } else {
        await interaction.reply('An error occurred while processing your request.');
      }
    }
  },
};