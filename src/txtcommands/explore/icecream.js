import {
  EmbedBuilder
} from "discord.js";
import IceCreamShop from "../../../models/IceCream.js";
import layout from "./ic/layout.js";
import helpEmbed from "./ic/help.js";
import User from "../../../models/User.js";
import UserGuild from "../../../models/UserGuild.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  makeIceCream
} from './ic/make.js';
import {
  serveIceCream
} from './ic/serve.js';
import {
  playerShopInfo
} from './ic/shop.js';

import {
  iceLeaderboard
} from './ic/leaderboard.js';

import {
  checkPassValidity
} from "../explore/pass.js";

import {
  handleMessage,
  discordUser
} from '../../../helper.js';

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

function getLayout(lvl) {
  if (lvl > 2) lvl = 2;
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
    "ishop",
    "cream",
    "ice"],
  args: "<action> [target]",
  example: [
    "ice create <shopname (no space)>",
    "ice status/shop",
    "ice layout <level>",
    "ice flavours",
    // Show all available flavours
    "ice flavours my",
    // Show your shop's flavours
    "ice make",
    // Create a new flavour
    "ice upgrade machine/layout",
    // Upgrade your shop's machine or layout
    "ice share @user <flavour>",
    // Share an ice cream with another user
    "ice exchange <amount>",
    // Convert loyalty points into cash
    "ice leaderboard money|reputation|served",
    // leaderboard
    "ice daily" // Claim your daily bonus
  ],
  emoji: "<:raspberry:1308428101843292160>",
  related: ["stat",
    "profile",
    "help",
    "cash"],
  cooldown: 5000,
  category: "🍬 Explore",
  async execute(args, context) {
    try {
      const {
        username,
        id: userId,
        avatar,
        name
      } = discordUser(context);

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
        if (!args[1]) return await handleMessage(context, "❌ Shop name not found! Please create your ice cream shop first using `icecream create <shopname>`.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        const shopName = args[1].substring(0, 15);

        if (playerShop) {
          return await handleMessage(context, `<:warning:1366050875243757699>🍧 **${name}**, you already have a shop!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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

          return await handleMessage(context, {
            embeds: [embed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } catch (err) {
          console.error(err);
          return await handleMessage(context, "There was an issue creating your shop. Please try again.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if (!playerShop) {
        return await handleMessage(context, `
          🍧 **${name}**, you need to create an ice cream shop first!\n` +
          `**Use the command:**\n` +
          `\`ice create <shopname>\`\n\n` +

          `*The shop name must be a single word (no spaces) and up to 15 characters long.*\n` +
          `-# USE: **\`ice help\`** 𝘧𝘰𝘳 𝘮𝘰𝘳𝘦 𝘥𝘦𝘵𝘢𝘪𝘭𝘴!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (context.guild && context.guild.id) {
        await UserGuild.findOneAndUpdate(
          {
            userId: userId,
            guildId: context.guild.id
          },
          {
            $set: {
              'icecream.money': playerShop.money,
              'icecream.reputation': playerShop.reputation,
              'icecream.served': playerShop.customersServed
            }
          },
          {
            upsert: true // Create a new document if no match is found
          }
        );
      }

      // Command: Serve a customer
      if (args[0] === "serve") {
        return await serveIceCream(playerShop, flavors, userId, name, context);
      }

      // Other commands (rename, share, createFlavor, upgrade, status, dailyBonus) follow a similar structure.

      if (args[0] === "shopname") {

        if (!args[1]) return await handleMessage(context, "❌ Shop name not found! Please add your ice cream shop first using `icecream shopname <shopname>`\nPlease don't use spaces in name.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        const shopNameNew = args[1].substring(0, 15);

        if (!playerShop) {
          return await handleMessage(context, `<:warning:1366050875243757699>🍧 **${name}**, you don't have a shop!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        playerShop.shopName = shopNameNew;
        await playerShop.save();
        return await handleMessage(context, `🍧 **${name}**, your shop renamed successfully.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Command: Share ice cream with a friend
      if (args[0] === "share") {
        try {
          let sharedIceCreamName;

          if (!args[2]) {
            return await handleMessage(context,
              `<:warning:1366050875243757699> **${name}**, please mention the ice cream 🍨 name you want to share with your friend!\n\`icecream share @username <icecream>\``
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          sharedIceCreamName = capitalizeFirstLetter(args[2]?.toLowerCase());

          if (!playerShop.flavors.some(flavour => flavour.name === sharedIceCreamName && flavour.items > 0)) {
            return await handleMessage(context,
              `<:warning:1366050875243757699> **${name}**, no ice cream 🍨 with this name was found in your collection, or you don't have any left. Please check your collection and try again!`
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          const targetUser = context.mentions.users.first();
          if (!targetUser) {
            return await handleMessage(context, "👥 Please mention a user to share your ice cream with.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          const targetShop = await IceCreamShop.findOne({
            userId: targetUser.id
          });

          if (!playerShop || !targetShop) {
            return await handleMessage(context, "🍦 Both users must own an ice cream shop to share ice cream.\n**Use:** `icecream create <shop name>` to start your shop!\n\n*The shop name must be a single word (no spaces) and up to 15 characters long.*").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          const sharedIceCream = flavors.find(flavour => flavour.name === sharedIceCreamName);
          const targetIceCream = targetShop.flavors.find(flavour => flavour.name === sharedIceCreamName);

          if (targetShop.shopLevel < sharedIceCream.level) {
            return await handleMessage(context,
              `<:warning:1366050875243757699> **${name}**, your friend's shop level is too low to receive this ice cream 🍨. Encourage them to level up their shop and try again!`
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
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

          const userData = await getUserData(userId);

          playerShop.money += 10;
          playerShop.reputation += 1;
          playerShop.loyaltyPoints += 15;
          userData.friendly += 5;

          playerShop.flavors.find(flavour => flavour.name === sharedIceCreamName).items -= 1;

          await targetShop.save();
          await playerShop.save();
          await updateUser(userId, userData)

          const shareEmbed = new EmbedBuilder()
          .setTitle("🎁 Ice Cream Shared!")
          .setDescription(
            `You generously shared a **${sharedIceCream.icecream}** ice cream with **${targetUser.username}**! 🍦`
          )
          .addFields(
            {
              name: "<:celebration:1368113208023318558> Reward for Sharing", value: "<:creamcash:1309495440030302282> +10 cash, +1 reputation, ✪⁠ +15 Loyalty Points, +5 friendly points!"
            }
          )
          .setColor(0x00ff00)
          .setFooter({
            text: "Sharing is caring!"
          });

          return await handleMessage(context, {
            embeds: [shareEmbed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } catch (e) {
          console.error(e);
          return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, something went wrong while sharing ice cream 🍯!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      if ((args[0] === "flavours" || args[0] === "flavour") && args[1] && args[1] === "my") {
        const embed2 = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`**${name} 𝑆𝐻𝑂𝑃 𝐹𝐿𝐴𝑉𝑂𝑈𝑅𝑆**\n${playerShop.flavors.map(flavour => `**${flavour.icecream}** (${flavour.items})`).join(", ")}`);

        return await handleMessage(context, {
          embeds: [embed2]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (args[0] === "flavours" || args[0] === "flavour") {
        const embed = new EmbedBuilder()
        .setColor('#f5bbaf')
        .setDescription(`**AVAILABLE FLAVOURS**\n${flavors.map(flavour => `**${flavour.icecream}**・⁠ <:creamcash:1309495440030302282> ${flavour.cost}・⁠**Lvl:** ${flavour.level}`).join(",\n")}`);

        return await handleMessage(context, {
          embeds: [embed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Command: Create a new flavor for your shop
      if (args[0] === "make") {
        return await makeIceCream(playerShop, flavors, userId, name, context);
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
            return await handleMessage(context, `💸 **${name}**, you don't have enough cash to upgrade your machine (Cost: <:creamcash:1309495440030302282> ${upgradeCost} cash).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          playerShop.shopLevel += 1;
          upgradeMessage = "machine";
        } else if (upgradeType === "layout") {
          upgradeRoyaltyCost = 200 * playerShop.shopLayout * playerShop.shopLayout/2;
          if (playerShop.loyaltyPoints < upgradeRoyaltyCost) {
            return await handleMessage(context, `💸 **${name}**, don't have enough ✪⁠ loyalty points to upgrade your layout (Cost: ✪ ${upgradeRoyaltyCost} points).`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
          playerShop.shopLayout += 1;
          upgradeMessage = "layout";
        } else {
          return await handleMessage(context, "❌ Invalid upgrade type! Use `ice upgrade machine` or `ice upgrade layout`.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        playerShop.money -= upgradeCost;
        playerShop.loyaltyPoints -= upgradeRoyaltyCost;
        await playerShop.save();

        const upgradeEmbed = new EmbedBuilder()
        .setTitle("🍨🔧 Shop Upgraded!")
        .setDescription(`**${name}**, your shop's **${upgradeMessage}** has been improved! 🚀`)
        .addFields(
          {
            name: `${upgradeType === "machine" ? "<:moneybag:1365976001179553792> Cash": "✪ Loyalty"} Spent`, value: `${upgradeType === "machine" ? "<:creamcash:1309495440030302282> -" + upgradeCost + "cash": "✪⁠" + upgradeRoyaltyCost + "loyalty"}`
          },
          {
            name: `📈 Shop ${upgradeType === "machine" ? "Level": "Layout"}`, value: `${upgradeType === "machine" ? playerShop.shopLevel: playerShop.shopLayout}`
          }
        )
        .setColor(0x00c8ff)
        .setFooter({
          text: "Keep upgrading to become the top ice cream shop!"
        });

        return await handleMessage(context, {
          embeds: [upgradeEmbed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Command: Layout
      if (args[0] === "layout") {
        if (!args[1]) args[1] = 1;
        if (args[1] && !isNaN(args[1]) && Number.isInteger(parseInt(args[1])) && (parseInt(args[1]) < 8) && (parseInt(args[1]) > 0)) {

          let level = parseInt(args[1]);

          if (level > 2 || level < 0) {
            return await handleMessage(context,
              `<:warning:1366050875243757699> Currently, only the up to \`level 2\` layout is available!`
            ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          const embed = new EmbedBuilder()
          .setColor(layout[level - 1].color)
          .setDescription(`**LEVEL ${level} LAYOUT**\n${layout[level - 1].decoration}`)
          .setFooter({
            text: `icecream layout <level>`
          })
          .setImage(layout[level - 1].image);

          return await handleMessage(context, {
            embeds: [embed]
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return await handleMessage(context,
            `<:warning:1366050875243757699> **${name}**, please provide a valid level (1-2) to view the shop's layout, including its image, color, and decoration.\nExample: \`icecream layout 3\``
          ).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      // Command: Exchange
      if (args[0] === "exchange") {
        if (args[1] && !isNaN(args[1]) && Number.isInteger(parseInt(args[1]))) {
          let amount = parseInt(args[1]);

          if (playerShop.loyaltyPoints < amount) {
            return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, your shop doesn't have ✪⁠ ${amount} loyalty points.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          const user = await User.findOne({
            id: userId
          });

          if (!user) {
            return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, your account doesn't exist in Kasiko.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }

          user.cash += amount * 750;
          playerShop.loyaltyPoints -= amount;

          await updateUser(userId, user);
          await playerShop.save();

          return await handleMessage(context, `🍨🎊 **${name}**, you successfully exchanged ✪⁠ ${amount} loyalty points for <:kasiko_coin:1300141236841086977> ${(amount *750).toLocaleString()} cash!`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, please specify a valid integer for the loyalty points to exchange for Kasiko cash.\n\`icecream exchange 10\``).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      // command: leaderboard
      if (args[0] === "leaderboard" || args[0] === "lb") {
        const sortBy = args[1] || "money"; // e.g. "reputation" or "served" or fallback to "money"
        await iceLeaderboard(context, sortBy);
      }

      // Command: Claim daily bonus
      if (args[0] === "daily") {

        const timeElapsed = Date.now() - playerShop.lastVisit;
        if (timeElapsed < 86400000 && playerShop.dailyBonusClaimed) {
          return await handleMessage(context, `🕒 **${name}**, you've already claimed your ice cream shop daily bonus today. Come back tomorrow! 🍯`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }

        const userData = await getUserData(userId);

        const suspenseMessage = await handleMessage(context, "🎁 Claiming your daily bonus... Please wait! 🎉");
        setTimeout(async () => {

          let reward = 100;

          const passInfo = await checkPassValidity(userId);
          let additionalReward;
          if (passInfo.isValid) {
            if (passInfo.passType !== "titan") {
              additionalReward = 25;

              reward += additionalReward;
            }
          }

          playerShop.dailyBonusClaimed = true;
          playerShop.money += reward;
          let loyaltyPointsGained = playerShop.reputation > 150 ? 20 * Math.floor(playerShop.reputation/150): 20;
          playerShop.loyaltyPoints += loyaltyPointsGained;
          playerShop.reputation += 1;
          playerShop.lastVisit = Date.now();
          await playerShop.save();

          const bonusEmbed = new EmbedBuilder()
          .setTitle("🍧 𝐃𝐚𝐢𝐥𝐲 𝐁𝐨𝐧𝐮𝐬 𝐂𝐥𝐚𝐢𝐦𝐞𝐝!")
          .setDescription(`**${name}** 𝗋𝖾𝖼𝖾𝗂𝗏𝖾𝖽 𝗍𝗈𝖽𝖺𝗒'𝗌 𝗋𝖾𝗐𝖺𝗋𝖽, 𝗂𝗇𝖼𝗅𝗎𝖽𝗂𝗇𝗀 **+1 reputation** 𝗉𝗈𝗂𝗇𝗍𝗌! <:celebration:1368113208023318558>\n\n-# 𝘠𝘰𝘶 𝘤𝘢𝘯 𝘤𝘭𝘢𝘪𝘮 ✪ **20 loyalty** 𝘱𝘰𝘪𝘯𝘵𝘴, 𝘱𝘭𝘶𝘴 ***20*** 𝘧𝘰𝘳 𝘦𝘷𝘦𝘳𝘺 ***150*** 𝘳𝘦𝘱𝘶𝘵𝘢𝘵𝘪𝘰𝘯!`)
          .addFields(
            {
              name: "<:creamcash:1309495440030302282> cash", value: `**+${reward}** ${passInfo.isValid && passInfo.passType !== "titan" ? "*(+25 bonus)* ": ""}cash`
            },
            {
              name: "✪⁠ Loyalty Points", value: `**+${loyaltyPointsGained}** Points`
            }
          )
          .setColor(0xefb7b7)
          .setFooter({
            text: "Come back tomorrow for more rewards!"
          });

          return suspenseMessage.edit({
            embeds: [bonusEmbed], content: null
          }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        },
          2000); // Adding suspense with a 2-second delay
      }

      // help
      if (args[0] === "help") {
        return await handleMessage(context, {
          embeds: [helpEmbed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (!args[0] || args[0] === "status" || args[0] === "shop") {
        await playerShopInfo(playerShop, flavors, userId, name, context);
        return;
      }

    } catch (e) {
      console.error(e);
      return await handleMessage(context, `<:warning:1366050875243757699> Something went wrong while executing the ice cream shop command! 🍧🍯`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
};