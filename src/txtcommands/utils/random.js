import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "random",
  description: "Generates random values. Numbers, coin flip, or choices!",
  aliases: ["rand", "number"],
  cooldown: 10000,
  category: "🔧 Utility",
  examples: [
    "random",
    "random 1t100",
    "random coin",
    "random John Ray Lily",
    "random 50t500",
    `random "word1 word2" "word3 word4"`
  ],

  // Use a regular function (not arrow) so that 'this' refers to the command object.
  execute: async function(args, message) {
    try {
      // Remove the command name from the arguments.
      args.shift();

      // Default case: if no args, generate a random number between 1 and 10.
      if (!args.length) {
        const randomNumber = Math.floor(Math.random() * 10) + 1;
        await message.reply(`🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐍𝐮𝐦𝐛𝐞𝐫 (1-10): **${randomNumber}**`);
        return;
      }

      // Check for quoted phrases in the full message (excluding the command).
      const withoutCommand = message.content.slice(message.content.indexOf(" ") + 1);
      const quotedMatches = withoutCommand.match(/"([^"]+)"/g);
      let choices = [];
      if (quotedMatches && quotedMatches.length) {
        // Remove the quotes from each matched phrase.
        choices = quotedMatches.map(str => str.replace(/"/g, ""));
      } else {
        choices = args;
      }

      // If the first argument is "coin", do a coin flip.
      if (args[0].toLowerCase() === "coin") {
        const coin = Math.random() < 0.5 ? "Heads" : "Tails";
        await message.reply(`🪙 𝐂𝐨𝐢𝐧 𝐅𝐥𝐢𝐩: **${coin}**`);
      }
      // If the first argument looks like a range (e.g., "1t100").
      else if (args[0].includes("t") && !isNaN(Number(args[0].replace("t", "")))) {
        const [min, max] = args[0].split("t").map(Number);
        if (!isNaN(min) && !isNaN(max) && min < max) {
          const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
          await message.reply(`🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐍𝐮𝐦𝐛𝐞𝐫 (${min}-${max}): **${randomNumber}**`);
        } else {
          await message.reply(`❌ Invalid range. Use format like \`1t100\` for numbers.`);
        }
      }
      // Otherwise, if one or more choices are provided.
      else if (choices.length >= 1) {
        // If there's only one choice, just output it.
        const randomChoice = choices.length === 1
          ? choices[0]
          : choices[Math.floor(Math.random() * choices.length)];
        await message.reply(`🤔 𝐈 𝐏𝐢𝐜𝐤: **${randomChoice}**`);
      } else {
        // Fallback in case none of the above conditions were met.
        await message.reply(`❌ Invalid input. Examples:\n${this.examples
          .map(example => `- \`${example}\``)
          .join("\n")}`);
      }
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  }
};