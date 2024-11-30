import redisClient from '../redis.js';

const cooldown = async (message, command, next) => {
  const userId = message.author.id;
  const globalCooldownKey = `cooldown:${command.name}:${userId}`;
  const cooldownDuration = 10; // Cooldown duration in seconds

  try {
    // Check if the user is on a global cooldown
    const ttl = await redisClient.ttl(globalCooldownKey);
    console.log(ttl);
    if (ttl > 0) {
      const coolDownMessage = await message.channel.send(
        `⏳ **${message.author.username}**, you are on a global cooldown! Please wait **\`${ttl} second(s)\`**.`
      );
      setTimeout(async () => {
        await coolDownMessage.delete();
      }, ttl * 1000);
      return;
    }

    // Set a cooldown for the user
    await redisClient.set(globalCooldownKey, '1', {
      EX: cooldownDuration
    });

    // Proceed with command execution
    return await next();
  } catch (error) {
    console.error('Error handling global cooldown:', error);
    message.reply('An error occurred while processing your request during cooldown.');
  }
};

export default cooldown;