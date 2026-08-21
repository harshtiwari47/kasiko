import {
  EmbedBuilder
} from 'discord.js';

import {
  discordUser,
  handleMessage
} from '../../../../helper.js';

import { increaseTask } from "../../economy/task.js";

export async function serveIceCream(playerShop, flavors, userId, username, context) {
  const {
    name
  } = discordUser(context);

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

  const customerNames = [
    "Amelia Frost",
    "Jonah Berry",
    "Chloe Caramel",
    "Max Sprinkle",
    "Sophia Sundae",
    "Liam Gray",
    "Emma Rose",
    "Noah Reed",
    "Ava Lane",
    "Lucas Dean",
    "Mia Brooks",
    "Ethan Cole",
    "Lily James",
    "Oliver Ray",
    "Ella Scott",
    "James Lee",
    "Grace Kim",
    "Henry Knox",
    "Nora Blake",
    "Jack West"
  ];

  const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
  const customerPreference = getRandomFlavor();

  const suspenseEmbed = new EmbedBuilder()
    .setDescription(`🍨 A customer named **${randomName}** is approaching... Let's see what they want!`)
    .setColor(0x3498db);

  const suspenseMessage = await handleMessage(context, {
    embeds: [suspenseEmbed]
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

    const description = servedSuccessfully
      ? customerDislikesIceCream
        ? `😬 The customer tried **${customerPreference.icecream}**, but they didn't enjoy it.\n\n⭐ **Reputation:** ${playerShop.reputation}\n-# Not every customer loves the same flavor! Keep improving!`
        : `<:celebration:1368113208023318558> Great job! You served a customer their favorite flavor: **${customerPreference.icecream}**.\n\n💰 **Earned:** <:creamcash:1309495440030302282> ${Math.floor(1.3 * customerPreference.cost)} cash\n✪ **Loyalty Points:** +10\n⭐ **Reputation:** ${playerShop.reputation}\n-# Keep serving customers to grow your reputation!`
      : `😅 Oops! The customer wanted **${customerPreference.icecream}**, but you couldn't serve it.\n\n⭐ **Reputation:** ${playerShop.reputation}\n-# Try adding more flavors to meet customer preferences.`;

    const resultEmbed = new EmbedBuilder()
      .setTitle(`🍧 ${name}, Customer Served!`)
      .setDescription(description)
      .setColor(servedSuccessfully ? (customerDislikesIceCream ? 0xe9e346 : 0x00d900) : 0xdb3939)
      .setThumbnail(customerDislikesIceCream ? "https://harshtiwari47.github.io/kasiko-public/images/icecream-served.png" : "https://harshtiwari47.github.io/kasiko-public/images/icecream-served-happily.png");

    if (!customerDislikesIceCream && servedSuccessfully) {
      await increaseTask(userId, "serve").catch(() => {});
    }

    try {
      if (suspenseMessage?.edit) {
        await suspenseMessage.edit({ embeds: [resultEmbed] }).catch(() => handleMessage(context, { embeds: [resultEmbed] }));
      } else {
        await handleMessage(context, { embeds: [resultEmbed] });
      }
    } catch (err) {
      await handleMessage(context, { embeds: [resultEmbed] });
    }
  }, 3000);
}