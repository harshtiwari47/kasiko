import User from '../../../models/Hunt.js';
import { getUserData, updateUser } from '../../../database.js';
import { ITEM_DEFINITIONS, findItemByIdOrAlias } from '../../inventory.js';
import { ContainerBuilder, MessageFlags } from 'discord.js';

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
  animalIndex = 0,
  foodType = 'food' // Default to basic food
}) {
  try {
    const userId = context.user?.id || context.author?.id;
    const username = context.user?.username || context.author?.username;
    
    // Get user's main inventory data
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(context, {
        content: `***${username}***, could not retrieve your data.`
      });
    }

    // Get hunt data
    let user = await User.findOne({
      discordId: userId
    });
    if (!user) {
      return handleMessage(context, {
        content: `***${username}***, you have no profile yet. Go hunt first!`
      });
    }

    if (!user.hunt.animals.length) {
      return handleMessage(context, {
        content: `***${username}***, you have no animals to feed!`
      });
    }

    // Validate animalIndex
    if (animalIndex < 0 || animalIndex >= user.hunt.animals.length) {
      return handleMessage(context, {
        content: `Invalid animal index! Use a number between 1 and ${user.hunt.animals.length}.`
      });
    }

    // Check food from inventory (or UserPet model)
    const foodItem = ITEM_DEFINITIONS.food;
    let invFoodCount = userData.inventory?.food || 0;
    
    if (invFoodCount < 1) {
      return handleMessage(context, {
        content: `<:warning:1366050875243757699> ***${username}***, you don't have any <:pet_food:1385884583077351464> **Pet Food**!\n-# Collect food from \`kas daily\`, \`kas tasks\`, or buy from \`kas buy food\`.`
      });
    }

    const animal = user.hunt.animals[animalIndex];
    const expGain = 20;
    animal.exp += expGain;

    // Level up check (level * 30 XP curve)
    let leveledUp = false;
    let requiredExp = animal.level * 30;
    while (animal.exp >= (animal.level || 1) * 30) {
      leveledUp = true;
      const needed = (animal.level || 1) * 30;
      animal.level = (animal.level || 1) + 1;
      animal.exp -= needed;
      animal.hp = (animal.hp || 30) + 8;
      animal.attack = (animal.attack || 5) + 2;
    }
    requiredExp = (animal.level || 1) * 30;

    // Sync saved team member level if in team
    if (leveledUp && user.hunt?.team?.length > 0) {
      const teamIdx = user.hunt.team.findIndex(t => t.name?.toLowerCase() === animal.name?.toLowerCase());
      if (teamIdx !== -1) {
        user.hunt.team[teamIdx].level = animal.level;
      }
    }

    // Consume food item
    const newFoodCount = Math.max(invFoodCount - 1, 0);
    await updateUser(userId, {
      'inventory.food': newFoodCount
    });

    await user.save();

    // Build response message
    const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### <:pet_food:1385884583077351464> **FEED SUCCESSFUL**`),
        textDisplay => textDisplay.setContent(`You fed your **${animal.emoji || '🐾'} ${animal.name}** with <:pet_food:1385884583077351464> **Pet Food**!`),
        textDisplay => textDisplay.setContent(`**+${expGain}** EXP → Now **Lvl.${animal.level}** (EXP: ${animal.exp}/${requiredExp})`)
      );

    if (leveledUp) {
      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`🎉 **LEVEL UP!** Your ${animal.name} reached level ${animal.level}!`)
      );
    }

    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# Remaining Pet Food: <:pet_food:1385884583077351464> **${newFoodCount}**`)
    );

    return handleMessage(context, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });
  } catch (error) {
    console.error('Error in feedCommand:', error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}
