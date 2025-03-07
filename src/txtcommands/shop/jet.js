import {
  EmbedBuilder
} from 'discord.js';
import {
  checkPassValidity
} from "../explore/pass.js";

export default {
  name: "jet",
  description: "Check out the private jet gifted by Kasiko!",
  aliases: ["privatejet",
    "kasikojet"],
  emoji: "✈️",
  cooldown: 10000,
  category: "🛍️ Shop",
  execute: async (args, message) => {
    try {
      // Get the user's ID and check if they have a valid pass.
      const userId = message.author.id;
      const Pass = await checkPassValidity(userId);

      if (Pass.isValid && Pass.passType === "celestia") {
        const embed = new EmbedBuilder()
        .setDescription(`Hey **${message.author.username}**, you're exceptional! 💫 Enjoy your Celestia Pass – a private jet ride from Kasiko!`)
        .setImage(`https://harshtiwari47.github.io/kasiko-public/images/private-jet.jpg`);

        await message.channel.send({
          embeds: [embed]
        });
      } else {
        await message.channel.send("This exclusive private jet is only available with a Celestia Pass!");
      }
      return;
    } catch (e) {
      console.error(e);
      return;
    }
  },
};