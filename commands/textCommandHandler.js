import {
  shortHandCommands
} from './shortCommands.js';
import {
  profile
} from './profile.js';
import {
  buyRoses
} from './shop/shop.js';
import Economy from './economy/economy.js';
import Gamble from './gamble/gamble.js';
import {
  Car
} from './shop/cars.js';
import {
  Structure
} from './shop/structures.js';
import {
  leaderboard
} from './leaderboard.js';
import {
  Stock
} from './stocks.js';
import {
  Marriage
} from './marriage.js';
import {
  Ocean
} from './ocean/ocean.js';
import {
  Aqua
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

    "daily": () => Economy.dailylogin(message),

    "give": (args) => isNumber(args[2]) && args[3] && isUserMention(args[3])
    ? Economy.give(message, message.author.id, args[2], extractUserId(args[3])): message.channel.send("⚠️ Invalid cash amount or no user mentioned! Cash amount should be an integer. `Kas .give <amount> <user>`"),

    "guess": () => args[2] && args[3] && isNumber(args[2]) && isNumber(args[3]) ? Gamble.guess(message.author.id, parseInt(args[2]), parseInt(args[3]), message.channel): message.channel.send("⚠️ Invalid cash amount or number! Cash and number should be an integer. `Kas .guess/.g <amount (min 500)> <number (1-10)>`"),
    "tosscoin": () => args[2] && isNumber(args[2]) ? Gamble.toss(message.author.id, parseInt(args[2]), message.channel): message.channel.send("⚠️ Invalid cash amount! Cash amount should be an integer. `Kas .tosscoin/.tc <amount (min 250)>`"),

    "cash": () => sendUserStat("cash"),
    
    "networth": () => sendUserStat("networth"),

    "charity": () => sendUserStat("charity"),

    "trust": () => sendUserStat("trust"),

    //Shop
    "shop": (args) => {
      if (args[2] === "car" || args[2] === "cars") {
        Car.sendPaginatedCars(message)
      }

      if (args[2] === "structure" || args[2] === "building" || args[2] === "house") {
        Structure.sendPaginatedStructures(message);
      }
    },

    "cars": (args) => handleCarCommands(args),

    "structures": (args) => handleStructureCommands(args),

    "buy": (args) => {
      if (args[2] === "car" && args[3]) {
        Car.buycar(message, args[3])
      }

      if (args[2] === "structure" && args[3]) {
        Structure.buystructure(message, args[3])
      }

      if (args[2] === "roses" && args[3] && isNumber(args[3])) {
        buyRoses(parseInt(args[3]), message)
      } else {
        return undefined
      }
    },

    "sell": (args) => {

      if (args[2] === "car" && args[3]) {
        Car.sellcar(message, args[3]);
      }

      if (args[2] === "structure" && args[3]) {
        Structure.sellstructure(message, args[3]);
      } else {
        return undefined;
      }
    },

    // Stocks
    "stock": () => Stock.sendPaginatedStocks(message),

    "stockPrice": (args) => args[2] ? Stock.stockPrice(args[2].toUpperCase(), message): undefined,

    "buyStock": (args) => isNumber(args[3]) ? Stock.buyStock(args[2].toUpperCase(), args[3], message): undefined,

    "sellStock": (args) => isNumber(args[3]) ? Stock.sellStock(args[2].toUpperCase(), args[3], message): undefined,

    "portfolio": (args) => args[2] && isUserMention(args[2])
    ? Stock.portfolio(extractUserId(args[2]), message): Stock.portfolio(message.author.id, message),

    // Ocean Life
    "zone": () => Ocean.listZones(message),
    "explore": () => args[2] ? Ocean.exploreZone(message.author.id, args[2].toLowerCase().trim(), message): message.channel.send("⚠️ Specify a zone to explore."),
    "catch": () => Ocean.collectAnimal(message.author.id, message),
    "collect": () => Aqua.collectAquariumReward(message),
    "collection": () => args[2] && isUserMention(args[2])
    ? Aqua.viewCollection(extractUserId(args[2]), message.channel): Aqua.viewCollection(message.author.id, message.channel),
    "aquarium": () => Aqua.viewAquarium(message.author.id, message.channel),
    "aqua": () => {
      switch (args[2]) {
      case "add":
        if (args[3]) {
          return Aqua.addToAquarium(message.author.id, args[3].toLowerCase(), message.channel);
        } else {
          return message.channel.send("⚠️ Specify an animal to add.");
        }

      case "remove":
        if (args[3]) {
          return Aqua.removeFromAquarium(message.author.id, args[3].toLowerCase(), message.channel);
        } else {
          return message.channel.send("⚠️ Specify an animal to remove.");
        }

      case "sell":
        if (args[3] && isNumber(args[4])) {
          return Aqua.sellAnimals(args[3].toLowerCase(), parseInt(args[4]), message);
        } else {
          return message.channel.send("⚠️ Invalid trade request. Please follow `Kas .aqua sell <fish> <amount>`");
        }

      default:
        return message.channel.send("⚠️ Invalid aquarium command.");
      }
    },
    "feed": () => args[2] && isNumber(args[3]) ? Aqua.feedAnimals(args[2], parseInt(args[3]), message): message.channel.send("⚠️ Specify an <animal> && <amount> of food to feed your animals."),

    // Marriage
    "marry": () => args[2] && isUserMention(args[2]) ? Marriage.marry(extractUserId(args[2]), message): undefined,
    "divorce": () => args[2] && isUserMention(args[2]) ? Marriage.divorce(extractUserId(args[2]), message): undefined,
    "marriage": () => Marriage.marriage(message),
    "roses": () => {
      if (args[2] && isNumber(args[2]) && isUserMention(args[3])) {
        Marriage.sendRoses(extractUserId(args[3]), parseInt(args[2]), message);
      } else {
        Marriage.roses(message);
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

  // Helper functions (soon in helper.js)
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
    if (stat === "cash") {
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** 𝑪𝒂𝒔𝒉.`);
    }
    if (stat === "trust") {
    message.channel.send(`**${message.author.username}** has total **${userData[stat]}** Trust Score.`);
    }
    if (stat === "networth") {
    message.channel.send(`**${message.author.username}** has total <:kasiko_coin:1300141236841086977>**${userData[stat]}** net worth.`);
    }
  }

  function handleCarCommands(args) {
    if (!args[2]) return Car.usercars(message.author.id, message);
    if (isUserMention(args[2])) return Car.usercars(extractUserId(args[2]), message);
    return Car.viewCar(args[2], message);
  }

  function handleStructureCommands(args) {
    if (!args[2]) return Structure.userstructures(message.author.id, message);
    if (isUserMention(args[2])) return Structure.userstructures(extractUserId(args[2]), message);
    return Structure.viewStructure(args[2], message);
  }
}