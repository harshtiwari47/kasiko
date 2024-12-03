import {
  EmbedBuilder
} from "discord.js";
import IceCreamShop from "../../../models/IceCream.js";
import User from "../../../models/User.js";
import {
  getUserData,
  updateUser
} from '../../../database.js';

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

const layout = [{
  color: "#f0935e",
  decoration: "𐙚⋆🍂⁺₊ 〰˖ ִֶָ 🍨 ˚˖𓍢ִ໋🦢💮",
  image: "https://harshtiwari47.github.io/kasiko-public/images/icecream-shop.jpg"
}];

function getLayout(lvl) {
  if (lvl > 1) lvl = 1;
  return layout[lvl - 1].image;
}

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
  category: "Explore",
  async execute(args, message) {
    try {
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

        if (playerShop) {
          return message.channel.send(`⚠️🍧 **${message.author.username}**, you already have a shop!`);
        }

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
          loyaltyPoints: 40,
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
          console.error(err);
          return message.channel.send("There was an issue creating your shop. Please try again.");
        }
      }

      if (!playerShop) {
        return message.channel.send(`🍧 **${message.author.username}**, you need to create an ice cream shop first using \`icecream/ice create <shopname>\`. The shop name must not contain spaces and must be within 15 characters.`);
      }
      // Command: Serve a customer
      if (args[0] === "serve") {
        if (playerShop.loyaltyPoints < 20) {
          return message.channel.send(
            `⚠️ **${message.author.username}**, your shop's ✪ loyalty points are below 20. You can earn more by using \`icecream daily\` or sharing ice cream with your friends!`
          );
        }

        if (playerShop.reputation < 0) {
          return message.channel.send(
            `⚠️ **${message.author.username}**, your shop's reputation points are below 0. You can earn more by using \`icecream daily\` or sharing ice cream with your friends!`
          );
        }

        const customerPreference = getRandomFlavor();
        const suspenseMessage = await message.channel.send("🍨 A customer is approaching... Let's see what they want!");

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
          .setTitle("🍧 Customer Served!")
          .setDescription(
            servedSuccessfully
            ? customerDislikesIceCream
            ? `😬 The customer tried **${customerPreference.icecream}**, but they didn't enjoy it. \n\n⭐ **Reputation:** ${playerShop.reputation}`: `🎉 Great job! You served a customer their favorite flavor: **${customerPreference.icecream}**. \n\n💰 **Earned:** <:creamcash:1309495440030302282> ${Math.floor(1.3 * customerPreference.cost)} cash\n✪ **Loyalty Points:** +10\n⭐ **Reputation:** ${playerShop.reputation}`: `😅 Oops! The customer wanted **${customerPreference.icecream}**, but you couldn't serve it. \n\n⭐ **Reputation:** ${playerShop.reputation}`
          )
          .setFooter({
            text: servedSuccessfully
            ? customerDislikesIceCream
            ? "Not every customer loves the same flavor! Keep improving!": "Keep serving customers to grow your reputation!": "Try adding more flavors to meet customer preferences.",
          });

          suspenseMessage.edit({
            content: null,
            embeds: [embed],
          });
        },
          3000);
      }

      // Other commands (share, createFlavor, upgrade, status, dailyBonus) follow a similar structure.

      if (args[0] === "status" || args[0] === "shop") {
        let decoration = `𐙚⋆🍂⁺₊ 〰˖ ִֶָ 🍨 ˚˖𓍢ִ໋🦢💮`;
        const embed = new EmbedBuilder()
        .setColor(layout[playerShop.shopLayout - 1].color)
        .setTitle(`🍦 ${playerShop.shopName}'s 𝑆𝐻𝑂𝑃`)
        .setDescription(
          `**Customers Served:** ${playerShop.customersServed}\n**Money:** <:creamcash:1309495440030302282> ${playerShop.money} cash\n**Loyalty Points:** ✪ ${playerShop.loyaltyPoints}\n**Reputation:** ${playerShop.reputation}\n**Shop Level:** ${playerShop.shopLevel}\n**Shop Layout:** ${playerShop.shopLayout}\n${decoration}`
        )
        .setImage(getLayout(playerShop.shopLayout)) // Replace with a relevant image URL
        .setFooter({
          text: "Keep serving and upgrading to reach new heights!"
        });

        const embed2 = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`**𝑆𝐻𝑂𝑃 𝐹𝐿𝐴𝑉𝑂𝑈𝑅𝑆**\n${playerShop.flavors.map(flavour => `**${flavour.icecream}** (${flavour.items})`).join(", ")}`);

        return message.channel.send({
          embeds: [embed, embed2]
        });
      }

      // Command: Share ice cream with a friend
      if (args[0] === "share") {
        try {
          let sharedIceCreamName;

          if (!args[2]) {
            return message.channel.send(
              `⚠️ **${message.author.username}**, please mention the ice cream 🍨 name you want to share with your friend!\n\`icecream share @username <icecream>\``
            );
          }

          sharedIceCreamName = capitalizeFirstLetter(args[2].toLowerCase());

          if (!playerShop.flavors.some(flavour => flavour.name === sharedIceCreamName && flavour.items > 0)) {
            return message.channel.send(
              `⚠️ **${message.author.username}**, no ice cream 🍨 with this name was found in your collection, or you don't have any left. Please check your collection and try again!`
            );
          }

          const targetUser = message.mentions.users.first();
          if (!targetUser) {
            return message.channel.send("👥 Please mention a user to share your ice cream with.");
          }

          const targetShop = await IceCreamShop.findOne({
            userId: targetUser.id
          });

          if (!playerShop || !targetShop) {
            return message.channel.send("🍦 Both users must own an ice cream shop to share ice cream. Use `icecream create <shop name>` to start your shop!");
          }

          const sharedIceCream = flavors.find(flavour => flavour.name === sharedIceCreamName);
          const targetIceCream = targetShop.flavors.find(flavour => flavour.name === sharedIceCreamName);

          if (targetShop.shopLevel < sharedIceCream.level) {
            return message.channel.send(
              `⚠️ **${message.author.username}**, your friend's shop level is too low to receive this ice cream 🍨. Encourage them to level up their shop and try again!`
            );
          }

          if (targetIceCream) {
            targetIceCream.items += 1;
          } else {
            targetShop.flavors.push({
              name: sharedIceCream.name,
              icecream: sharedIceCream.icecream,
              items: 1
            });
          }

          playerShop.money += 10;
          playerShop.reputation += 1;
          playerShop.loyaltyPoints += 15;

          playerShop.flavors.find(flavour => flavour.name === sharedIceCreamName).items -= 1;

          await targetShop.save();
          await playerShop.save();

          const shareEmbed = new EmbedBuilder()
          .setTitle("🎁 Ice Cream Shared!")
          .setDescription(
            `You generously shared a **${sharedIceCream}** ice cream with **${targetUser.username}**! 🍦`
          )
          .addFields(
            {
              name: "🎉 Reward for Sharing", value: "<:creamcash:1309495440030302282> +10 cash, +1 reputation, ✪⁠ +15 Loyalty Points!"
            }
          )
          .setColor(0x00ff00)
          .setFooter({
            text: "Sharing is caring!"
          });

          return message.channel.send({
            embeds: [shareEmbed]
          });
        } catch (e) {
          console.error(e);
          return message.channel.send(`⚠️ **${message.author.username}**, something went wrong while sharing ice cream 🍯!`)
        }
      }

      if ((args[0] === "flavours" || args[0] === "flavour") && args[1] && args[1] === "my") {
        const embed2 = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`**${message.author.username} 𝑆𝐻𝑂𝑃 𝐹𝐿𝐴𝑉𝑂𝑈𝑅𝑆**\n${playerShop.flavors.map(flavour => `**${flavour.icecream}** (${flavour.items})`).join(", ")}`);

        return message.channel.send({
          embeds: [embed2]
        });
      }

      if (args[0] === "flavours" || args[0] === "flavour") {
        const embed = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`**AVAILABLE FLAVOURS**\n${flavors.map(flavour => `**${flavour.icecream}**・⁠ <:creamcash:1309495440030302282> ${flavour.cost}・⁠**Lvl:** ${flavour.level}`).join(",\n")}`);

        return message.channel.send({
          embeds: [embed]
        });
      }

      // Command: Create a new flavor for your shop
      if (args[0] === "make") {

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

        if (IcecreamDetail.level > playerShop.shopLevel) {
          return message.channel.send(`🍯 **${message.author.username}**, your shop machine can't make this flavour, please upgrade your shop level`);
        }

        if (userIcecream && userIcecream.items > (playerShop.shopLevel * 2) + 1) {
          const maxStorage = playerShop.shopLevel * 2;
          return message.channel.send(
            `⚠️👀 Oops! **${message.author.username}**, your shop can only store up to **${playerShop.shopLevel * 2}** **${newFlavor}**, but you already have **${userIcecream.items}**. You need more space to store **${newFlavor}**. Try upgrading your shop! 🍧`
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
        const upgradeType = args[1] ? args[1].toLowerCase(): "machine";

        let upgradeCost = 0;
        let upgradeRoyaltyCost = 0;
        let upgradeMessage = "";

        if (upgradeType === "machine") {
          upgradeCost = 200 * playerShop.shopLevel;
          if (playerShop.money < upgradeCost) {
            return message.channel.send(`💸 **${message.author.username}**, you don't have enough cash to upgrade your machine (Cost: <:creamcash:1309495440030302282> ${upgradeCost} cash).`);
          }
          playerShop.shopLevel += 1;
          upgradeMessage = "machine";
        } else if (upgradeType === "layout") {
          upgradeRoyaltyCost = 200 * playerShop.shopLayout * playerShop.shopLayout/2;
          if (playerShop.loyaltyPoints < upgradeRoyaltyCost) {
            return message.channel.send(`💸 **${message.author.username}**, don't have enough ✪⁠ loyalty points to upgrade your layout (Cost: ✪⁠ 150 points).`);
          }
          playerShop.shopLayout += 1;
          upgradeMessage = "layout";
        } else {
          return message.channel.send("❌ Invalid upgrade type! Use `ice upgrade machine` or `ice upgrade layout`.");
        }

        playerShop.money -= upgradeCost;
        playerShop.loyaltyPoints -= upgradeRoyaltyCost;
        await playerShop.save();

        const upgradeEmbed = new EmbedBuilder()
        .setTitle("🍨🔧 Shop Upgraded!")
        .setDescription(`**${message.author.username}**, your shop's **${upgradeMessage}** has been improved! 🚀`)
        .addFields(
          {
            name: `${upgradeType === "machine" ? "💰 Cash": "✪ Loyalty"} Spent`, value: `${upgradeType === "machine" ? "<:creamcash:1309495440030302282> -" + upgradeCost + "cash": "✪⁠" + upgradeRoyaltyCost + "loyalty"}`
          },
          {
            name: `📈 Shop ${upgradeType === "machine" ? "Level": "Layout"}`, value: `${upgradeType === "machine" ? playerShop.shopLevel: playerShop.shopLayout}`
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

      // Command: Layout
      if (args[0] === "layout") {
        if (!args[1]) args[1] = 1;
        if (args[1] && !isNaN(args[1]) && Number.isInteger(parseInt(args[1])) && (parseInt(args[1]) < 8) && (parseInt(args[1]) > 0)) {

          let level = parseInt(args[1]);

          const embed = new EmbedBuilder()
          .setColor(layout[level - 1].color)
          .setDescription(`**LEVEL ${level} LAYOUT**\n${layout[level - 1].decoration}`)
          .setImage(layout[level - 1].image);

          return message.channel.send({
            embeds: [embed]
          });
        } else {
          return message.channel.send(
            `⚠️ **${message.author.username}**, please provide a valid level (1) to view the shop's layout, including its image, color, and decoration.\nExample: \`icecream layout 3\``
          );
        }
      }

      // Command: Exchange
      if (args[0] === "exchange") {
        if (args[1] && !isNaN(args[1]) && Number.isInteger(parseInt(args[1]))) {
          let amount = parseInt(args[1]);

          if (playerShop.loyaltyPoints < amount) {
            return message.channel.send(`⚠️ **${message.author.username}**, your shop doesn't have ✪⁠ ${amount} loyalty points.`);
          }

          const user = await User.findOne({
            id: userId
          });

          if (!user) {
            return message.channel.send(`⚠️ **${message.author.username}**, your account doesn't exist in Kasiko.`);
          }

          user.cash += amount * 50;
          playerShop.loyaltyPoints -= amount;

          await updateUser(userId, user);
          await playerShop.save();

          return message.channel.send(`🍨🎊 **${message.author.username}**, you successfully exchanged ✪⁠ ${amount} loyalty points for <:kasiko_coin:1300141236841086977> ${(amount * 50).toLocaleString()} cash!`);
        } else {
          return message.channel.send(`⚠️ **${message.author.username}**, please specify a valid integer for the loyalty points to exchange for Kasiko cash.\n\`icecream exchange 10\``);
        }
      }

      // Command: Claim daily bonus
      if (args[0] === "daily") {

        const timeElapsed = Date.now() - playerShop.lastVisit;
        if (timeElapsed < 86400000 && playerShop.dailyBonusClaimed) {
          return message.channel.send(`🕒 **${message.author.username}**, you've already claimed your ice cream shop daily bonus today. Come back tomorrow! 🍯`);
        }

        const suspenseMessage = await message.channel.send("🎁 Claiming your daily bonus... Please wait! 🎉");
        setTimeout(async () => {
          playerShop.dailyBonusClaimed = true;
          playerShop.money += 100;
          let loyaltyPointsGained = playerShop.reputation > 150 ? 20 * Math.floor(playerShop.reputation/150): 20;
          playerShop.loyaltyPoints += loyaltyPointsGained;
          playerShop.reputation += 1;
          playerShop.lastVisit = Date.now();
          await playerShop.save();

          const bonusEmbed = new EmbedBuilder()
          .setTitle("🎉 𝐃𝐚𝐢𝐥𝐲 𝐁𝐨𝐧𝐮𝐬 𝐂𝐥𝐚𝐢𝐦𝐞𝐝!")
          .setDescription(`**${message.author.username}** received today's reward, including +1 reputation points!\nYou can claim 20 loyalty points, plus 20 for every 150 reputation!`)
          .addFields(
            {
              name: "<:creamcash:1309495440030302282> cash", value: "+100 cash"
            },
            {
              name: "✪⁠ Loyalty Points", value: `+${loyaltyPointsGained} Points`
            }
          )
          .setColor(0xefb7b7)
          .setFooter({
            text: "Come back tomorrow for more rewards!"
          });

          return suspenseMessage.edit({
            embeds: [bonusEmbed], content: null
          });
        }, 2000); // Adding suspense with a 2-second delay
      }
    } catch (e) {
      console.error(e);
      return message.channel.send(`⚠️ **${message.author.username}**, something went wrong while executing the ice cream shop command! 🍧🍯`);
    }
  },
};