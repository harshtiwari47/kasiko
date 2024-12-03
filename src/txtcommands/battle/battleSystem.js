import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  Ship
} from './shipsHandler.js';

import {
  Bot
} from './req/botPlayer.js';

export async function battle(message, player1, player2, friendly = false) {
  // Initializing battle state
  let battleLog = [];
  let currentPlayer = player1;
  let opponent = player2;
  let battleStarted = false;

  // Function to generate embed message

  const embedTop = new EmbedBuilder()
  .setTitle('⚔️ Battle Arena 🏴‍☠️⚓')
  .setDescription(`An intense duel between **${player1.name}**'s \`${player1.shipName} (${player1.shipLvl})\` and **${player2.name}**'s \`${player2.shipName}(${player2.shipLvl})\`!`)
  .setColor(`#65b6df`);

  const generateEmbed = () => {
    const embed = new EmbedBuilder()
    .setColor(player1.health > player2.health ? 0x68f79b: 0xf83636) // Change color based on player1's health (winner will be in green)
    .addFields(
      {
        name: '🏥 Health Stat', value: `${player1.name}: **${player1.health}** ✷ ${player2.name}: **${player2.health}**`, inline: false
      },
      {
        name: '⏱️ Current Status', value: battleStarted ? `**${currentPlayer.name}'s turn!**`: 'The battle is about to start!', inline: false
      },
      {
        name: '⚔️ Action Log', value: battleLog.length > 0 ? battleLog.join('\n'): 'Let the fight begin! Each action will appear here in real-time.', inline: false
      }
    )
    .setFooter({
      text: 'Prepare for glory!'
    });

    return embed;
  };

  // Function to simulate a player's attack
  const attack = (attacker, defender) => {
    const damage = Math.floor((attacker.dmg/3) + Math.random() * attacker.dmg); // Random damage
    defender.health -= damage;
    battleLog.push(`**${attacker.name}** strikes, dealing ${damage} damage to **${defender.name}**!`);

    // Limit battle log to the last 5 entries
    if (battleLog.length > 3) {
      battleLog.shift(); // Remove the oldest log
    }
  };

  // Start the battle
  const channel = message.channel;

  const battleMessage = await channel.send({
    embeds: [embedTop, generateEmbed()]
  });

  // Battle loop - we will simulate the battle for 10 turns (or until one player loses all health)
  let turnCount = 0;

  while (player1.health > 0 && player2.health > 0 && turnCount < 10) {
    if (!battleStarted) {
      battleStarted = true;
      battleLog.push(`The battle has started!`);
      await battleMessage.edit({
        embeds: [embedTop, generateEmbed()]
      });

      let firstAttack = Math.floor(Math.random() * 2);
      if (firstAttack === 0) {
        [currentPlayer,
          opponent] = [opponent,
          currentPlayer];
      }

      turnCount++;
    }

    // Perform the attack
    attack(currentPlayer, opponent);

    // Swap players after each turn
    [currentPlayer,
      opponent] = [opponent,
      currentPlayer];

    // Update the embed with the latest action
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()]
    });

    // Check if someone is defeated
    if (player1.health <= 0 || player2.health <= 0) {
      break;
    }

    // Delay for a moment before the next action (simulate turn duration)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds per turn
    turnCount++;
  }

  // End of battle, display result
  const winner = player1.health > player2.health ? player1: player2;
  const loser = player1.health > player2.health ? player2: player1;

  const userData1 = await getUserData(player1.id);
  let userData2 = ``;
  let userShips = await Ship.getUserShipsData(player1.id);
  let currentShipIndex = userShips.ships.findIndex(ship => ship.name === player1.shipName);

  let reward = Number(5000 + Math.floor(Math.random() * 5000));

  if (friendly) {
    reward = 1000;
  }

  let otherMessage = ``;
  if (player2.user === "bot") {} else {
    userData2 = await getUserData(player2.id);
  }

  const date = new Date().toLocaleDateString();
  const dateinMillis = Date.now();

  userData1.lastBattle = dateinMillis;

  if (userData2 && player2.user !== "bot" && winner.id === player1.id) {
    userData1.cash += reward;
    userData2.cash -= userData2.cash > 1000 ? 1000: userData2.cash;
    userShips.ships[currentShipIndex].durability -= 25;

    if (!userData2.battleLog) userData2.battleLog = [];
    userData2.battleLog.push(`**${player2.name}**, you have lost the defense against **${player1.name}** and lost <:coin:1304675604171460728>1000 𝒄𝒂𝒔𝒉 on ${date}.`);
    if (userData2.battleLog.length > 5) {
      userData2.battleLog.shift(); // Remove the oldest log
    }

    otherMessage = `**${player1.name}**, you have won <:coin:1304675604171460728>${reward} 𝒄𝒂𝒔𝒉, and your **durability** has **decreased by 25**. Also, **${player2.name}** has lost <:coin:1304675604171460728>1000 of their 𝒄𝒂𝒔𝒉.`;

  } else if (userData2 && player2.user !== "bot" && winner.id !== player1.id) {
    userShips.ships[currentShipIndex].durability -= userShips.ships[currentShipIndex].durability > 100 ? 100: userShips.ships[currentShipIndex].durability;
    userData2.cash += userData2.cash > 1000 ? 1000: userData2.cash;

    if (!userData2.battleLog) userData2.battleLog = [];
    userData2.battleLog.push(`**${player2.name}**, congratulations! You have successfully defended in battle against **${player1.name}** and won <:coin:1304675604171460728>1000 𝒄𝒂𝒔𝒉 on ${date}.`);
    if (userData2.battleLog.length > 5) {
      userData2.battleLog.shift(); // Remove the oldest log
    }

    otherMessage = `**${player1.name}**, you have lost your **100 durability**, and **${player2.name}** has won <:coin:1304675604171460728>1000 𝒄𝒂𝒔𝒉.`;
    // if other player is bot
  } else if (winner.id !== player1.id) {
    userShips.ships[currentShipIndex].durability -= userShips.ships[currentShipIndex].durability > 100 ? 100: userShips.ships[currentShipIndex].durability;
    otherMessage = `**${player1.name}**, you have lost **100** durability.`;
  } else {
    userShips.ships[currentShipIndex].durability -= 25;
    userData1.cash += reward;
    otherMessage = `**${player1.name}**, you have won <:coin:1304675604171460728>${reward} 𝒄𝒂𝒔𝒉 and your **durability has decreased by 25**.`;
  }

  await updateUser(player1.id, userData1);
  await Ship.modifyUserShips(player1.id, userShips);

  if (userData2) await updateUser(player2.id, userData2);

  battleLog.push(`\n\n🎖️ **${winner.name}** emerges victorious, defeating **${loser.name}** with ${winner.health} health left. ${otherMessage}`);
  await battleMessage.edit({
    embeds: [embedTop, generateEmbed()]
  });
}

function gatherDetails(username, userId, isPlayer = false, message) {
  return new Promise(async (resolve) => {
    try {
      const userData = await getUserData(userId);
      const userShips = await Ship.getUserShipsData(userId);

      if (isPlayer && userData.cash < 1000) {
        return resolve( {
          error: true, message: "⚠️ You don't have sufficient cash to start a battle (min: 1000)."
        });
      }

      if (isPlayer) {
        const lastBattleTime = new Date(userData.lastBattle || Date.now() - (1000 * 60 * 60));
        const currentTime = new Date();
        const timeDifferenceInMinutes = (10 - ((currentTime - lastBattleTime) / (1000 * 60))).toFixed(0);

        /* timeLimit   if (timeDifferenceInMinutes > 0) {
          return resolve( {
            error: true, message: `⚠️ You can come back again for battle after ${timeDifferenceInMinutes} minutes.`
          });
        } */
      }

      if (!isPlayer && userShips.ships.length === 0) {
        return resolve( {
          error: true, message: "⚠️ Opponent has no ships."
        });
      }

      if (isPlayer && userShips.ships.length === 0) {
        return resolve( {
          error: true, message: "⚠️ You don't have any ships for battle. Ships can be found while catching fish."
        });
      }

      const activeShip = userShips.ships.find(ship => ship.active);

      if (!activeShip) {
        const noActiveShipMessage = isPlayer
        ? "⚠️ No active ship found in your ship collection. For help, use the command `Kas help battle`.": "⚠️ Opponent doesn't have any active ships for battle. What's the point of a battle?";
        return resolve( {
          error: true, message: noActiveShipMessage
        });
      }

      const shipDetails = await Ship.shipsData.find(ship => ship.id === activeShip.id);

      if (!shipDetails) {
        return resolve( {
          error: true, message: `⚠️ No such ship exists in ${isPlayer ? "your": "opponent"} active ship collection in our database! Battle start failed.`
        });
      }

      if (activeShip.durability < 100 && isPlayer) {
        return resolve( {
          error: true, message: "⚠️ Your ship is not ready for battle. Minimum durability required: 100"
        });
      }

      if (isPlayer) {
        userData.cash -= 1000;
        await updateUser(userId, userData);
      }

      resolve( {
        name: username,
        health: activeShip.level * shipDetails.health,
        dmg: activeShip.level * shipDetails.dmg,
        shipName: activeShip.name,
        shipLvl: activeShip.level,
        id: userId,
        user: "player"
      });
    } catch (error) {
      console.error("Error in gatherDetails:", error);
      resolve( {
        error: true, message: "An error occurred while gathering details. Please try again later."
      });
    }
  });
}

export async function startBattle(opponent, message) {
  let opponentPlayer;
  let player;
  let friendly = false;
  let usernamePlayer = await client.users.fetch(message.author.id) || {
    "username": "unknown"
  }

  player = await gatherDetails(usernamePlayer,
    message.author.id,
    true,
    message);

  if (player.error) return message.channel.send(player.message);

  if (!opponent) {
    opponentPlayer = Bot.createRandomPlayer(player);
  } else {
    friendly = true;
    let usernameOpponent = await client.users.fetch(opponent) || {
      "username": "unknown"
    }
    opponentPlayer = await gatherDetails(usernameOpponent, opponent, false, message);
  }

  if (opponentPlayer.error) return message.channel.send(opponentPlayer.message);

  if (!player.name || !opponentPlayer.name) {
    return
  }

  if (player && opponentPlayer) {
    try {
      return battle(message, player, opponentPlayer, friendly);
    } catch (e) {
      console.error(e);
      return message.channel.send("⚠️ Something went wrong during battle.")
    }
  }
}

export async function battleLog(message) {
  let userData = await getUserData(message.author.id);
  let logs;

  if (userData.battleLog && userData.battleLog.length > 0) {
    logs = "- " + userData.battleLog.join('\n- ');
  }
  return message.channel.send(`ᗷᗩTTᒪE IᑎᗷO᙭ ✉️\n${logs || "No battle logs found! Comeback later ⏳"}`);
}