import { EmbedBuilder } from 'discord.js';

const WelcomeMsg = {
  name: 'guildCreate',
  execute(guild) {
    const welcomeChannel = guild.channels.cache.find(
      channel => 
        channel.type === 0 && 
        channel.permissionsFor(guild.members.me).has('SendMessages')
    );

    if (welcomeChannel) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Thank you for inviting me!')
        .setDescription(
          `Hello **${guild.name}**! I'm here to assist with games, utilities, and more.\n\n` +
          `To start using me, type \`kas help\` or use the \`/help\` command for guidance.`
        )
        .addFields(
          { 
            name: '**Important Links**', 
            value: 
              `[Terms and Conditions](https://your-link.com/terms) | ` +
              `[Help](https://your-link.com/help) | ` +
              `[Support](https://your-link.com/support)` 
          },
          { 
            name: '**Getting Started**', 
            value: 
              `- Start commands with \`kas\` (e.g., \`kas help\`).\n` +
              `- Use \`kas help <command>\` for details on specific commands.` 
          }
        )
        .setFooter({
          text: 'Welcome aboard! Let’s make this journey exciting.',
          iconURL: 'https://cdn.discordapp.com/app-assets/1300081477358452756/1303245073324048479.png',
        })
        .setTimestamp();

      welcomeChannel.send({ embeds: [embed] });
    }
  },
};

export default WelcomeMsg;