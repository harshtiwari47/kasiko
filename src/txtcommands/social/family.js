import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';
import {
  handleMessage,
  discordUser
} from '../../../helper.js';
import {
  client
} from '../../../bot.js';

async function removeSelfAdoption(context) {
  const {
    id: childId,
    username
  } = discordUser(context);
  const childData = await getUserData(childId);

  const parents = childData?.family?.parents;
  if (!parents || !parents.adopter) {
    return handleMessage(context, 'You do not have any adoptive parents to leave.');
  }

  // Remove child from adopter's list
  const adopterId = parents.adopter;
  const adopterData = await getUserData(adopterId);
  if (adopterData?.family?.adopted) {
    const updatedAdopted = adopterData.family.adopted.filter(c => c.userId !== childId);
    await updateUser(adopterId, {
      'family.adopted': updatedAdopted
    });
  }

  // If adopter has spouse, update them too
  if (adopterData?.family?.spouse) {
    const spouseId = adopterData.family.spouse;
    const spouseData = await getUserData(spouseId);
    if (spouseData?.family?.adopted) {
      const spouseAdopted = spouseData.family.adopted.filter(c => c.userId !== childId);
      await updateUser(spouseId, {
        'family.adopted': spouseAdopted
      });
    }
  }

  // Remove parents field from child
  await updateUser(childId, {
    'family.parents': null
  });

  return handleMessage(context, `**${username}**, you have successfully left your adoptive family.`);
}

export default {
  name: 'family',
  aliases: ['fam'],
  description: 'View your family status or leave your adoptive parents.',
  example: [
    'family',
    'family @user',
    'family left'
  ],
  cooldown: 5000,
  category: '💍 Social',
  async execute(args, message) {
    try {
      if (args[1]?.toLowerCase() === "left") {
        return await removeSelfAdoption(message);
      }

      const { id: authorId, name: authorName } = discordUser(message);
      let targetId = authorId;
      let isSelf = true;

      if (message.mentions?.users?.size > 0) {
        const mentioned = message.mentions.users.first();
        targetId = mentioned.id;
        isSelf = targetId === authorId;
      } else if (args[1] && /^\d+$/.test(args[1].replace(/[<@!>]/g, ''))) {
        targetId = args[1].replace(/[<@!>]/g, '');
        isSelf = targetId === authorId;
      }

      const userData = await getUserData(targetId);

      if (!userData || !userData.family) {
        return await handleMessage(message, `**${isSelf ? authorName : `They`}** have no family data.`);
      }

      // Fetch spouse username
      let spouseName = 'None';
      if (userData.family.spouse) {
        try {
          const user = await client.users.fetch(userData.family.spouse).catch(() => null);
          spouseName = user ? `<@${user.id}> (${user.username})` : `<@${userData.family.spouse}>`;
        } catch {
          spouseName = `<@${userData.family.spouse}>`;
        }
      }

      // Children lists
      const children = userData.family.children || [];
      const adopted = userData.family.adopted || [];
      const parentInfo = userData.family.parents || {};

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle(`<:family:1390546644918992906> Family Overview — ${isSelf ? authorName : `<@${targetId}>`}`)
        .addFields({ name: '💍 Spouse', value: spouseName, inline: false });

      // List Biological Children
      if (children.length > 0) {
        const childrenList = children.map(c => `• ${c.name} (${c.gender === 'B' ? 'Boy' : c.gender === 'G' ? 'Girl' : 'Child'}, XP: ${c.xp || 0})`).join('\n');
        embed.addFields({ name: `👶 Biological Children (${children.length})`, value: childrenList, inline: false });
      } else {
        embed.addFields({ name: '👶 Biological Children', value: 'None', inline: false });
      }

      // List Adopted Children
      if (adopted.length > 0) {
        const adoptedList = await Promise.all(
          adopted.map(async c => {
            let uName = c.userId;
            try {
              const u = await client.users.fetch(c.userId).catch(() => null);
              uName = u ? u.username : c.userId;
            } catch (e) {}
            return `• <@${c.userId}> (${uName}) [${c.gender === 'B' ? 'Boy' : c.gender === 'G' ? 'Girl' : 'Child'}]`;
          })
        );
        embed.addFields({ name: `🧒 Adopted Children (${adopted.length})`, value: adoptedList.join('\n'), inline: false });
      } else {
        embed.addFields({ name: '🧒 Adopted Children', value: 'None', inline: false });
      }

      // Parent/Adopter info
      const parentParts = [];
      if (parentInfo.adopter && typeof parentInfo.adopter === "string") {
        try {
          const user = await client.users.fetch(parentInfo.adopter).catch(() => null);
          parentParts.push(`Adopted By: <@${parentInfo.adopter}> (${user?.username || 'Unknown'})`);
        } catch {
          parentParts.push(`Adopted By: <@${parentInfo.adopter}>`);
        }
      }

      if (parentInfo.spouse && typeof parentInfo.spouse === "string") {
        try {
          const user = await client.users.fetch(parentInfo.spouse).catch(() => null);
          parentParts.push(`Co-Parent: <@${parentInfo.spouse}> (${user?.username || 'Unknown'})`);
        } catch {
          parentParts.push(`Co-Parent: <@${parentInfo.spouse}>`);
        }
      }

      embed.addFields({ name: '👪 Parents', value: parentParts.length ? parentParts.join(' | ') : 'None', inline: false });
      embed.setFooter({ text: "Use /social status or /social roses to manage relationships" });

      return await handleMessage(message, {
        embeds: [embed]
      });
    } catch (err) {
      console.error('[Family] Error:', err);
      return await handleMessage(message, '<:warning:1366050875243757699> Something went wrong fetching family info.');
    }
  }
};
