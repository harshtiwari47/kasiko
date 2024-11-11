import {
  Ship
} from '../shipsHandler.js';


function randomPercentageChange(number) {
  // Generate a random percentage between -10% and +10%
  const randomPercentage = (Math.random() * 0.2 - 0.1); // Random between -0.1 and +0.1

  // Calculate the change based on the random percentage
  const change = number * randomPercentage;

  // Return the new number after applying the change
  let newNumber = Math.floor(number + change);
  return newNumber;
}

export function createRandomPlayer(player) {

  const usernames = [
    "stormriderkbot",
    "pixelwarriorkbot",
    "shadowhunterkbot",
    "lunareclipsekbot",
    "novatitankbot",
    "echoknightkbot",
    "crimsonviperkbot",
    "solarflarekbot",
    "nebulaxkbot",
    "silentreaperkbot",
    "phoenixstrikekbot",
    "ironcladkbot",
    "gladiatorxkbot",
    "thunderwolfkbot",
    "mysticknightkbot",
    "silverfangkbot",
    "darkphoenixkbot",
    "vortexmasterkbot",
    "ghostriderkbot",
    "frosttitankbot",
    "alphawolfkbot",
    "shadowdragonkbot",
    "moonlightwolfkbot",
    "steelvanguardkbot",
    "blazephoenixkbot",
    "electricacekbot",
    "stormchaserkbot",
    "wraithknightkbot",
    "radiantflarekbot",
    "ironsoulkbot",
    "omegabladekbot",
    "darkstormkbot",
    "crystalshardkbot",
    "emberphoenixkbot",
    "viperkingkbot",
    "moonshadowkbot",
    "fireeaglekbot",
    "stormbreakerkbot",
    "frozenshadowkbot",
    "infernoknightkbot",
    "titanfurykbot",
    "spectraldragonkbot",
    "rogueacekbot",
    "phantomwardenkbot",
    "lunarrangerkbot",
    "mysticfalconkbot",
    "abysswalkerkbot",
    "chaosknightkbot",
    "thunderstrikexkbot",
    "venomouslionkbot"
  ];

  let shipDetails = Ship.shipsData.find(ship => ship.health * player.shipLvl < player.health + Math.floor(Math.random() * 100) && ship.health * player.shipLvl > player.health - Math.floor(Math.random() * 100));
  let randomDmg  = Math.floor(Math.random() * 100);
  
  if (!shipDetails) {
    return {
      name: usernames[Math.floor(Math.random() * usernames.length)],
      health: randomPercentageChange(player.health),
      dmg: randomPercentageChange(player.dmg),
      shipName: "KashikoShip",
      shipLvl: player.shipLvl,
      user: "bot"
    }
  } else {
    return {
      name: usernames[Math.floor(Math.random() * usernames.length)],
      health: (shipDetails.health * player.shipLvl) + Math.floor(Math.random() * 50),
      dmg: (shipDetails.dmg * player.shipLvl) + randomDmg,
      shipName: shipDetails.name,
      shipLvl: player.shipLvl,
      user: "bot"
    }
  }
}

export const Bot = {
  createRandomPlayer
}