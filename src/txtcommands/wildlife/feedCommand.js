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

    // Find food item (check for premium_food first, then food)
    let foodItem = findItemByIdOrAlias(foodType);
    if (!foodItem || (foodItem.id !== 'food' && foodItem.id !== 'premium_food')) {
      // Try to find any available food
      const hasFood = (userData.inventory?.food || 0) > 0;
      const hasPremiumFood = (userData.inventory?.premium_food || 0) > 0;
      
      if (hasPremiumFood) {
        foodItem = ITEM_DEFINITIONS.premium_food;
      } else if (hasFood) {
        foodItem = ITEM_DEFINITIONS.food;
      } else {
        return handleMessage(context, {
          content: `***${username}***, you don't have any food! Buy some from the shop or get it from tasks/battles.\n-# Use: \`shop buy food\` to purchase animal food.`
        });
      }
    }

    // Check if user has the food item
    const foodCount = userData.inventory?.[foodItem.id] || 0;
    if (foodCount < 1) {
      const hasOtherFood = foodItem.id === 'premium_food' 
        ? (userData.inventory?.food || 0) > 0
        : (userData.inventory?.premium_food || 0) > 0;
      
      if (hasOtherFood) {
        const otherFoodId = foodItem.id === 'premium_food' ? 'food' : 'premium_food';
        foodItem = ITEM_DEFINITIONS[otherFoodId];
      } else {
        return handleMessage(context, {
          content: `***${username}***, you don't have any ${foodItem.name.toLowerCase()}! Buy some from the shop.\n-# Use: \`shop buy food\` to purchase animal food.`
        });
      }
    }

    const animal = user.hunt.animals[animalIndex];

    // Determine EXP gain based on food type
    const expGain = foodItem.id === 'premium_food' ? 30 : 15;
    animal.exp += expGain;

    // Level up check
    const requiredExp = animal.level * 25;
    let leveledUp = false;
    if (animal.exp >= requiredExp) {
      leveledUp = true;
      animal.level += 1;
      animal.hp += 10; // Raise HP each level
      animal.attack += 2;
      animal.exp -= requiredExp; // Leftover exp
    }

    // Consume food item
    const newFoodCount = Math.max((userData.inventory?.[foodItem.id] || 0) - 1, 0);
    await updateUser(userId, {
      [`inventory.${foodItem.id}`]: newFoodCount
    });

    await user.save();

    // Build response message
    const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### ${foodItem.emoji} **FEED SUCCESSFUL**`),
        textDisplay => textDisplay.setContent(`You fed your **${animal.emoji} ${animal.name}** with ${foodItem.emoji} **${foodItem.name}**!`),
        textDisplay => textDisplay.setContent(`**+${expGain}** EXP → Now **Lvl.${animal.level}** (EXP: ${animal.exp}/${requiredExp})`)
      );

    if (leveledUp) {
      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`🎉 **LEVEL UP!** Your ${animal.name} reached level ${animal.level}!`)
      );
    }

    Container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`-# Remaining ${foodItem.name.toLowerCase()}: ${newFoodCount}`)
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
