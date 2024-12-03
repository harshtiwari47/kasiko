export default {
  name: "fliptable",
  description: "Flip or fix a table, depending on your mood `kas table <option>`.",
  aliases: ["rage",
    "table"],
  cooldown: 4000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    const actions = {
      flip: [
        "(╯°□°)╯︵ ┻━┻",
        "(ノಠ益ಠ)ノ彡┻━┻",
        "ヽ(ಠ_ಠ)ノ彡┻━┻",
        "(╯°△°)╯︵ ┻━┻",
      ],
      fix: [
        "┬─┬ ノ( ゜-゜ノ)",
        "(╯°□°）╯︵ ┻━┻ → ┻━┻",
        "┻━┻ ︵ ╯(°□°╯)",
        "︵ 乁( •_• )ㄏ",
      ],
    };

    // Decide if the user wants to flip or fix the table
    const action = args[1] && args[1].toLowerCase() === "fix" ? "fix": "flip";
    const randomAction = actions[action][Math.floor(Math.random() * actions[action].length)];

    await message.reply(randomAction);
  },
};