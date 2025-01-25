import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";

export default {
  name: "random",
  description: "Generates random values. Numbers, coin flip, or choices!",
  aliases: ["rand",
    "number"],
  cooldown: 10000,
  category: "🔧 Utility",
  example: [
    "/random",
    "/random 1t100",
    "/random coin",
    "/random John Ray Lily",
    "/random 50t500"
  ],

  execute: async (args, message) => {
    args.shift();
    if (!args.length) {
      // Default case: Random number between 1 and 10
      const randomNumber = Math.floor(Math.random() * 10) + 1;
      await message.reply(`🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐍𝐮𝐦𝐛𝐞𝐫 (1-10): **${randomNumber}**`);
      return;
    }

    const input = args.join(" ").toLowerCase();

    if (input === "coin") {
      // Coin flip: heads or tails
      const coin = Math.random() < 0.5 ? "Heads": "Tails";
      await message.reply(`🪙 𝐂𝐨𝐢𝐧 𝐅𝐥𝐢𝐩: **${coin}**`);
    } else if (input.includes("t")) {
      // Range-based random number (e.g., 1t100)
      const [min,
        max] = input.split("t").map(Number);
      if (!isNaN(min) && !isNaN(max) && min < max) {
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        await message.reply(`🎲 𝐑𝐚𝐧𝐝𝐨𝐦 𝐍𝐮𝐦𝐛𝐞𝐫 (${min}-${max}): **${randomNumber}**`);
      } else {
        await message.reply(`❌ Invalid range. Use format like \`1t100\` for numbers.`);
      }
    } else if (args.length > 1) {
      // Random pick from a list of choices
      const randomChoice = args[Math.floor(Math.random() * args.length)];
      await message.reply(`🤔 𝐈 𝐏𝐢𝐜𝐤: **${randomChoice}**`);
    } else {
      // Invalid input
      await message.reply(
        `❌ Invalid input. Examples:\n${this.examples
        .map((example) => `- \`${example}\``)
        .join("\n")}`
      );
    }
  },
};