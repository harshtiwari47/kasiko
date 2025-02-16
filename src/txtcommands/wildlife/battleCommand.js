import User from '../../../models/Hunt.js';
import {
  EmbedBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply();
    }
    return context.editReply(data);
  } else {
    // For normal text-based usage
    return context.channel.send(data);
  }
}

/**
* Command for a 3v3 (or X vs X) animal battle between two players.
* - context: slash or prefix context
* - opponentId: user ID of the opponent (fetched from mention or slash param)
*/
export async function battleCommand(context, {
  opponentId
}) {
  try {
    const userId = context.user?.id || context.author?.id;
    if (!opponentId || opponentId === userId) {
      return handleMessage(context, {
        content: `Please specify a valid opponent to battle.`
      });
    }

    let user = await User.findOne({
      discordId: userId
    });
    let opp = await User.findOne({
      discordId: opponentId
    });

    if (!user || !opp) {
      return handleMessage(context, {
        content: `One of the players does not have a hunting profile yet!`
      });
    }

    // If either has < 1 animal
    if ((user.hunt.animals?.length || 0) < 1 || (opp.hunt.animals?.length || 0) < 1) {
      return handleMessage(context, {
        content: `Both players need at least 1 animal to battle!`
      });
    }

    // Build teams (up to 3 animals each)
    const userTeam = sampleSize(user.hunt.animals, 3);
    const oppTeam = sampleSize(opp.hunt.animals, 3);

    // Perform the battle simulation
    const {
      winner,
      userTeamHp,
      oppTeamHp
    } = simulateBattle(userTeam, oppTeam);

    // 30% chance that the losing team’s animals “die” (are removed)
    let deathOccurred = false;
    if (winner === 'user') {
      // Opponent’s animals might die
      if (Math.random() < 0.3) {
        deathOccurred = true;
        removeAnimals(opp, oppTeam); // Remove them from opponent’s doc
      }
      // Reward user
      grantBattleRewards(user, userTeam);
    } else if (winner === 'opp') {
      // user’s animals might die
      if (Math.random() < 0.3) {
        deathOccurred = true;
        removeAnimals(user, userTeam);
      }
      // Reward opponent
      grantBattleRewards(opp, oppTeam);
    } else {
      // tie => minimal reward or no reward?
    }

    await user.save();
    await opp.save();

    // Build and send embed
    const embed = new EmbedBuilder()
    .setTitle(`Battle Results!`)
    .setColor('Aqua')
    .setDescription([
      `**${user.username}**'s Team HP: \`${userTeamHp}\``,
      `**${opp.username}**'s Team HP: \`${oppTeamHp}\``,
      `**Winner**: ${winner === 'tie' ? 'It was a tie!': winner === 'user' ? user.username: opp.username}`,
      deathOccurred ? `**Death** occurred for the losing team's animals!`: `No death occurred this time.`,
    ].join('\n'));

    return handleMessage(context, {
      embeds: [embed]
    });

  } catch (error) {
    console.error(error);
    return handleMessage(context, {
      content: `**Error**: ${error.message}`
    });
  }
}

/**
* simulateBattle(userTeam, oppTeam)
* A simple random damage formula: each side sums Attack, each "round" deals that to the other side's HP.
* We'll do a simplified approach for illustration.
*/
function simulateBattle(userTeam, oppTeam) {
  // Sum HP and Attack
  let userHp = userTeam.reduce((sum, a) => sum + (a.hp || 50), 0);
  let userAtk = userTeam.reduce((sum, a) => sum + (a.attack || 5), 0);

  let oppHp = oppTeam.reduce((sum, a) => sum + (a.hp || 50), 0);
  let oppAtk = oppTeam.reduce((sum, a) => sum + (a.attack || 5), 0);

  // We simulate a few rounds until one side hits 0 or below
  for (let round = 0; round < 10; round++) {
    oppHp -= randomDamage(userAtk);
    userHp -= randomDamage(oppAtk);

    if (oppHp <= 0 && userHp <= 0) {
      return {
        winner: 'tie',
        userTeamHp: 0,
        oppTeamHp: 0
      };
    } else if (oppHp <= 0) {
      return {
        winner: 'user',
        userTeamHp: userHp,
        oppTeamHp: 0
      };
    } else if (userHp <= 0) {
      return {
        winner: 'opp',
        userTeamHp: 0,
        oppTeamHp: oppHp
      };
    }
  }

  // If after 10 rounds no one drops below 0, we decide by HP
  if (userHp > oppHp) return {
    winner: 'user',
    userTeamHp: userHp,
    oppTeamHp: oppHp
  };
  if (oppHp > userHp) return {
    winner: 'opp',
    userTeamHp: userHp,
    oppTeamHp: oppHp
  };
  return {
    winner: 'tie',
    userTeamHp: userHp,
    oppTeamHp: oppHp
  };
}

function randomDamage(baseAttack) {
  // baseAttack +/- 20% randomness
  const variance = Math.floor(Math.random() * (baseAttack * 0.4)) - (baseAttack * 0.2);
  return Math.max(1, Math.floor(baseAttack + variance));
}

/**
* removeAnimals(user, team)
* Removes the animals in 'team' from the user's user.hunt.animals array.
*/
function removeAnimals(user, team) {
  team.forEach(animal => {
    // find index in user.hunt.animals
    const idx = user.hunt.animals.findIndex(a => a._id.equals(animal._id));
    if (idx !== -1) {
      user.hunt.animals.splice(idx, 1);
    }
  });
}

/**
* grantBattleRewards(user, team)
* Give the winning user random goodies: XP, currency, etc.
*/
function grantBattleRewards(user, team) {
  // 1) Some XP for each surviving animal
  const xpGain = 10;
  team.forEach(a => {
    a.exp += xpGain;
    // Level up if exp >= threshold
    const neededExp = a.level * 25;
    if (a.exp >= neededExp) {
      a.level += 1;
      a.exp = a.exp - neededExp;
      // Optionally scale up HP/Attack
      a.hp += 10;
      a.attack += 2;
    }
  });

  // 2) Currency reward
  const coinGain = 50;
  user.currency += coinGain;

  // 3) 15% chance of random item/weapon
  if (Math.random() < 0.15) {
    // example item
    const newWeapon = 'Mythic Bow';
    user.weapons.push(newWeapon);
  }
}

/**
* Simple helper: pick N random elements from array
*/
function sampleSize(array, n) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}