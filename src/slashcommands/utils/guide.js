import { SlashCommandBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import txtcommands from '../../textCommandHandler.js';

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
      await interaction.respond(filtered.map(name => ({ name, value: name })));
    } catch (error) {
      console.error("Error in autocomplete:", error);
    }
  },

  async execute(interaction) {
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    const commandName = interaction.options.getString('command');

    if (txtcommands.get("guide")) {
      await txtcommands.get("guide").execute(commandName ? ["guide", commandName] : ["guide"], interaction);
    } else {
      await interaction.editReply("❌ Could not fetch the guide. Please try again.");
    }
  },
};