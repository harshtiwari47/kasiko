import {
  shortHandCommands
} from './shortCommands.js';
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
  buyRoses
} from './shop/shop.js';
import {
  sendPaginatedCars,
  viewCar,
  usercars,
  buycar,
  sellcar
} from './shop/cars.js';
import {
  sendPaginatedStructures,
  viewStructure,
  userstructures,
  buystructure,
  sellstructure
} from './shop/structures.js';
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
  marriage,
  marry,
  divorce,
  roses,
  sendRoses
} from './marriage.js';

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

    "leaderboard": () => leaderboard(message),

    "daily": () => dailylogin(message),

    "give": (args) => isNumber(args[2]) && args[3] && isUserMention(args[3])
    ? give(message, message.author.id, args[2], extractUserId(args[3])): message.channel.send("⚠️ Invalid cash amount or no user mentioned! Cash amount should be an integer. `Kas .give <amount> <user>`"),

    "guess": () => args[2] && args[3] && isNumber(args[2]) && isNumber(args[3]) ? guess(message.author.id, parseInt(args[2]), parseInt(args[3]), message.channel): message.channel.send("⚠️ Invalid cash amount or number! Cash and number should be an integer. `Kas .guess/.g <amount (min 500)> <number (1-10)>`"),
    "tosscoin": () => args[2] && isNumber(args[2]) ? toss(message.author.id, parseInt(args[2]), message.channel): message.channel.send("⚠️ Invalid cash amount! Cash amount should be an integer. `Kas .tosscoin/.tc <amount (min 250)>`"),

    "cash": () => sendUserStat("cash"),

    "charity": () => sendUserStat("charity"),

    "trust": () => sendUserStat("trust"),

    //Shop
    "shop": (args) => {
      if (args[2] === "car") {
        sendPaginatedCars(message)
      }

      if (args[2] === "structure" || args[2] === "building" || args[2] === "house") {
        sendPaginatedStructures(message);
      }
    },

    "cars": (args) => handleCarCommands(args),

    "structures": (args) => handleStructureCommands(args),

    "buy": (args) => {
      if (args[2] === "car" && args[3]) {
        buycar(message, args[3])
      }

      if (args[2] === "structure" && args[3]) {
        buystructure(message, args[3])
      }

      if (args[2] === "roses" && args[3] && isNumber(args[3])) {
        buyRoses(parseInt(args[3]), message)
      } else {
        return undefined
      }
    },

    "sell": (args) => {

      if (args[2] === "car" && args[3]) {
        sellcar(message, args[3]);
      }
      
      if (args[2] === "structure" && args[3]) {
        sellstructure(message, args[3]);
      } else {
        return undefined;
      }
    },

    // Stocks
    "stock": () => sendPaginatedStocks(message),

    "stockprice": (args) => args[2] ? stockPrice(args[2].toUpperCase(), message): undefined,

    "buystock": (args) => isNumber(args[3]) ? buyStock(args[2].toUpperCase(), args[3], message): undefined,

    "sellstock": (args) => isNumber(args[3]) ? sellStock(args[2].toUpperCase(), args[3], message): undefined,

    "portfolio": (args) => args[2] && isUserMention(args[2])
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

    // marriage
    "marry": () => args[2] && isUserMention(args[2]) ? marry(extractUserId(args[2]), message): undefined,
    "divorce": () => args[2] && isUserMention(args[2]) ? divorce(extractUserId(args[2]), message): undefined,
    "marriage": () => marriage(message),
    "roses": () => {
      if (args[2] && isNumber(args[2]) && isUserMention(args[3])) {
        sendRoses(extractUserId(args[3]), parseInt(args[2]), message);
      } else {
        roses(message);
      }
    },
  };

  // Execute the command if it exists in the map
  const command = commands[args[1].replace(".", "")];
  if (command) return await command(args);
  if (!command) {
    let commandName = null;
    let commandRequested = args[1].replace(".", "").trim();
    for (let i = 0; i < shortHandCommands.length; i++) {

      shortHandCommands[i].alias.forEach(alias => {
        if (alias === commandRequested) {
          commandName = shortHandCommands[i].command;
        }
      });

      if (commandName) {
        const shortCommand = commands[commandName];
        if (shortCommand) return await shortCommand(args);
      }
    }
  }

  // Helper functions
  function isUserMention(arg) {
    return arg.startsWith("<@") && arg.endsWith(">");
  }

  function extractUserId(mention) {
    return mention.replace(/[^0-9]+/g,
      '');
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

  function handleStructureCommands(args) {
    if (!args[2]) return userstructures(message.author.id, message);
    if (isUserMention(args[2])) return userstructures(extractUserId(args[2]), message);
    return viewStructure(args[2], message);
  }
}