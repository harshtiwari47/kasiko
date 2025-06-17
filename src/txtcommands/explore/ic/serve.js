import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder
} from 'discord.js';

import {
  discordUser
} from '../../../../helper.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

function getUsername(ctx) {
  return ctx.author ? ctx.author.username: ctx.user.username;
}

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

  const textDisplay = new TextDisplayBuilder()
  .setContent(`🍨 A customer named **${randomName}** is approaching... Let's see what they want!`);

  const suspenseMessage = await await handleMessage(context, {
    components: [textDisplay],
    flags: MessageFlags.IsComponentsV2
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

    const Container = new ContainerBuilder()
    .setAccentColor(servedSuccessfully ? (customerDislikesIceCream ? 0xe9e346: 0x00d900): 0xdb3939)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### 🍧 ${name}, 𝘊𝘶𝘴𝘵𝘰𝘮𝘦𝘳 𝘚𝘦𝘳𝘷𝘦𝘥 *!*`)
    )
    .addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(
          servedSuccessfully
          ? customerDislikesIceCream
          ? `😬 The customer tried **${customerPreference.icecream}**, but they didn't enjoy it.`: `<:celebration:1368113208023318558> Great job! You served a customer their favorite flavor: **${customerPreference.icecream}**.`: `😅 Oops! The customer wanted **${customerPreference.icecream}**, but you couldn't serve it.`
        )
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('Ice-cream served')
        .setURL(customerDislikesIceCream ? "https://harshtiwari47.github.io/kasiko-public/images/icecream-served.png": "https://harshtiwari47.github.io/kasiko-public/images/icecream-served-happily.png"),
      )
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(servedSuccessfully && !customerDislikesIceCream
        ? `💰 **Earned:** <:creamcash:1309495440030302282> ${Math.floor(1.3 * customerPreference.cost)} cash\n✪ **Loyalty Points:** +10\n⭐ **Reputation:** ${playerShop.reputation}`: `⭐ **Reputation:** ${playerShop.reputation}`
      )
    )
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(servedSuccessfully
        ? customerDislikesIceCream
        ? "-# Not every customer loves the same flavor! Keep improving!": "-# Keep serving customers to grow your reputation!": "-# Try adding more flavors to meet customer preferences."
      )
    )

    try {
      suspenseMessage.edit({
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (err) {}
  },
    3000);
}