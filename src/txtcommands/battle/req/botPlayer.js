import {
  Ship
} from '../shipsHandler.js';

/**
* Generates a random percentage change between -10% and +10%.
* @param {number} number - The original number.
* @returns {number} - The number after applying the random change.
*/
function randomPercentageChange(number) {
  const randomPercentage = Math.random() * 0.2 - 0.1; // Between -10% and +10%
  const change = number * randomPercentage;
  return Math.floor(number + change);
}

/**
* Assigns a random special ability to a ship.
* @returns {string} - The special ability.
*/
function assignSpecialAbility() {
  const abilities = ['Double Attack',
    'Heal',
    'Shield'];
  return abilities[Math.floor(Math.random() * abilities.length)];
}

/**
* Creates a random bot player based on the provided player.
* @param {Object} player - The player object.
* @returns {Object} - The bot player object.
*/
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

  let shipDetails = Ship.shipsData.find(ship =>
    ship.health * player.shipLvl < player.health + Math.floor(Math.random() * 100) &&
    ship.health * player.shipLvl > player.health - Math.floor(Math.random() * 100)
  );
  let randomDmg = Math.floor(Math.random() * 50);

  if (!shipDetails) {
    return {
      name: usernames[Math.floor(Math.random() * usernames.length)],
      health: randomPercentageChange(player.health),
      dmg: randomPercentageChange(player.dmg),
      shipName: "KashikoShip",
      shipLvl: player.shipLvl,
      user: "bot",
      special: assignSpecialAbility(),
    };
  } else {
    return {
      name: usernames[Math.floor(Math.random() * usernames.length)],
      health: (shipDetails.health * player.shipLvl) + Math.floor(Math.random() * 50),
      dmg: (shipDetails.dmg * player.shipLvl) + randomDmg,
      shipName: shipDetails.name,
      shipLvl: player.shipLvl,
      user: "bot",
      special: assignSpecialAbility(),
      emoji: `<:${shipDetails.id}:${shipDetails.emoji}>`
    };
  }
}

export const Bot = {
  createRandomPlayer
};