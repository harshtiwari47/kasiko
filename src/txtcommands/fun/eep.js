export default {
  name: "eep",
  description: "Makes a cute 'eep!' noise when startled.",
  aliases: ["eepie",
    "scared"],
  cooldown: 10000,
  category: "🧩 Fun",
  execute: async (args, message) => {
    try {
      const eepMessages = [
        "Eep! 🐾 Oh no, you startled me!",
        "Eeep! *hides behind a cushion* 🥺",
        "Eep! Don’t scare me like that! 😖",
        "Eep! Oh, it’s just you... hello! 💕",
        "Eep! I wasn’t expecting that! 😳",
        "Eep! Quick, hide! 🫣",
        "Eep! You spooked me! 👀",
        "Eep! I think I saw something move... 👻",
        "Eep! Not ready for surprises! 😵",
        "Eep! You scared the fluff out of me! 🐾",
        "Eep! *jumps into your arms* 😖",
        "Eep! Is it safe to come out? 🫣",
        "Eep! Please be gentle! 🥺",
        "Eep! That was unexpected! 😵",
        "Eep! My tiny heart can’t take this! 💓",
        "Eep! Let’s pretend that didn’t happen... 😬",
        "Eep! That was way too close! 😨",
        "Eep! *tiny panicked noises* 😱",
        "Eep! No sudden movements! 🚫",
        "Eep! I need a moment to recover! 🥴",
        "Eep! Can we rewind time real quick? ⏪",
        "Eep! That was not part of the plan! 🤯",
        "Eep! Why must life be so unpredictable?! 😖",
        "Eep! I think I need a hug... 🤗",
        "Eep! I wasn’t mentally prepared for this! 😵‍💫",
        "Eep! I might need a nap after that! 😴",
        "Eep! Was that a ghost or just my imagination? 👻",
        "Eep! Okay, I’m calm now… maybe. 😶",
        "Eep! Who gave you permission to sneak up on me?! 😤",
        "Eep! You’re lucky you’re cute! 😚"
      ];

      const randomEep = eepMessages[Math.floor(Math.random() * eepMessages.length)];
      await message.reply(randomEep)
      return;
    } catch (e) {
      console.error(e);
    }
  },
};