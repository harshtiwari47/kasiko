import {
  handleUsePower
} from '../../../utils/battleUtils.js';

/**
* Prefix command handler for 'use' command.
* Usage: !use <power>
* Example: !use p1
*/
export default {
  name: 'use',
  description: 'Use a dragon ability during the battle.',
  aliases: [],
  args: '<power>',
  usage: 'use <p1|p2>',
  category: '🐉 Skyraid',
  cooldown: 10000,
  // seconds

  execute: async (args, message, client) => {
    args.shift();

    if (!args[0]) {
      return message.channel.send('⚠️ Please specify a power to use. Usage: `!use <p1|p2>`');
    }

    const power = args[0].toLowerCase();

    if (!['p1', 'p2'].includes(power)) {
      return message.channel.send("⚠️ Invalid __power__ specified to attack **Skyraid's boss**.\n▶ Please choose either `p1` or `p2`.");
    }

    // Call the shared battle logic
    const result = await handleUsePower( {
      guildId: message.guild.id,
      channelId: message.channel.id,
      userId: message.author.id,
      power,
      client,
    });

    // If there's a reply content (e.g., error messages)
    if (result.replyContent) {
      return message.channel.send(result.replyContent);
    }

    // Send the ability used embed
    await message.channel.send({
      embeds: [result.embed]
    });
  },
};