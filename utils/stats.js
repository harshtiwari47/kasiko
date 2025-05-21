import { EmbedBuilder } from 'discord.js';

/**
 * Call this inside both your messageCreate and interactionCreate handlers,
 * *before* you execute the command.
 */
export default async function trackStats(context, redisClient, commandName) {
  const userId   = context?.author?.id || context?.user?.id;
  const guildId  = context?.guild?.id  || context?.guildId  || 'DM';
  const guildName  = context?.guild?.name  || context?.guildName  || 'Unknow Guild';
  const cmdName  = commandName               || context?.commandName;

  // 1️⃣ Unique users
  await redisClient.sAdd('bot:users', userId);
  await redisClient.expire('bot:users', 6 * 24 * 3600);

  // 2️⃣ Per-user all-time usage
  await redisClient.hIncrBy('bot:userUsage', userId, 1);
  await redisClient.expire('bot:userUsage', 6 * 24 * 3600);

  // 3️⃣ Per-guild monthly usage
  const monthKey = `bot:guildUsage:${new Date().toISOString().slice(0,7)}`;
  await redisClient.hIncrBy(monthKey, `${guildId}-${guildName}`, 1);
  await redisClient.expire(monthKey, 6 * 24 * 3600);

  // 4️⃣ Per-guild all-time usage
  await redisClient.hIncrBy('bot:guildUsageAll', guildId, 1);
  await redisClient.expire('bot:guildUsageAll', 6 * 24 * 3600);

  // 5️⃣ Per-command all-time usage
  await redisClient.hIncrBy('bot:commandUsage', cmdName, 1);
  await redisClient.expire('bot:commandUsage', 6 * 24 * 3600);
}


/**
 * Call this from your command handler to send an embed
 * showing top users, servers, and commands.
 */
export async function sendBotStats(message, redisClient) {
  const now      = new Date();
  const monthKey = `bot:guildUsage:${now.toISOString().slice(0,7)}`;

  // Fetch everything in parallel
  const [
    totalUsers,
    userUsageHash,
    guildMonthlyHash,
    guildAllHash,
    commandUsageHash
  ] = await Promise.all([
    redisClient.sCard('bot:users'),
    redisClient.hGetAll('bot:userUsage'),
    redisClient.hGetAll(monthKey),
    redisClient.hGetAll('bot:guildUsageAll'),
    redisClient.hGetAll('bot:commandUsage')
  ]);

  // Helper: get top N from a { key: countStr } object
  function topN(hash, N = 5) {
    return Object.entries(hash)
      .map(([k, v]) => [k, Number(v)])
      .sort((a,b) => b[1] - a[1])
      .slice(0, N);
  }

  const topUsers    = topN(userUsageHash,    5);
  const topServers  = topN(guildAllHash,     5);
  const topCommands = topN(commandUsageHash, 5);

  // Format lines
  const userLines   = topUsers
    .map(([id, c], i) => `\`#${i+1}\` ${id} — ${c}`)
    .join('\n') || 'No data';
  const serverLines = topServers
    .map(([id, c], i) => `\`#${i+1}\` ${id} — ${c}`)
    .join('\n') || 'No data';
  const commandLines= topCommands
    .map(([cmd, c], i) => `\`#${i+1}\` **${cmd}** — ${c}`)
    .join('\n') || 'No data';

  // Monthly commands total
  const monthTotal = Object.values(guildMonthlyHash)
    .map(Number).reduce((a,b) => a+b, 0);

  const embed = new EmbedBuilder()
    .setTitle('📊 Bot Usage Overview')
    .setColor(0x00bfff)
    .addFields(
      { name: 'Total Unique Users',           value: `${totalUsers}`, inline: true },
      { name: 'Commands This Month',          value: `${monthTotal}`, inline: true },
      { name: '\u200B',                       value: '\u200B',        inline: true },

      { name: 'Top 5 Users (All-Time)',        value: userLines,      inline: false },
      { name: 'Top 5 Servers (All-Time)',      value: serverLines,    inline: false },
      { name: 'Top 5 Commands (All-Time)',     value: commandLines,   inline: false },
    )
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

export async function sendTopServersEmbed(client, destination, topN = 5) {
  // 1. Pull all guilds, sort by memberCount desc
  const sorted = client.guilds.cache
    .sort((a, b) => b.memberCount - a.memberCount)
    .first(topN);

  // 2. Build a description listing "#1 ServerName — 1234 members"
  const lines = sorted.map((guild, i) =>
    `\`#${i + 1}\` **${guild.name}** — ${guild.memberCount.toLocaleString()} members`
  ).join('\n') || 'No servers found';

  // 3. Create and send embed
  const embed = new EmbedBuilder()
    .setTitle(`🌐 Top ${topN} Servers by Member Count`)
    .setColor(0x0099ff)
    .setDescription(lines)
    .setFooter({ text: `As of ${new Date().toLocaleDateString()}` });

  // If `destination` is a Message, reply; otherwise assume it's a TextChannel
  if (typeof destination.reply === 'function') {
    return destination.reply({ embeds: [embed] });
  } else {
    return destination.send({ embeds: [embed] });
  }
}