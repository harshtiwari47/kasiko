import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
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

import {
  getActionButtons
} from './actions.js';

/**
* Starts a battle between two players or a player and a bot.
* @param {Object} interaction - The Discord message object.
* @param {Object} player1 - The initiating player.
* @param {Object} player2 - The opponent player.
* @param {boolean} friendly - Whether the battle is friendly.
*/
export async function battle(interaction, player1, player2, friendly = false) {
  // Initialize battle state
  let battleLog = [];
  let currentPlayer = player1;
  let opponent = player2;
  let battleStarted = false;
  let battleEnded = false;

  player1.specialAbilitiesUsed = 0;
  player2.specialAbilitiesUsed = 0;

  // Define special abilities
  const specialAbilities = ['Double Attack',
    'Heal',
    'Shield'];

  // Function to assign special abilities directly within battle.js
  const assignSpecialAbility = (player) => {
    player.special = specialAbilities[Math.floor(Math.random() * specialAbilities.length)];
  };

  // Assign special abilities to both players
  assignSpecialAbility(player1);
  assignSpecialAbility(player2);

  // Function to generate the top embed
  const embedTop = new EmbedBuilder()
  .setDescription(`## ⚔️ Battle Arena 🏴‍☠️🌊\nAn intense duel between **${player1.name}**'s ***${player1.shipName}*** (Lvl ${player1.shipLvl}) and **${player2.name}**'s ***${player2.shipName}*** (Lvl ${player2.shipLvl})!`)
  .addFields(
    {
      name: '🪝 Special Abilities',
      value: `${player1.name}: **${player1.special}** ✷ ${player2.name}: **${player2.special}**`,
      inline: false,
    })
  .setColor('#698ff1');

  // Function to generate the battle state embed
  const generateEmbed = () => {
    const embed = new EmbedBuilder()
    .setColor(player1.health > player2.health ? 0x68f79b: 0xf83636) // Green if player1 has more health, red otherwise
    .addFields(
      {
        name: '❤️ Health Stat',
        value: `${player1.name}: **${player1.health}** ✷ ${player2.name}: **${player2.health}**`,
        inline: false,
      },
      {
        name: '⏱️ Current Status',
        value: battleStarted ? `**${currentPlayer.name}'s turn!**`: 'The battle is about to start!',
        inline: false,
      },
      {
        name: '⚔️ Action Log',
        value: battleLog.length > 0 ? battleLog.join('\n'): 'Let the fight begin! Each action will appear here in real-time.',
        inline: false,
      },
    )
    .setFooter({
      text: 'Prepare for glory!',
    });

    return embed;
  };

  // Function to simulate an attack
  const attack = (attacker, defender) => {
    const damage = Math.floor(attacker.dmg / 3 + Math.random() * attacker.dmg + (attacker.user === "bot" ? Math.random() * 100: 0)); // Random damage between dmg/3 and dmg*1.33
    defender.health -= damage;
    battleLog.push(`**${attacker.name}** strikes, dealing **${damage}** damage to **${defender.name}**!`);
    if (battleLog.length > 3) {
      battleLog.shift();
    }
    // Limit battle log to the last 5 entries
    if (battleLog.length > 3) {
      battleLog.shift();
    }
  };

  // Function to simulate defense
  const defend = (player) => {
    const shield = Math.floor(player.dmg / 3 + Math.random() * (player.dmg/2)); // Random shield between dmg/2 and dmg*1.5
    player.health += shield;
    battleLog.push(`**${player.name}** defends and gains **${shield}** health!`);
    if (battleLog.length > 3) {
      battleLog.shift();
    }
    // Limit battle log to the last 5 entries
    if (battleLog.length > 3) {
      battleLog.shift();
    }
  };

  // Function to simulate special ability
  const special = (player, opponent) => {
    player.specialAbilitiesUsed += 1;
    switch (player.special) {
      case 'Double Attack':
        attack(player, opponent);
        attack(player, opponent);
        battleLog.push(`**${player.name}** uses **Double Attack**!`);
        break;
      case 'Heal':
        const healAmount = Math.floor(player.dmg * 1.5);
        player.health += healAmount;
        battleLog.push(`**${player.name}** uses **Heal** and recovers **${healAmount}** health!`);
        break;
      case 'Shield':
        const shieldAmount = Math.floor(player.dmg / 2);
        player.health += shieldAmount;
        battleLog.push(`**${player.name}** uses **Shield** and gains **${shieldAmount}** health!`);
        break;
      default:
        attack(player, opponent);
        break;
    }

    // Limit battle log to the last 5 entries
    if (battleLog.length > 3) {
      battleLog.shift();
    }
  };

  // Send the initial battle message
  const battleMessage = await interaction.reply({
    embeds: [embedTop, generateEmbed()],
    components: [getActionButtons(true)],
    fetchReply: true
  });

  // Function to handle the end of the battle
  const endBattle = async (timeUp = false) => {
    if (battleEnded) return;
    battleEnded = true;

    const winner = player1.health > player2.health ? player1: player2;
    const loser = player1.health > player2.health ? player2: player1;

    battleLog.push(`\n🎖️ **${winner.name}** emerges victorious, defeating **${loser.name}** ${timeUp ? "within the 1.3 minutes time limit": ""}!`);

    // Disable all buttons
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(true)],
    });

    // Handle rewards and updates
    await handleRewards(winner, loser, friendly, interaction);
  };

  // finish battle within 1.3 minutes
  setTimeout(async () => await endBattle(true), 90000);

  // Function to handle rewards and updates after battle ends
  const handleRewards = async (winner, loser, friendly, interaction) => {
    const channel = interaction.channel;

    const userData1 = await getUserData(player1.id);
    let userData2 = null;
    let userShips = await Ship.getUserShipsData(player1.id);
    let currentShipIndex = userShips.ships.findIndex(ship => ship.name === player1.shipName);

    let reward = Math.floor(5000 + Math.random() * 10000); // Random reward between 5000 and 10000

    if (friendly) {
      reward = 1000;
    }

    let otherMessage = '';
    if (player2.user !== "bot") {
      userData2 = await getUserData(player2.id);
    }
    
    userData1.shipBattle.lastBattle = Date.now();

    const dateinMillis = Date.now();
    if (userData1.shipBattle.lastBattle) userData1.shipBattle.lastBattle = dateinMillis;

    if (userData2 && player2.user !== "bot" && winner.id === player1.id) {
      userData1.cash += reward;
      userData1.shipBattle.win += 1;
      userData2.shipBattle.lost += 1;
      userData2.cash -= userData2.cash > 1000 ? 1000: userData2.cash;
      userShips.ships[currentShipIndex].durability -= 25;

      if (!userData2.shipBattle.battleLog) userData2.shipBattle.battleLog = [];
      userData2.shipBattle.battleLog.push(`**${player2.name}**, you have lost the defense against **${player1.name}** and lost <:kasiko_coin:1300141236841086977>1000 𝒄𝒂𝒔𝒉 on ${new Date().toLocaleDateString()}.`);
      if (userData2.shipBattle.battleLog.length > 3) {
        userData2.shipBattle.battleLog.shift(); // Remove the oldest log
      }

      otherMessage = `**${player1.name}**, you have won <:kasiko_coin:1300141236841086977>${reward} 𝒄𝒂𝒔𝒉, and your **durability** has **decreased by 25**. Also, **${player2.name}** has lost <:kasiko_coin:1300141236841086977>1000 of their 𝒄𝒂𝒔𝒉.`;

    } else if (userData2 && player2.user !== "bot" && winner.id !== player1.id) {
      userShips.ships[currentShipIndex].durability -= userShips.ships[currentShipIndex].durability > 100 ? 100: userShips.ships[currentShipIndex].durability;
      userData2.cash += userData2.cash > 1000 ? 1000: userData2.cash;
      userData2.shipBattle.win += 1;
      userData1.shipBattle.lost += 1;

      if (!userData2.shipBattle.battleLog) userData2.shipBattle.battleLog = [];
      userData2.shipBattle.battleLog.push(`**${player2.name}**, congratulations! You have successfully defended in battle against **${player1.name}** and won <:kasiko_coin:1300141236841086977>1000 𝒄𝒂𝒔𝒉 on ${new Date().toLocaleDateString()}.`);
      if (userData2.shipBattle.battleLog.length > 3) {
        userData2.shipBattle.battleLog.shift(); // Remove the oldest log
      }

      otherMessage = `**${player1.name}**, you have lost your **100 durability**, and **${player2.name}** has won <:kasiko_coin:1300141236841086977>1000 𝒄𝒂𝒔𝒉.`;

    } else if (winner.id !== player1.id) {
      userData1.shipBattle.lost += 1;
      userShips.ships[currentShipIndex].durability -= userShips.ships[currentShipIndex].durability > 100 ? 100: userShips.ships[currentShipIndex].durability;
      otherMessage = `**${player1.name}**, you have lost **100** durability.`;
    } else {
      userShips.ships[currentShipIndex].durability -= 25;
      userData1.cash += reward;
      userData1.shipBattle.win += 1;
      otherMessage = `**${player1.name}**, you have won <:kasiko_coin:1300141236841086977>${reward} 𝒄𝒂𝒔𝒉 and your **durability has decreased by 25**.`;
    }

    await updateUser(player1.id, userData1);
    await Ship.modifyUserShips(player1.id, userShips);

    if (userData2) await updateUser(player2.id, userData2);

    battleLog.push(otherMessage);
    if (battleLog.length > 3) {
      battleLog.shift();
    }
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(true)],
    });

  };

  // Function to handle player actions via button interactions
  const handlePlayerAction = async (action) => {
    if (action === 'attack') {
      attack(currentPlayer, opponent);
    } else if (action === 'defend') {
      defend(currentPlayer);
    } else if (action === 'special') {
      special(currentPlayer, opponent);
    }

    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(true)], // Disable buttons after action
    });

    // Check for battle end
    if (opponent.health <= 0 || currentPlayer.health <= 0) {
      endBattle();
      return;
    }

    // Swap turns
    [currentPlayer,
      opponent] = [opponent,
      currentPlayer];

    // Update embed and buttons based on the next player
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(currentPlayer.user !== "player", currentPlayer.specialAbilitiesUsed > 1 ? true: false)], // Disable if bot's turn
    });

    // If it's bot's turn, perform bot action after a delay
    if (currentPlayer.user === "bot") {
      setTimeout(botAction, 2000); // 2-second delay
    }
  };

  // Function to handle bot actions
  const botAction = async () => {
    if (battleEnded) return;

    // Simple bot logic: randomly choose an action
    const actions = ['attack',
      'defend',
      'special'];

    if (currentPlayer.specialAbilitiesUsed > 1) {
      actions.pop()
    }

    const action = actions[Math.floor(Math.random() * actions.length)];

    // Execute bot's action
    if (action === 'attack') {
      attack(currentPlayer, opponent);
      battleLog.push(`**${currentPlayer.name}** attacks!`);
    } else if (action === 'defend') {
      defend(currentPlayer);
      battleLog.push(`**${currentPlayer.name}** defends!`);
    } else if (action === 'special') {
      special(currentPlayer, opponent);
      battleLog.push(`**${currentPlayer.name}** uses **${currentPlayer.special}**!`);
    }
    if (battleLog.length > 3) {
      battleLog.shift();
    }

    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(true)],
    });

    // Check for battle end
    if (opponent.health <= 0 || currentPlayer.health <= 0) {
      endBattle();
      return;
    }

    // Swap turns
    [currentPlayer,
      opponent] = [opponent,
      currentPlayer];

    // Update embed and buttons based on the next player
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(currentPlayer.user !== "player", currentPlayer.specialAbilitiesUsed > 1 ? true: false)],
    });

    // If next turn is bot's, perform bot action after a delay
    if (currentPlayer.user === "bot") {
      setTimeout(botAction, 2000); // 2-second delay
    }
  };

  // Function to handle battle interactions
  const handleInteractions = async () => {
    if (battleEnded) return;

    const filter = (i) => i.isButton() && ((i.user.id === player1.id) || (player2 && i.user.id === player2.id));

    try {
      const interactionCollected = await battleMessage.awaitMessageComponent({
        filter,
        componentType: ComponentType.Button,
        time: 10000, // 10 seconds to respond
      });

      const action = interactionCollected.customId;

      // Defer the interaction to acknowledge it
      await interactionCollected.deferUpdate();

      // Handle the player's action
      await handlePlayerAction(action);
    } catch (error) {
      // Handle timeout or errors
      if (battleEnded) return;

      battleLog.push(`**${currentPlayer.name}** did not respond in time and loses **100** health!`);
      currentPlayer.health -= 100;

      await battleMessage.edit({
        embeds: [embedTop, generateEmbed()],
        components: [getActionButtons(true)],
      });

      // Check for battle end
      if (opponent.health <= 0 || currentPlayer.health <= 0) {
        endBattle();
        return;
      }

      // Swap turns
      [currentPlayer,
        opponent] = [opponent,
        currentPlayer];

      // Update embed and buttons based on the next player
      await battleMessage.edit({
        embeds: [embedTop, generateEmbed()],
        components: [getActionButtons(currentPlayer.user !== "player", currentPlayer.specialAbilitiesUsed > 1 ? true: false)],
      });

      // If it's bot's turn, perform bot action after a delay
      if (currentPlayer.user === "bot") {
        setTimeout(botAction, 2000);
      }
    }
  };

  // Start the battle loop
  const startBattleLoop = async () => {
    if (battleStarted) return;
    battleStarted = true;
    battleLog.push(`The battle has started!`);
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(false)],
    });

    // Randomly decide who goes first
    let firstAttack = Math.floor(Math.random() * 2);
    if (firstAttack === 0) {
      [currentPlayer,
        opponent] = [opponent,
        currentPlayer];
    }

    battleLog.push(`**${currentPlayer.name}** will take the first turn!`);
    await battleMessage.edit({
      embeds: [embedTop, generateEmbed()],
      components: [getActionButtons(currentPlayer.user !== "player", currentPlayer.specialAbilitiesUsed > 1 ? true: false)],
    });

    // If bot starts first, perform bot action
    if (currentPlayer.user === "bot") {
      setTimeout(botAction, 2000);
    } else {
      // Await player's action
      await handleInteractions();
    }
  };

  // Initiate the battle
  await startBattleLoop();

  // Continuously handle interactions until battle ends
  while (!battleEnded) {
    if (currentPlayer.user === "player") {
      await handleInteractions();
    } else {
      // Bot actions are handled via setTimeout in botAction
      // No need to await here
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function gatherDetails(username, userId, isPlayer, interaction) {
  try {
    const userData = await getUserData(userId);
    const userShips = await Ship.getUserShipsData(userId);

    if (isPlayer && userData.cash < 1000) {
      return {
        error: true,
        message: "⚠️ You don't have sufficient cash to start a battle (min: 1000)."
      };
    }

    // Time limit between battles (e.g., 10 minutes)
    if (isPlayer) {
      const lastBattleTime = new Date(userData.shipBattle.lastBattle || Date.now() - (1000 * 60 * 60));
      const currentTime = new Date();
      const timeDifferenceInMinutes = Math.floor((currentTime - lastBattleTime) / (1000 * 60));

      const cooldown = 10; // 10 minutes cooldown

      if (timeDifferenceInMinutes < cooldown) {
        const timeLeft = cooldown - timeDifferenceInMinutes;
        /*   return {
          error: true,
          message: `⚠️ You can come back again for battle after **${timeLeft}** more minute(s).`
        }; */
      }
    }

    if (!isPlayer && userShips.ships.length === 0) {
      return {
        error: true,
        message: "⚠️ Opponent has no ships."
      };
    }

    if (isPlayer && userShips.ships.length === 0) {
      return {
        error: true,
        message: "⚠️ You don't have any ships for battle. Ships can be found while catching fish."
      };
    }

    const activeShip = userShips.ships.find(ship => ship.active);

    if (!activeShip) {
      const noActiveShipMessage = isPlayer
      ? "⚠️ No active ship found in your ship collection. For help, use the command `/help ship` or `help ship`.": "⚠️ Opponent doesn't have any active ships for battle. What's the point of a battle?";
      return {
        error: true,
        message: noActiveShipMessage
      };
    }

    const shipDetails = Ship.shipsData.find(ship => ship.id === activeShip.id);
    if (!shipDetails) {
      return {
        error: true,
        message: `⚠️ No such ship exists in ${isPlayer ? "your": "opponent's"} active ship collection in our database! Battle start failed.`
      };
    }

    if (activeShip.durability < 100 && isPlayer) {
      return {
        error: true,
        message: "⚠️ Your ship is not ready for battle. Minimum durability required: **100**."
      };
    }

    if (isPlayer) {
      userData.cash -= 1000; // Deduct battle cost
      await updateUser(userId, userData);
    }

    return {
      name: username,
      health: activeShip.level * shipDetails.health,
      dmg: activeShip.level * shipDetails.dmg,
      shipName: activeShip.name,
      shipLvl: activeShip.level,
      id: userId,
      user: "player"
    };
  } catch (error) {
    console.error("Error in gatherDetails:", error);
    return {
      error: true,
      message: "⚠️ An error occurred while gathering details. Please try again later."
    };
  }
}

/**
* Initiates the battle between two players or a player and a bot.
* @param {string} opponentId - The opponent's user ID.
* @param {Object} interaction - The Discord interaction object.
*/
export async function startBattle(opponentId, interaction) {
  let opponentPlayer;
  let player;
  let friendly = false;

  const usernamePlayer = interaction.author.username;

  player = await gatherDetails(usernamePlayer, interaction.author.id, true, interaction);

  if (player.error) return interaction.reply(player.message);

  if (!opponentId) {
    // Opponent is a bot
    opponentPlayer = Bot.createRandomPlayer(player);
  } else {
    friendly = true;
    const opponentUser = await interaction.guild.members.fetch(opponentId).then(member => member.user).catch(() => null);

    if (!opponentUser) {
      return interaction.reply("⚠️ Opponent not found.");
    }

    opponentPlayer = await gatherDetails(opponentUser.username, opponentId, false, interaction);
  }

  if (opponentPlayer.error) return interaction.reply(opponentPlayer.message);

  if (!player.name || !opponentPlayer.name) {
    return interaction.reply("⚠️ Battle could not be initiated due to missing player information.");
  }

  // Start the battle
  try {
    return battle(interaction, player, opponentPlayer, friendly);
  } catch (e) {
    console.error(e);
    return interaction.reply("⚠️ Something went wrong during the battle.");
  }
}

export async function battleLog(message) {
  let userData = await getUserData(message.author.id);
  let logs;

  if (userData.shipBattle.battleLog && userData.shipBattle.battleLog.length > 0) {
    logs = "- " + userData.shipBattle.battleLog.join('\n- ');
  }

  let battleEmbed = new EmbedBuilder()
  .setDescription(`ᗷᗩTTᒪE IᑎᗷO᙭ ✉️\n${logs || "No battle logs found! Comeback later ⏳"}`)
  .setColor("#c6daf2")
  .setAuthor({
    name: message.author.username + "'s ship battle logs", iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })

  return message.channel.send({
    embeds: [battleEmbed]
  })
}

export async function battleStats(message) {
  let userData = await getUserData(message.author.id);
  const userShips = await Ship.getUserShipsData(message.author.id);

  let activeShip = userShips.ships.find(ship => ship.active);

  let activeShipDetails = "NO ACTIVE SHIP";
  let stats;

  const lastBattleMillis = userData.shipBattle.lastBattle;
  let battleLastDate;

  if (lastBattleMillis) {
    const now = new Date();
    const lastBattleDate = new Date(lastBattleMillis);

    const isToday = lastBattleDate.toDateString() === now.toDateString();


    if (isToday) {
      battleLastDate = "Today";
    } else {
      const diffInMillis = now - lastBattleDate;
      const diffInDays = Math.floor(diffInMillis / (1000 * 60 * 60 * 24));
      battleLastDate = `${diffInDays} Day${diffInDays === 1 ? "": "s"} Ago`;
    }
  }


  if (activeShip) {
    let shipDetails = Ship.shipsData.find(ship => ship.id === activeShip.id);
    activeShipDetails = `<:${shipDetails.id}:${shipDetails.emoji}> **${activeShip.name}**`;
  }

  if (userData.shipBattle) {
    stats = `⚓ **WIN**: ${userData.shipBattle.win || 0}\n` +
    `😵 **LOST**: ${userData.shipBattle.lost || 0}\n` +
    `⏱️ **LAST BATTLE**: ${battleLastDate || "Not Found"}\n` +
    `🛳️ **ACTIVE SHIP**: ${activeShipDetails}\n`;
  } else {
    stats = `⚓ **WIN**: 0\n` +
    `😵 **LOST**: 0\n` +
    `⏱️ **LAST BATTLE**: ${battleLastDate || "Not Found"}\n`+
    `🛳️ **ACTIVE SHIP**: ${activeShipDetails}\n`;
  }

  let battleEmbed = new EmbedBuilder()
  .setDescription(`## SᕼIᑭ ᗷᗩTTᒪE IᑎᖴO 🧭\n\n${stats || "No battle stats found! Comeback later ⏳"}`)
  .setColor("#c6daf2")
  .setAuthor({
    name: message.author.username + "'s ship battle stats", iconURL: message.author.displayAvatarURL({
      dynamic: true
    })
  })

  return message.channel.send({
    embeds: [battleEmbed]
  })
}