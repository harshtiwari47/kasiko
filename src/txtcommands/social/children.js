import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Message,
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';
import {
  client
} from "../../../bot.js";

import {
  getAllJewelry
} from '../shop/shopDataHelper.js';

// Default emojis if no custom emojis are set for the family.
const DEFAULT_BOY_EMOJI = '<:boy_child:1335131474055139430>';
const DEFAULT_GIRL_EMOJI = '<:girl_child:1335131494070489118>';
const COIN_EMOJI = '<:kasiko_coin:1300141236841086977>';

/**
* Returns the emoji to represent the child’s gender.
* If the family has defined custom emojis (via the family.customChildEmojis object),
* those will be used; otherwise the default emoji is returned.
*
* @param {string} gender - 'B' or 'G'
* @param {object} [customEmojis={}] - Optional custom emoji config, e.g. { B: '🍼👦', G: '🍼👧' }
* @returns {string} The emoji string.
*/
function getChildEmoji(gender, customEmojis = {}) {
  if (customEmojis[gender]) return customEmojis[gender];
  return gender === 'B' ? DEFAULT_BOY_EMOJI: DEFAULT_GIRL_EMOJI;
}

// ──────────────────────────────────────────────────────────────────────────────
// ── Child Feature 1: Automatically Add Children Based on bondXP
//     - First child when bondXP &ge; 5000
//     - Second child when bondXP &ge; 15000 (of opposite gender to the first)
// ──────────────────────────────────────────────────────────────────────────────
export async function checkForNewChildren(userId) {
  const userData = await getUserData(userId);
  if (!userData?.family?.spouse) return; // Only proceed if married

  const allJewelryItems = getAllJewelry();
  let item;

  if (userData.family.ring) {
    item = allJewelryItems.find(i => i.id === userData.family.ring);
  }

  const bondXP = (userData.family?.bondXP || 0) + (item?.price ? item.price / 100: 0);

  let children = userData.family.children || [];

  // If the children are stored in the old comma‐separated string format, convert them:
  if (children.length > 0 && typeof children[0] === 'string') {
    children = children.map(childStr => {
      const parts = childStr.split(',');
      return {
        gender: parts[0]?.trim() || 'B',
        xp: Number(parts[1]) || 0,
        name: parts[2]?.trim() || 'Unnamed'
      };
    });
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  // Add the first child if none exists and bondXP is high enough.
  if (children.length < 1 && bondXP >= 5000) {
    const randomGender = Math.random() < 0.5 ? 'B': 'G';
    const newChild = {
      gender: randomGender,
      xp: 0,
      name: 'Baby'
    };
    children.push(newChild);

    // Update both parents’ data.
    userData.family.children = children;
    spouseData.family.children = children;

    await updateUser(userId, userData);
    await updateUser(spouseId, spouseData);
  }

  // Add the second child (of the opposite gender) if bondXP is high enough.
  if (children.length === 1 && bondXP >= 15000) {
    const firstChild = children[0];
    const secondGender = firstChild.gender === 'B' ? 'G': 'B';
    const newChild = {
      gender: secondGender,
      xp: 0,
      name: 'Baby'
    };
    children.push(newChild);

    userData.family.children = children;
    spouseData.family.children = children;

    await updateUser(userId, userData);
    await updateUser(spouseId, spouseData);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ── Child Feature 2: Interactions (feed, pat, talk, play, rename)
// ──────────────────────────────────────────────────────────────────────────────

const feedMessages = [
  "You spoon-feed them lovingly. They gobble it up happily!",
  "You prepare a delicious meal for them. They seem delighted!",
  "You give them a bottle. They hold it with tiny hands, so cute!"
];

const patMessages = [
  "They giggle as you pat their head gently.",
  "They reach up, grabbing your hand as you pat them.",
  "They close their eyes, enjoying the gentle pats."
];

const talkMessages = [
  "They coo softly in response!",
  "They babble back and forth with you in baby-speak.",
  "They giggle and try to mimic your words.",
  "They smile widely, clearly happy to hear your voice."
];

const playMessages = [
  "You play peekaboo, and they burst into giggles!",
  "You tickle them, and they squeal with laughter!",
  "You roll a ball back and forth — they excitedly bounce it back!",
  "You wave a toy in front of them, and they excitedly grab for it!"
];

/**
* Feed a child.
* Each feeding session gives the child a random XP bonus (between 2 and 5 per time).
*/
async function feedChild(message, childIndex, times = 1) {
  const userData = await getUserData(message.author.id);
  let children = userData.family?.children || [];

  if (childIndex < 1 || childIndex > children.length) {
    return message.channel.send(
      `**Child ${childIndex}** does not exist. You only have **${children.length}** child(ren).`
    );
  }
  if (!userData.family?.spouse) {
    return message.channel.send(`You have no spouse. Please get married first!`);
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let totalXpGain = 0;
  for (let i = 0; i < times; i++) {
    totalXpGain += Math.floor(Math.random() * 4) + 2; // 2 to 5 XP per feeding
  }

  let childObj = children[childIndex - 1];
  childObj.xp += totalXpGain;

  // Save updated children in both parents’ data.
  userData.family.children = children;
  spouseData.family.children = children;

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  const randomMsg = feedMessages[Math.floor(Math.random() * feedMessages.length)];

  return message.channel.send(
    `🥣 **You feed Child #${childIndex} (${childObj.name})** ${times} time(s).\n` +
    `\n- ${randomMsg}\n**They gained +${totalXpGain} XP**!`
  );
}

async function patChild(message, childIndex) {
  const userData = await getUserData(message.author.id);
  let children = userData.family?.children || [];

  if (childIndex < 1 || childIndex > children.length) {
    return message.channel.send(`**Child ${childIndex}** does not exist.`);
  }
  if (!userData.family?.spouse) {
    return message.channel.send(`You have no spouse. Please get married first!`);
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let childObj = children[childIndex - 1];
  childObj.xp += 2; // pat gives 2 XP

  userData.family.children = children;
  spouseData.family.children = children;

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  const randomMsg = patMessages[Math.floor(Math.random() * patMessages.length)];

  return message.channel.send(
    `🥰 **You pat Child #${childIndex} (${childObj.name})**\n- ${randomMsg}\n**(+2 XP)**`
  );
}

async function talkChild(message, childIndex) {
  const userData = await getUserData(message.author.id);
  let children = userData.family?.children || [];

  if (childIndex < 1 || childIndex > children.length) {
    return message.channel.send(`**Child ${childIndex}** does not exist.`);
  }
  if (!userData.family?.spouse) {
    return message.channel.send(`You have no spouse. Please get married first!`);
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let childObj = children[childIndex - 1];
  childObj.xp += 3; // talking gives 3 XP

  userData.family.children = children;
  spouseData.family.children = children;

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  const randomMsg = talkMessages[Math.floor(Math.random() * talkMessages.length)];

  return message.channel.send(
    `🗣️ **You talk to Child #${childIndex} (${childObj.name})**\n- ${randomMsg}\n**(+3 XP)**`
  );
}

async function playChild(message, childIndex) {
  const userData = await getUserData(message.author.id);
  let children = userData.family?.children || [];

  if (childIndex < 1 || childIndex > children.length) {
    return message.channel.send(`**Child ${childIndex}** does not exist.`);
  }
  if (!userData.family?.spouse) {
    return message.channel.send(`You have no spouse. Please get married first!`);
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let childObj = children[childIndex - 1];
  childObj.xp += 5; // playing gives 5 XP

  userData.family.children = children;
  spouseData.family.children = children;

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  const randomMsg = playMessages[Math.floor(Math.random() * playMessages.length)];

  return message.channel.send(
    `☺️ **You play with Child #${childIndex} (${childObj.name})**\n- ${randomMsg}\n**They gain +5 XP**!`
  );
}

/**
* Rename a child.
* Usage: children rename <childIndex> <newName>
*/
async function renameChild(message, childIndex, newName) {
  const userData = await getUserData(message.author.id);
  let children = userData.family?.children || [];

  if (childIndex < 1 || childIndex > children.length) {
    return message.channel.send(`**Child ${childIndex}** does not exist.`);
  }
  if (!userData.family?.spouse) {
    return message.channel.send(`You have no spouse. Please get married first!`);
  }
  if (!newName) {
    return message.channel.send("Please provide a new name for the child.");
  }

  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let childObj = children[childIndex - 1];
  const oldName = childObj.name;
  childObj.name = newName;

  userData.family.children = children;
  spouseData.family.children = children;

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  return message.channel.send(
    `Child #${childIndex} has been renamed from **${oldName}** to **${newName}**!`
  );
}

async function claimBondXP(message) {
  const userData = await getUserData(message.author.id);
  if (!userData.family || !userData.family.spouse) {
    return message.channel.send(`You are not married, so you cannot claim bond XP.`);
  }
  const spouseId = userData.family.spouse;
  const spouseData = await getUserData(spouseId);

  let children = userData.family.children || [];
  if (children.length === 0) {
    return message.channel.send("You have no children to claim bond XP from.");
  }

  let totalChildXP = 0;
  children.forEach(child => {
    totalChildXP += child.xp;
    child.xp = 0; // reset XP after claiming
  });

  if (totalChildXP === 0) {
    return message.channel.send("Your children haven't gained any XP to claim bond XP from yet.");
  }

  userData.family.bondXP = (userData.family.bondXP || 0) + totalChildXP;
  spouseData.family.bondXP = (spouseData.family.bondXP || 0) + totalChildXP;

  userData.family.children = children;
  spouseData.family.children = children;

  // Award bonus cash with 30% probability (only the claiming parent gets it)
  let bonusCash = 0;
  if (Math.random() < 0.3) {
    bonusCash = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    userData.cash = (userData.cash || 0) + bonusCash;
  }

  await updateUser(message.author.id, userData);
  await updateUser(spouseId, spouseData);

  let responseMessage = `🎉 You claimed **${totalChildXP}** bond XP from your children's efforts! Your family's bond XP is now **${userData.family.bondXP}**.`;
  if (bonusCash > 0) {
    responseMessage += `\n💰 You also got a bonus of **${bonusCash}** cash!`;
  }
  return message.channel.send(responseMessage);
}

async function showChildrenOfUser(context, userId, isSelf = true) {
  const userToShow = await getUserData(userId);
  const {
    name,
    username
  } = discordUser(context);

  let children = [];

  if (userToShow?.family?.children?.length) {
    children.push(...userToShow.family?.children)
  }

  if (userToShow?.family?.adopted?.length) {
    children.push(...userToShow?.family?.adopted)
  }

  // Convert older string format (if any) into object format.
  if (children.length > 0) {
    children = children.map(childStr => {
      if (typeof childStr === 'string') {
        const parts = childStr.split(',');
        return {
          gender: parts[0]?.trim() || 'B',
          xp: Number(parts[1]) || 0,
          name: parts[2]?.trim() || 'Unnamed',
          adopted: false,
          avatar: null,
          userId: null,
          date: null
        };
      }

      return childStr;
    });
  }

  if (children.length === 0) {
    if (isSelf) {
      return await handleMessage(context, `**${name}**, you have no children yet. Increase your bondXP above **5,000** or **\` adopt @user \`** to have your first child!`);
    } else {
      return await handleMessage(context, `That user currently has no children.`);
    }
  }

  // Retrieve the spouse’s username.
  let partner = await client.users.fetch(userToShow.family.spouse).catch(() => {});
  const partnerName = partner ? partner.username: "Not Married";

  // Use the family’s custom emojis (if set) or fall back to defaults.
  const customEmojis = userToShow.family.customChildEmojis || {};

  let description = `**${isSelf ? username: (context.guild.members.cache.get(userId)?.displayName || "User")}** & **${partnerName}**'s Children:\n`;

  const Container = new ContainerBuilder()
  .addTextDisplayComponents(
    txt => txt.setContent(`### <:family:1390546644918992906> Children Overview`)
  )
  .addTextDisplayComponents(
    txt => txt.setContent(`${description}`)
  )

  for (let index = 0; index < children.length; index++) {
    const childObj = children[index];

    if (childObj?.userId) {
      let userInfo = await client.users.fetch(childObj?.userId);
      Container.addSectionComponents(
        section => section
        .addTextDisplayComponents(
          txt => txt.setContent(`**Name:** ${userInfo.username}\n**Gender:** ${childObj.gender === 'B' ? 'Boy': childObj.gender === 'G' ? 'Girl': 'Other'}`),
          txt => txt.setContent(`**Xp:** ${childObj.xp || 0} ~ ᴀᴅᴏᴘᴛᴇᴅ`),
        )
        .setThumbnailAccessory(
          thumbnail => thumbnail
          .setDescription('User PFP')
          .setURL(userInfo.displayAvatarURL())
        )
      )
      .addSeparatorComponents(separate => separate)
    } else {
      const emoji = getChildEmoji(childObj.gender, customEmojis);
      Container.addTextDisplayComponents(
        txt => txt.setContent(`**Name:** ${emoji} ${childObj.name}\n**Gender:** ${childObj.gender === 'B' ? 'Boy': childObj.gender === 'G' ? 'Girl': 'Other'}`),
        txt => txt.setContent(`**Xp:** ${childObj.xp}\n**Index:** ${index + 1}`),
      )
      .addSeparatorComponents(separate => separate)
    }

  }

  return await handleMessage(context,
    {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });
}

async function parentRemoveChild(context, args) {
  const {
    id: parentId,
    username
  } = discordUser(context);
  const target = context.mentions.users.first();
  if (!target) return handleMessage(context, 'Please mention a valid child to remove.');

  const parentData = await getUserData(parentId);
  if (!parentData.family?.adopted?.some(c => c.userId === target.id)) {
    return handleMessage(context, `**${username}**, you have not adopted **${target.username}**.`);
  }

  // Remove child entry
  const updatedList = parentData.family.adopted.filter(c => c.userId !== target.id);
  await updateUser(parentId, {
    'family.adopted': updatedList
  });

  // If parent has spouse, update their list too
  if (parentData.family.spouse) {
    const spouseId = parentData.family.spouse;
    const spouseData = await getUserData(spouseId);
    const spouseList = spouseData.family?.adopted?.filter(c => c.userId !== target.id) || [];
    await updateUser(spouseId, {
      'family.adopted': spouseList
    });
  }

  // Remove parents field from the child
  await updateUser(target.id, {
    'family.parents': null
  });

  return handleMessage(context, `**${username}** removed **${target.username}** from your family.`);
}

export default {
  name: "children",
  aliases: ["child",
    "kids",
    "baby"],
  description: "Manage and interact with your children (if married).",
  example: ["children help"],
  emoji: "<:girl_child:1335131494070489118>",
  cooldown: 10000,
  category: "👤 User",
  async execute(args,
    message) {
    try {
      args.shift();
      // Always check if the family's bondXP qualifies for a new child:
      await checkForNewChildren(message.author.id);

      // If no subcommand is provided, show the user's own children.
      if (!args[0]) {
        return showChildrenOfUser(message, message.author.id, true);
      }

      const subCommand = args[0].toLowerCase();

      switch (subCommand) {
      case "stats": {
          // Usage: children stats OR children stats @user
          if (message.mentions.users.size > 0) {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
              return message.channel.send("Could not find that user.");
            }
            return showChildrenOfUser(message, targetUser.id, false);
          } else {
            return showChildrenOfUser(message, message.author.id, true);
          }
        }
      case "feed": {
          if (!args[1]) {
            return message.channel.send("Usage: `children feed <childIndex>`");
          }
          const index = Number(args[1]);
          const amount = 1;
          if (isNaN(index) || isNaN(amount) || amount <= 0) {
            return message.channel.send("Please provide valid numbers for `<childIndex>`.");
          }
          return feedChild(message, index, 1);
        }
      case "pat": {
          if (!args[1]) {
            return message.channel.send("Usage: `children pat <childIndex>`");
          }
          const index = Number(args[1]);
          if (isNaN(index)) {
            return message.channel.send("Please provide a valid child index.");
          }
          return patChild(message, index);
        }
      case "talk": {
          if (!args[1]) {
            return message.channel.send("Usage: `children talk <childIndex>`");
          }
          const index = Number(args[1]);
          if (isNaN(index)) {
            return message.channel.send("Please provide a valid child index.");
          }
          return talkChild(message, index);
        }
      case "play": {
          if (!args[1]) {
            return message.channel.send("Usage: `children play <childIndex>`");
          }
          const index = Number(args[1]);
          if (isNaN(index)) {
            return message.channel.send("Please provide a valid child index.");
          }
          return playChild(message, index);
        }
      case "rename": {
          if (!args[1]) {
            return message.channel.send("Usage: `children rename <childIndex> <newName>`");
          }
          const index = Number(args[1]);
          if (isNaN(index)) {
            return message.channel.send("Please provide a valid child index.\n**Example:** `child rename 1 Sam`");
          }
          const newName = args.slice(2).join(" ");
          return renameChild(message, index, newName);
        }
      case "claim": {
          return claimBondXP(message);
        }
      default:

        const embed = new EmbedBuilder()
        .setTitle("🧒🏻 Children Command")
        .setDescription("Try one of the following commands:")
        .addFields(
          {
            name: "🍭 **General**", value: "`children`\n`children stats @user`", inline: false
          },
          {
            name: "💗 **Care**", value: "`children feed <childIndex> <times>`\n`children pat <childIndex>`", inline: false
          },
          {
            name: "🗣️ **Interaction**", value: "`children talk <childIndex>`\n`children play <childIndex>`", inline: false
          },
          {
            name: "🔧 **Management**", value: "`children rename <childIndex> <newName>`\n`children claim`", inline: false
          }
        )

        return message.channel.send({
          embeds: [embed]
        });

        return message.channel.send({
          embeds: [embed]
        });
      }
    } catch (err) {
      console.error(err);
      return message.channel.send("<:warning:1366050875243757699> Something went wrong with the children command.");
    }
  }
};