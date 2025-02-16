import User from '../../../models/Hunt.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage
    return context.channel.send(data);
  }
}

export async function feedCommand(context, {
  animalIndex = 0
}) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;
    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `***${username}***, you You have no profile yet. Go hunt first!`
      });
    }

    if (!user.hunt.animals.length) {
      return handleMessage(context, {
        content: `***${username}***, you have no animals to feed!`
      });
    }

    // If user has "food" in an inventory, check that:
    // (We’ll assume user has unlimited “Basic Food” for the example.)

    // Validate animalIndex
    if (animalIndex < 0 || animalIndex >= user.hunt.animals.length) {
      return handleMessage(context, {
        content: `Invalid animal index!`
      });
    }

    const animal = user.hunt.animals[animalIndex];

    // Let's say each feed gives 15 EXP
    const expGain = 15;
    animal.exp += expGain;

    // level up check
    const requiredExp = animal.level * 25; // scale as you like
    if (animal.exp >= requiredExp) {
      animal.level += 1;
      animal.hp += 10; // maybe raise HP each level
      animal.attack += 2;
      animal.exp -= requiredExp; // leftover exp
    }

    await user.save();

    return handleMessage(context, {
      content: [
        `You fed your **${animal.emoji} ${animal.name}**!`,
        `**+${expGain}** EXP &rarr; Now **Lvl.${animal.level}** (EXP: ${animal.exp}/${requiredExp}).`
      ].join('\n')
    });
  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}