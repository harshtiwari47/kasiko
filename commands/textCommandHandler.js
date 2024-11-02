import {
  profile
} from './profile.js';
import {
  toss
} from './toss.js';
import {
  guess
} from './guess.js';
import {
  dailylogin
} from './dailylogin.js';
import {
  give
} from './give.js';
import {
  sendPaginatedCars,
  viewCar,
  usercars,
  buycar,
  sellcar
} from './cars.js';
import {
  leaderboard
} from './leaderboard.js';
import {
  sendPaginatedStocks,
  stockPrice,
  buyStock,
  sellStock,
  portfolio
} from './stocks.js';

import {
  listZones,
  exploreZone,
  collectAnimal
} from './ocean/ocean.js';
import {
  viewCollection,
  viewAquarium,
  addToAquarium,
  removeFromAquarium,
  feedAnimals,
  sellAnimals,
  collectAquariumReward
} from './ocean/aquarium.js';


import {
  getUserData,
  updateUser
} from '../database.js';

export default async function textCommands(message) {
  let textMessage = message.content.toLowerCase().trim();
  let args = textMessage.split(" ");

  // Check if the message is a command
  if (!textMessage.startsWith("kas") || !args[1] || !args[1].trim().startsWith(".")) return;

  // a map of commands and their corresponding functions
  const commands = {
    "profile": (args) => args[2] && isUserMention(args[2])
    ? profile(extractUserId(args[2]), message.channel): profile(message.author.id, message.channel),

    "p": (args) => args[2] && isUserMention(args[2])
    ? profile(extractUserId(args[2]), message.channel): profile(message.author.id, message.channel),

    "leaderboard": () => leaderboard(message),
    "lb": () => leaderboard(message),

    "daily": () => dailylogin(message.author.id, message.channel),
    "dr": () => dailylogin(message.author.id, message.channel),

    "give": (args) => isNumber(args[2]) && args[3] && isUserMention(args[3])
    ? give(message, message.author.id, args[2], extractUserId(args[3])): message.channel.send("⚠️ Invalid cash amount! Cash amount should be an integer."),

    "cash": () => sendUserStat("cash"),
    "c": () => sendUserStat("cash"),

    "charity": () => sendUserStat("charity"),
    "chty": () => sendUserStat("charity"),

    "trust": () => sendUserStat("trust"),
    "ts": () => sendUserStat("trust"),

    //Shop
    "shop": (args) => args[2] === "car" ? sendPaginatedCars(message): undefined,
    "shp": (args) => args[2] === "car" ? sendPaginatedCars(message): undefined,

    "cars": (args) => handleCarCommands(args),
    "car": (args) => handleCarCommands(args),
    "cr": (args) => handleCarCommands(args),

    "buy": (args) => args[2] === "car" && args[3] ? buycar(message, args[3]): undefined,
    "by": (args) => args[2] === "car" && args[3] ? buycar(message, args[3]): undefined,

    "sell": (args) => args[2] === "car" && args[3] ? sellcar(message, args[3]): undefined,
    "sl": (args) => args[2] === "car" && args[3] ? sellcar(message, args[3]): undefined,


    // Stocks
    "stock": () => sendPaginatedStocks(message),
    "s": () => sendPaginatedStocks(message),

    "stockprice": (args) => args[2] ? stockPrice(args[2].toUpperCase(), message): undefined,
    "sp": (args) => args[2] ? stockPrice(args[2].toUpperCase(), message): undefined,

    "buystock": (args) => isNumber(args[3]) ? buyStock(args[2].toUpperCase(), args[3], message): undefined,
    "bs": (args) => isNumber(args[3]) ? buyStock(args[2].toUpperCase(), args[3], message): undefined,

    "sellstock": (args) => isNumber(args[3]) ? sellStock(args[2].toUpperCase(), args[3], message): undefined,
    "ss": (args) => isNumber(args[3]) ? sellStock(args[2].toUpperCase(), args[3], message): undefined,

    "portfolio": (args) => args[2] && isUserMention(args[2])
    ? portfolio(extractUserId(args[2]), message): portfolio(message.author.id, message),

    "sport": (args) => args[2] && isUserMention(args[2])
    ? portfolio(extractUserId(args[2]), message): portfolio(message.author.id, message),

    // Ocean Life
    "zone": () => listZones(message),
    "explore": () => args[2] ? exploreZone(message.author.id, args[2].toLowerCase().trim(), message): message.channel.send("⚠️ Specify a zone to explore."),
    "catch": () => collectAnimal(message.author.id, message),
    "collect": () => collectAquariumReward(message),
    "collection": () => args[2] && isUserMention(args[2])
    ? viewCollection(extractUserId(args[2]), message.channel): viewCollection(message.author.id, message.channel),
    "aquarium": () => viewAquarium(message.author.id, message.channel),
    "aqua": () => {
      switch (args[2]) {
      case "add":
        if (args[3]) {
          return addToAquarium(message.author.id, args[3].toLowerCase(), message.channel);
        } else {
          return message.channel.send("⚠️ Specify an animal to add.");
        }

      case "remove":
        if (args[3]) {
          return removeFromAquarium(message.author.id, args[3].toLowerCase(), message.channel);
        } else {
          return message.channel.send("⚠️ Specify an animal to remove.");
        }

      case "sell":
        if (args[3] && isNumber(args[4])) {
          return sellAnimals(args[3].toLowerCase(), parseInt(args[4]), message);
        } else {
          return message.channel.send("⚠️ Invalid trade request. Please follow `Kas .aqua sell <fish> <amount>`");
        }

      default:
        return message.channel.send("⚠️ Invalid aquarium command.");
      }
    },
    "feed": () => args[2] && isNumber(args[3]) ? feedAnimals(args[2], parseInt(args[3]), message): message.channel.send("⚠️ Specify an <animal> && <amount> of food to feed your animals."),
  };

  // Execute the command if it exists in the map
  const command = commands[args[1].replace(".", "")];
  if (command) return await command(args);

  // Helper functions
  function isUserMention(arg) {
    return arg.startsWith("<@") && arg.endsWith(">");
  }

  function extractUserId(mention) {
    return mention.replace(/[^0-9]+/g, '');
  }

  function isNumber(value) {
    return !isNaN(value) && Number.isInteger(Number(value));
  }

  function sendUserStat(stat) {
    const userData = getUserData(message.author.id);
    message.channel.send(`**@${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** 𝑪𝒂𝒔𝒉.`);
  }

  function handleCarCommands(args) {
    if (!args[2]) return usercars(message.author.id, message);
    if (isUserMention(args[2])) return usercars(extractUserId(args[2]), message);
    return viewCar(args[2], message);
  }
}