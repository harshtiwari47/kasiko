import {
  getUserData
} from '../../../database.js';
import {
  ContainerBuilder,
  MessageFlags
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

  const parents = childData.family?.parents;
  if (!parents || !parents.adopter) {
    return handleMessage(context, 'You do not have any adoption parents to leave.');
  }

  // Remove child from adopter's list
  const adopterId = parents.adopter;
  const adopterData = await getUserData(adopterId);
  const updatedAdopted = adopterData.family?.adopted?.filter(c => c.userId !== childId) || [];
  await updateUser(adopterId, {
    'family.adopted': updatedAdopted
  });

  // If adopter has spouse, update them too
  if (adopterData.family?.spouse) {
    const spouseId = adopterData.family.spouse;
    const spouseData = await getUserData(spouseId);
    const spouseAdopted = spouseData.family?.adopted?.filter(c => c.userId !== childId) || [];
    await updateUser(spouseId, {
      'family.adopted': spouseAdopted
    });
  }

  // Remove parents field from child
  await updateUser(childId, {
    'family.parents': null
  });

  return handleMessage(context, `**${username}**, you have successfully left your adoptive parent(s).`);
}

export default {
  name: 'family',
  aliases: ['fam'],
  description: 'View your family status or leave your adoptive parents if you have any.',
  example: ['family',
    'family @user',
    'family left'],
  cooldown: 5000,
  category: '👤 User',
  async execute(args, message) {
    try {
      if (args[1]?.toLowerCase() === "left") {
        await removeSelfAdoption(message);
        return;
      }

      // Determine target (self or mentioned user)
      let targetId = message.author.id;
      let isSelf = true;
      if (message.mentions.users.size > 0) {
        const mentioned = message.mentions.users.first();
        targetId = mentioned.id;
        isSelf = false;
      }

      const userData = await getUserData(targetId);
      const {
        name: authorName
      } = discordUser(message);

      // Basic checks
      if (!userData.family) {
        return await handleMessage(message, `**${isSelf ? authorName: `They`}** have no family data.`);
      }

      // Fetch spouse username or placeholder
      let spouseName = 'None';
      if (userData.family.spouse) {
        try {
          const user = await client.users.fetch(userData.family.spouse);
          spouseName = user.username;
        } catch {
          /* ignore */
        }
      }

      // Children list
      const children = userData.family.children || [];
      const adopted = userData.family.adopted || [];
      const parentInfo = userData.family.parents || {};

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        txt => txt.setContent(`### <:family:1390546644918992906> Family Overview`)
      )
      .addSeparatorComponents();

      Container.addTextDisplayComponents(
        txt => txt.setContent(`**Spouse:** ${spouseName}`)
      );

      // List Biological Children
      Container.addTextDisplayComponents(
        txt => txt.setContent(`**Children:** ${children.length}`),
        txt => txt.setContent(`${children.map((c, i) => `• ${c.name} (${c.gender === 'B' ? 'Boy': c.gender === 'O' ? 'Other': 'Girl'})`).join('\n') || 'None'}`)
      );

      // List Adopted
      const AdoptedUsernames = [];

      if (adopted.length) {
        for (let i = 0; i < adopted.length; i++) {
          const user = await client.users.fetch(adopted[i]?.userId);
          AdoptedUsernames.push(user?.username || "Unknown User");
        }
      }

      Container.addTextDisplayComponents(
        txt => txt.setContent(`**Adopted:** ${AdoptedUsernames.length}`),
        txt => txt.setContent(`${AdoptedUsernames.map((c, i) => `• ${c}`).join('\n') || 'None'}`)
      );

      // Parent/Adopter info
      const parentParts = [];
      if (parentInfo.adopter && typeof parentInfo.adopter === "string") {
        const user = await client.users.fetch(parentInfo.spouse);
        parentParts.push(`Adopted By: ${user.username || 'Unknown'}`);
      }

      if (parentInfo.spouse && typeof parentInfo.spouse === "string") {
        const user = await client.users.fetch(parentInfo.spouse)
        parentParts.push(`Adopter Spouse: ${user.username || 'Unknown'}`);
      }

      Container.addTextDisplayComponents(
        txt => txt.setContent(`**Parents:** ${
          parentParts.length ? parentParts.join(' | '): 'None'
          }`)
      );

      return await handleMessage(message, {
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (err) {
      console.error(err);
      return await handleMessage(message, '<:warning:1366050875243757699> Something went wrong fetching family info.');
    }
  }
};