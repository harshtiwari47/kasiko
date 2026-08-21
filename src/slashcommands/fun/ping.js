import {
  SlashCommandBuilder
} from '@discordjs/builders';
import { handleMessage } from '../../../helper.js';

export default {
  data: new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong and shows latency!'),
  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp;
    return await handleMessage(interaction, `Pong! Latency: **${latency}ms**.`);
  },
};