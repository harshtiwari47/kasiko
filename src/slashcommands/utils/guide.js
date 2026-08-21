import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import guideCommand from '../../txtcommands/utils/guide.js';
import { handleMessage } from '../../../helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const guideFolderPath = path.join(__dirname, "../../help");

export default {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Get detailed guides on how to use commands.')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Specify a command to get its guide')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    try {
      // Fetch all available guide filenames (command names)
      const commandFiles = fs.readdirSync(guideFolderPath).filter(file => file.endsWith('.js'));
      const commandNames = commandFiles.map(file => file.replace('.js', ''));

      // Filter suggestions based on user input
      const filtered = commandNames.filter(name => name.startsWith(focusedValue)).slice(0, 25);

      // Send autocomplete suggestions
      await interaction.respond(filtered.map(name => ({ name, value: name }))).catch(() => {});
    } catch (error) {
      console.error("Error in autocomplete:", error);
    }
  },

  async execute(interaction) {
    const commandName = interaction.options.getString('command');

    if (guideCommand?.execute) {
      return await guideCommand.execute(commandName ? ["guide", commandName] : ["guide"], interaction);
    } else {
      return await handleMessage(interaction, "❌ Could not fetch the guide. Please try again.");
    }
  },
};