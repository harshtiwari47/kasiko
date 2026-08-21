import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { formatMs, normalizeCooldownMs } from "../helper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const txtcommands = new Map();

const loadCommands = async (directory) => {
  const categories = await fs.promises.readdir(directory);

  for (const category of categories) {
    const categoryPath = path.join(directory, category);
    try {
      const stat = await fs.promises.stat(categoryPath);
      if (!stat.isDirectory()) continue;

      const commandFiles = await fs.promises.readdir(categoryPath);

      for (const file of commandFiles) {
        if (!file.endsWith(".js")) continue;

        try {
          const commandPath = path.join(categoryPath, file);
          const commandUrl = pathToFileURL(commandPath).href;
          const command = await import(commandUrl);

          if (!command.default?.name) continue;

          const normalized = normalizeCooldownMs(command.default);
          if (normalized !== command.default.cooldown) {
            console.warn(
              `Command "${command.default.name}": cooldown adjusted from ${command.default.cooldown} to ${normalized} ms.`
            );
          }

          command.default.cooldown = normalized;
          txtcommands.set(command.default.name.toLowerCase(), command.default);

          if (command.default.aliases) {
            for (const alias of command.default.aliases) {
              txtcommands.set(alias.toLowerCase(), command.default);
            }
          }
        } catch (fileErr) {
          console.error(`Error loading command file ${file} in ${category}:`, fileErr);
        }
      }
    } catch (catErr) {
      console.error(`Error scanning category ${category}:`, catErr);
    }
  }
};

const initializeCommands = async () => {
  const commandsDir = path.join(__dirname, "txtcommands");
  try {
    await loadCommands(commandsDir);
    console.log(`Text commands loaded successfully (${txtcommands.size} commands/aliases registered).`);
  } catch (err) {
    console.error(
      `Error loading commands from ${commandsDir}:`,
      err.message
    );
  }
};

initializeCommands();

export default txtcommands;
