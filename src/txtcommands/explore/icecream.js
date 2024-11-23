import {
  EmbedBuilder
} from "discord.js";
import IceCreamShop from "../../../models/IceCream.js";

const flavors = [{
  level: 1,
  name: "Kulfi",
  icecream: "Kulfi <:kulfi:1308433408946339840>",
  cost: 10,
  description: "Kulfi is a traditional Indian ice cream, made with milk, sugar, and flavored with cardamom, saffron, or pistachios. It has a creamy texture and a rich, aromatic taste."
},
  {
    level: 1,
    name: "Cornetto",
    icecream: "Cornetto <:cornetto:1308432551605567548>",
    cost: 20,
    description: "Cornetto is a delicious cone-shaped ice cream, with layers of chocolate, crunchy nuts, and creamy vanilla ice cream inside. It's a perfect snack for a summer day."
  },
  {
    level: 2,
    name: "Mango",
    icecream: "Mango <:mango:1308431725629804555>",
    cost: 30,
    description: "Mango ice cream is a refreshing and tropical treat made with ripe mangoes. Its sweet, fruity flavor and smooth texture make it a favorite for hot weather."
  },
  {
    level: 2,
    name: "Vanilla",
    icecream: "Vanilla <:vanilla:1308429918392160297>",
    cost: 40,
    description: "Vanilla ice cream is a classic favorite made with rich cream, sugar, and real vanilla beans. Its creamy texture and sweet, comforting flavor make it versatile for any occasion."
  },
  {
    level: 3,
    name: "Mintchoco",
    icecream: "Mintchoco <:mintchoco:1308429199010172998>",
    cost: 50,
    description: "Mintchoco combines the cool, refreshing taste of mint with the rich, bittersweet flavor of chocolate. This perfect pairing creates a unique and delightful ice cream experience."
  },
  {
    level: 4,
    name: "Butterscotch",
    icecream: "Butterscotch <:butterscotch:1308428705281871922>",
    cost: 60,
    description: "Butterscotch ice cream is a sweet and creamy treat made with brown sugar, butter, and a hint of vanilla. It offers a rich, caramelized flavor with a smooth, velvety texture."
  },
  {
    level: 5,
    name: "Raspberry",
    icecream: "Raspberry <:raspberry:1308428101843292160>",
    cost: 70,
    description: "Raspberry ice cream is a tangy and sweet dessert made with fresh raspberries. The combination of fruitiness and creaminess makes it a refreshing treat, perfect for a summer day."
  },
  {
    level: 6,
    name: "Pistachio",
    icecream: "Pistachio <:pistachio:1308425847446831204>",
    cost: 80,
    description: "Pistachio ice cream is a rich and nutty treat, made with roasted pistachios. Its delicate, sweet flavor with a subtle salty undertone makes it a gourmet favorite for many."
  },
  {
    level: 7,
    name: "Hazelnut",
    icecream: "Hazelnut <:hazelnut:1308425572317270097>",
    cost: 90,
    description: "Hazelnut ice cream is a smooth, creamy dessert infused with the nutty flavor of roasted hazelnuts. Its rich taste and satisfying texture make it a luxurious treat for ice cream lovers."
  }];

function capitalizeFirstLetter(word) {
  if (!word) return ""; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function extractName(text) {
  // Split the string at the emoji part
  const name = text.split(" <")[0];
  return name.trim();
}


export default {
  name: "icecream",
  description: "A fun ice cream shop game where you can create, serve, share ice creams, and upgrade your shop!",
  aliases: ["icecream",
    "ic",
    "is",
    "ishop",
    "cream",
    "ice"],
  args: "<action> [target]",
  example: [
    "create <shopName> [startingFlavor]",
    "serve [customer]",
    "share <targetUser>",
    "createFlavor <newFlavor>",
    "upgrade <type (machine/layout)>",
    "status",
    "dailyBonus",
  ],
  related: ["stat",
    "profile",
    "help",
    "cash"],
  cooldown: 5000,
  category: "Game",
  async execute(args, message) {
    const userId = message.author.id;
    const username = message.author.username;
    args.shift();

    const playerShop = await IceCreamShop.findOne({
      userId
    });

    const getRandomFlavor = () => {
      let level = playerShop.shopLevel;
      let selectedFlavours = flavors.filter(flavor => flavor.level < level + 1 || flavor.level < level);
      return selectedFlavours[Math.floor(Math.random() * selectedFlavours.length)];
    };

    // Command: Create a new shop
    if (args[0] === "create") {
      if (!args[1]) return message.channel.send("❌ Shop name not found! Please create your ice cream shop first using `icecream/ice create <shopname>`.");
      const shopName = args[1].substring(0, 15);

      const newShop = new IceCreamShop( {
        userId,
        shopName,
        flavors: [{
          name: "Kulfi",
          icecream: "Kulfi <:kulfi:1308433408946339840>",
          items: 1
        }],
        customersServed: 0,
        money: 100, // Starting cash
        loyaltyPoints: 0,
        reputation: 50,
        shopLevel: 1,
        dailyBonusClaimed: false
      });

      try {
        await newShop.save();

        const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(`🍨 Welcome to **${shopName}**!`)
        .setDescription(
          `🎉 Congratulations, **${username}**! You've opened **${shopName}** with your first flavor: **Kulfi <:kulfi:1308433408946339840>**. Start serving customers to grow your shop!`
        )
        .setImage("https://harshtiwari47.github.io/kasiko-public/images/icecream-shop.jpg") // Replace with a relevant image URL
        .setFooter({
          text: "Type `icecream help` to see what you can do!"
        });

        return message.channel.send({
          embeds: [embed]
        });
      } catch (err) {
        return message.channel.send("There was an issue creating your shop. Please try again.");
      }
    }

    if (!playerShop) {
      return message.channel.send("❌ You need to create an ice cream shop first using `icecream/ice create <shopname>`. The shop name must not contain spaces and must be within 15 characters.");
    }
    // Command: Serve a customer
    if (args[0] === "serve") {

      const customerPreference = getRandomFlavor();
      const suspenseMessage = await message.channel.send("🍨 A customer is approaching... Let's see what they want!");

      setTimeout(async () => {
        const servedSuccessfully = playerShop.flavors.some(FLAVOUR => customerPreference.name === FLAVOUR.name && FLAVOUR.items > 0);

        if (servedSuccessfully) {
          const flavorDetail = playerShop.flavors.find(FLAVOUR => customerPreference.name === FLAVOUR.name);
          flavorDetail.items -= 1;
        }

        playerShop.customersServed += servedSuccessfully ? 1: 0;
        playerShop.customersServed += servedSuccessfully ? 1: 0;
        playerShop.money += servedSuccessfully ? 20: 0;
        playerShop.loyaltyPoints += servedSuccessfully ? 10: 0;
        playerShop.reputation += servedSuccessfully ? 2: -1;

        await playerShop.save();

        const embed = new EmbedBuilder()
        .setColor(servedSuccessfully ? "Green": "Red")
        .setTitle("🍧 Customer Served!")
        .setDescription(
          servedSuccessfully
          ? `🎉 Great job! You served a customer their favorite flavor: **${customerPreference.icecream}**. \n\n💰 **Earned:** <:creamcash:1309495440030302282> 20 cash\n🏆 **Loyalty Points:** +10\n⭐ **Reputation:** ${playerShop.reputation}`: `😅 Oops! The customer wanted **${customerPreference.icecream}**, but you couldn't serve it. \n\n⭐ **Reputation:** ${playerShop.reputation}`
        )
        .setFooter({
          text: servedSuccessfully
          ? "Keep serving customers to grow your reputation!": "Try adding more flavors to meet customer preferences.",
        });

        suspenseMessage.edit({
          content: null, embeds: [embed]
        });
      },
        3000);
    }

    // Other commands (share, createFlavor, upgrade, status, dailyBonus) follow a similar structure.

    if (args[0] === "status") {

      const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`🍦 ${playerShop.shopName} - Shop Status`)
      .setDescription(
        `**Customers Served:** ${playerShop.customersServed}\n**Money:** <:creamcash:1309495440030302282> ${playerShop.money} cash\n**Loyalty Points:** ${playerShop.loyaltyPoints}\n**Reputation:** ${playerShop.reputation}\n**Shop Level:** ${playerShop.shopLevel}`
      )
      .setImage("https://harshtiwari47.github.io/kasiko-public/images/icecream-shop.jpg") // Replace with a relevant image URL
      .setFooter({
        text: "Keep serving and upgrading to reach new heights!"
      });

      message.channel.send({
        embeds: [embed]
      });

      const embed2 = new EmbedBuilder()
      .setColor('#f5bbaf')
      .setDescription(`**SHOP FLAVOURS**\n${playerShop.flavors.map(flavour => `${flavour.icecream} (${flavour.items})`).join(",")}`);

      return message.channel.send({
        embeds: [embed2]
      });
    }

    // Command: Share ice cream with a friend
    if (args[0] === "share") {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.channel.send("👥 Please mention a user to share your ice cream with.");
      }

      const targetShop = await IceCreamShop.findOne({
        userId: targetUser.id
      });

      if (!playerShop || !targetShop) {
        return message.channel.send("🍦 Both users must own an ice cream shop to share ice cream. Use `/create` to start your shop!");
      }

      const sharedIceCream = getRandomFlavor();
      targetShop.flavors.push(sharedIceCream);
      targetShop.money += 30;
      targetShop.loyaltyPoints += 15;
      await targetShop.save();

      const shareEmbed = new EmbedBuilder()
      .setTitle("🎁 Ice Cream Shared!")
      .setDescription(
        `You generously shared a **${sharedIceCream}** ice cream with **${targetUser.username}**! 🍦`
      )
      .addFields(
        {
          name: "🎉 Reward for Sharing", value: "<:creamcash:1309495440030302282> +30 cash, +15 Loyalty Points!"
        }
      )
      .setColor(0x00ff00)
      .setFooter({
        text: "Sharing is caring!"
      });

      return message.channel.send({
        embeds: [shareEmbed]
      });
    }

    if (args[0] === "flavour" && args[1] === "all") {
      const embed = new EmbedBuilder()
      .setColor('#f5bbaf')
      .setDescription(`**AVAILABLE FLAVOURS**\n${flavors.map(flavour => `**${flavour.icecream}** — <:creamcash:1309495440030302282> ${flavour.cost}`).join(",\n")}`);

      return message.channel.send({
        embeds: [embed]
      });
    }

    // Command: Create a new flavor for your shop
    if (args[0] === "flavour") {

      if (!args[1]) {
        return message.channel.send(
          `⚠️ Please specify the ice cream name or to view the available list, try \`flavour all\` 🍧`
        );
      }

      const newFlavor = capitalizeFirstLetter(args[1].trim().toLowerCase());

      if (!flavors.some(flavor => flavor.name === newFlavor)) {
        return message.channel.send("⚠️ Sorry, the specified ice cream was not found. Please check the name or try again.");
      }

      const userIcecream = playerShop.flavors.find(flavor => flavor.name === newFlavor);
      const IcecreamDetail = flavors.find(flavor => flavor.name === newFlavor);

      if (userIcecream && userIcecream.items > playerShop.shopLevel * 2) {
        const maxStorage = playerShop.shopLevel * 2;
        return message.channel.send(
          `⚠️👀 Oops! **${message.author.username}**, your shop can only store up to **${playerShop.shopLevel * 2}** **${newFlavor}**, but you already have **${userIcecream.items}**. You need more space to store **${newFlavor}**. Try upgrading your shop!`
        );
      }

      if (playerShop.money < IcecreamDetail.cost) {
        return message.channel.send(`⚠️💰 **${message.author.username}**, you don't have enough cash to create a new flavor (Cost: <:creamcash:1309495440030302282> ${IcecreamDetail.cost} cash).`);
      }

      if (userIcecream) {
        userIcecream.items += 1;
      } else {
        playerShop.flavors.push({
          name: IcecreamDetail.name,
          icecream: IcecreamDetail.icecream,
          items: 1
        });
      }

      playerShop.money -= IcecreamDetail.cost;
      await playerShop.save();

      const flavorEmbed = new EmbedBuilder()
      .setTitle("🍧 New Flavor Created!")
      .setDescription(`**${message.author.username}**, you just created the flavor: **${IcecreamDetail.icecream}**!`)
      .addFields(
        {
          name: "💰 cash Spent", value: `<:creamcash:1309495440030302282> ${IcecreamDetail.cost} cash`
        }
      )
      .setColor(0xffa500)
      .setFooter({
        text: "Keep innovating with new flavors!"
      });

      return message.channel.send({
        embeds: [flavorEmbed]
      });
    }

    // Command: Upgrade the ice cream shop
    if (args[0] === "upgrade") {
      const upgradeType = args[1];

      const playerShop = await IceCreamShop.findOne({
        userId
      });
      if (!playerShop) {
        return message.channel.send(`🔧 **${message.author.username}**, need an ice cream shop to upgrade. Use \`create\`.`);
      }

      let upgradeCost = 0;
      let upgradeMessage = "";

      if (upgradeType === "machine") {
        upgradeCost = 200;
        if (playerShop.money < upgradeCost) {
          return message.channel.send(`💸 **${message.author.username}**, you don't have enough cash to upgrade your machine (Cost: <:creamcash:1309495440030302282> 200 cash).`);
        }
        playerShop.shopLevel += 1;
        upgradeMessage = "Machine Level";
      } else if (upgradeType === "layout") {
        upgradeCost = 150;
        if (playerShop.money < upgradeCost) {
          return message.channel.send(`💸 **${message.author.username}**, don't have enough cash to upgrade your layout (Cost: <:creamcash:1309495440030302282> 150 cash).`);
        }
        playerShop.shopLevel += 0.5;
        upgradeMessage = "Shop Layout";
      } else {
        return message.channel.send("❌ Invalid upgrade type! Use `ice upgrade machine` or `ice upgrade layout`.");
      }

      playerShop.money -= upgradeCost;
      await playerShop.save();

      const upgradeEmbed = new EmbedBuilder()
      .setTitle("🔧 Shop Upgraded!")
      .setDescription(`**${message.author.username}**, your shop's **${upgradeMessage}** has been improved! 🚀`)
      .addFields(
        {
          name: "💰 cash Spent", value: `<:creamcash:1309495440030302282> -${upgradeCost} cash`
        },
        {
          name: "📈 Shop Level", value: playerShop.shopLevel.toString()
        }
      )
      .setColor(0x00c8ff)
      .setFooter({
        text: "Keep upgrading to become the top ice cream shop!"
      });

      return message.channel.send({
        embeds: [upgradeEmbed]
      });
    }

    // Command: Claim daily bonus
    if (args[0] === "daily") {
      const playerShop = await IceCreamShop.findOne({
        userId
      });
      if (!playerShop) {
        return message.channel.send(`🎁 **${message.author.username}**, you need an ice cream shop to claim daily bonuses. Use \`create\`.`);
      }

      const timeElapsed = Date.now() - playerShop.lastVisit;
      if (timeElapsed < 86400000 && playerShop.dailyBonusClaimed) {
        return message.channel.send(`🕒 **${message.author.username}**, you've already claimed your daily bonus today. Come back tomorrow!`);
      }

      const suspenseMessage = await message.channel.send("🎁 Claiming your daily bonus... Please wait! 🎉");
      setTimeout(async () => {
        playerShop.dailyBonusClaimed = true;
        playerShop.money += 100;
        playerShop.loyaltyPoints += 20;
        playerShop.lastVisit = Date.now();
        await playerShop.save();

        const bonusEmbed = new EmbedBuilder()
        .setTitle("🎉 Daily Bonus Claimed!")
        .setDescription(`**${message.author.username}** received today's reward!`)
        .addFields(
          {
            name: "💰 cash", value: "<:creamcash:1309495440030302282> +100 cash"
          },
          {
            name: "🎯 Loyalty Points", value: "+20 Points"
          }
        )
        .setColor(0x32cd32)
        .setFooter({
          text: "Come back tomorrow for more rewards!"
        });

        suspenseMessage.edit({
          embeds: [bonusEmbed], content: null
        });
      }, 2000); // Adding suspense with a 2-second delay
    }
  },
};