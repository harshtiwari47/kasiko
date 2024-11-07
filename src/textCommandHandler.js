import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get the directory of the current file

const txtcommands = new Map();

const loadCommands = async (directory) => {
  const categories = await fs.promises.readdir(directory);

  for (const category of categories) {
    const categoryPath = path.join(directory, category);
    const commandFiles = await fs.promises.readdir(categoryPath);

    for (const file of commandFiles) {
      if (file.endsWith('.js')) {
        const command = await import(`./txtcommands/${category}/${file}`);
        if (command.default && command.default.name) {
          txtcommands.set(command.default.name, command.default);

          // Add aliases if they exist
          if (command.default.aliases) {
            for (const alias of command.default.aliases) {
              txtcommands.set(alias, command.default);
            }
          }
        }
      }
    }
  }
};

const initializeCommands = async () => {
  await loadCommands(path.join(__dirname, 'txtcommands'));
};

initializeCommands(); // Call the async function to load commands

export default txtcommands;