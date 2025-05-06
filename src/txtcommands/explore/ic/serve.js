import {
  EmbedBuilder
} from 'discord.js';


function capitalizeFirstLetter(word) {
  if (!word) return ""; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function serveIceCream(playerShop, flavors, userId, username, context) {
  if (playerShop.loyaltyPoints < 20) {
    return await handleMessage(context, {
      content: `⚠️ **${username}**, your shop's ✪ loyalty points are below 20. You can earn more by using \`icecream daily\` or sharing ice cream with your friends!`
    });
  }

  if (playerShop.reputation < 0) {
    return await handleMessage(context, {
      content: `⚠️ **${username}**, your shop's reputation points are below 0. You can earn more by using \`icecream daily\` or sharing ice cream with your friends!`
    });
  }

  const getRandomFlavor = () => {
    let level = playerShop.shopLevel;
    let selectedFlavours = flavors.filter(flavor => flavor.level < level + 1 || flavor.level < level);
    return selectedFlavours[Math.floor(Math.random() * selectedFlavours.length)];
  };

  const customerNames = ["Amelia Frost",
    "Jonah Berry",
    "Chloe Caramel",
    "Max Sprinkle",
    "Sophia Sundae"];

  const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];

  const customerPreference = getRandomFlavor();
  const suspenseMessage = await await handleMessage(context, {
    content: `🍨 A customer named **${randomName}** is approaching... Let's see what they want!`
  });

  setTimeout(async () => {
    const servedSuccessfully = playerShop.flavors.some(
      FLAVOUR => customerPreference.name === FLAVOUR.name && FLAVOUR.items > 0
    );

    if (servedSuccessfully) {
      const flavorDetail = playerShop.flavors.find(FLAVOUR => customerPreference.name === FLAVOUR.name);
      flavorDetail.items -= 1;
    }

    // Determine customer satisfaction
    const customerDislikesIceCream = Math.random() < 0.2; // 20% chance of disliking
    if (servedSuccessfully && customerDislikesIceCream) {
      playerShop.reputation -= 1; // Customer disliked the ice cream
    } else {
      playerShop.customersServed += servedSuccessfully ? 1: 0;
      playerShop.money += servedSuccessfully ? Math.floor(1.3 * customerPreference.cost): 0;
      playerShop.loyaltyPoints += servedSuccessfully ? 10: 0;
      playerShop.reputation += servedSuccessfully ? (customerDislikesIceCream ? -1: 2): -1;
    }

    await playerShop.save();

    const embed = new EmbedBuilder()
    .setColor(servedSuccessfully ? (customerDislikesIceCream ? "Yellow": "Green"): "Red")
    .setTitle("🍧 𝘊𝘶𝘴𝘵𝘰𝘮𝘦𝘳 𝘚𝘦𝘳𝘷𝘦𝘥!")
    .setDescription(
      servedSuccessfully
      ? customerDislikesIceCream
      ? `😬 The customer tried **${customerPreference.icecream}**, but they didn't enjoy it. \n\n⭐ **Reputation:** ${playerShop.reputation}`: `<:celebration:1368113208023318558> Great job! You served a customer their favorite flavor: **${customerPreference.icecream}**. \n\n💰 **Earned:** <:creamcash:1309495440030302282> ${Math.floor(1.3 * customerPreference.cost)} cash\n✪ **Loyalty Points:** +10\n⭐ **Reputation:** ${playerShop.reputation}`: `😅 Oops! The customer wanted **${customerPreference.icecream}**, but you couldn't serve it. \n\n⭐ **Reputation:** ${playerShop.reputation}`
    )
    .setImage(customerDislikesIceCream ? "https://harshtiwari47.github.io/kasiko-public/images/icecream-served.png" : "https://harshtiwari47.github.io/kasiko-public/images/icecream-served-happily.png")
    .setFooter({
      text: servedSuccessfully
      ? customerDislikesIceCream
      ? "Not every customer loves the same flavor! Keep improving!": "Keep serving customers to grow your reputation!": "Try adding more flavors to meet customer preferences.",
    });

    try {
      suspenseMessage.edit({
        content: null,
        embeds: [embed],
      });
    } catch (err) {}
  },
    3000);
}