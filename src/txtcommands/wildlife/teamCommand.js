import User from '../../../models/Hunt.js';

// simple message helper supporting interactions and messages
async function sendMessage(context, payload) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    try {
      if (!context.deferred) await context.deferReply().catch(() => {});
      return await context.editReply(payload);
    } catch (err) {
      console.error('teamCommand interaction send error', err);
      return null;
    }
  } else {
    try {
      return await context.channel.send(payload);
    } catch (err) {
      console.error('teamCommand channel send error', err);
      return null;
    }
  }
}

function capitalizeName(name) {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export async function teamCommand(context, { action = 'view', names = [] } = {}) {
  const userId = context.user?.id || context.author?.id;
  const username = context.user?.username || context.author?.username;

  let user = await User.findOne({ discordId: userId });
  if (!user) {
    user = new User({ discordId: userId, hunt: { animals: [], unlockedLocations: ['Forest'] } });
    await user.save();
  }

  action = (action || '').toString().toLowerCase();
  if (action === 'set') {
    if (!names || names.length === 0) {
      return sendMessage(context, { content: `⚠️ Usage: team set <animal1> [animal2] [animal3]` });
    }

    const requested = [];
    const added = new Set();
    for (const raw of names.slice(0, 3)) {
      const n = capitalizeName(raw.trim());
      if (!n || added.has(n.toLowerCase())) continue;
      const found = (user.hunt?.animals || []).find(a => (a.name || '').toLowerCase() === n.toLowerCase() && ((a.totalAnimals || 1) > 0));
      if (found) {
        requested.push({ name: found.name, level: found.level || 1 });
        added.add(n.toLowerCase());
      }
    }

    if (requested.length === 0) {
      return sendMessage(context, { content: `⚠️ Could not set team: none of the provided animals were found in your collection.` });
    }

    user.hunt.team = requested;
    await user.save();

    return sendMessage(context, { content: `✅ ${username}, your team has been set to:\n${requested.map(t => `- ${t.name} (Lv.${t.level})`).join('\n')}` });
  }

  if (action === 'clear') {
    user.hunt.team = [];
    await user.save();
    return sendMessage(context, { content: `✅ ${username}, your preferred battle team has been cleared. Battles will use a random team.` });
  }

  // default: view
  const team = user.hunt?.team || [];
  if (!team || team.length === 0) {
    return sendMessage(context, { content: `ℹ️ ${username}, you don't have a preferred team set. Use \`team set <animal1> <animal2> <animal3>\` to set one.` });
  }

  return sendMessage(context, { content: `🎯 ${username}'s Team:\n${team.map(t => `- ${t.name} (Lv.${t.level || 1})`).join('\n')}` });
}

export default {
  name: 'team',
  description: 'Manage your preferred battle team: set/view/clear',
  aliases: ['setteam', 'myteam'],
  args: '<set|view|clear> [animals]',
  example: ['team set Fox Wolf', 'team view', 'team clear'],
  category: '🦌 Wildlife',
  execute: async (args, context) => {
    args.shift();
    const action = args[0] ? args[0].toLowerCase() : 'view';
    if (action === 'set') {
      const names = args.slice(1);
      return teamCommand(context, { action: 'set', names });
    }
    if (action === 'clear') return teamCommand(context, { action: 'clear' });
    return teamCommand(context, { action: 'view' });
  }
};
