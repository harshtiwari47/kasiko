import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder
} from "discord.js";

// Global map to keep track of active games per guild
const activeGames = new Map();

/**
* Universal function for sending responses.
* Works for slash commands (with ephemeral responses) or normal text messages.
*/
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err =>
        ![50001, 50013, 10008].includes(err.code) && console.error(err)
      );
    }
    return context.editReply(data).catch(err =>
      ![50001, 50013, 10008].includes(err.code) && console.error(err)
    );
  } else {
    return context.channel.send(data).catch(err =>
      ![50001, 50013, 10008].includes(err.code) && console.error(err)
    );
  }
}

/**
* Helper function to shuffle an array in-place.
*/
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i],
      array[j]] = [array[j],
      array[i]];
  }
  return array;
}

/**
* Starts a new round. In each round, the King (secret role) is prompted to appoint a Minister
* (via !appoint) and then that appointed Minister must guess the Thief (via !guess).
*/
async function runRound(game, context) {
  // Get list of players still in the game.
  const aliveParticipants = Array.from(game.participants.values()).filter(
    (p) => !p.eliminated
  );
  // If only two players remain, move to the final round.
  if (aliveParticipants.length <= 2) {
    await finalRound(game, context);
    return;
  }

  await handleMessage(context, {
    content: `**Round ${game.round}** – ${aliveParticipants.length} players remain.`
  });

  // Find the King (if by chance he was eliminated, default to first alive player)
  let king = aliveParticipants.find((p) => p.role === "King");
  if (!king) king = aliveParticipants[0];

  // Prompt the King to appoint a Minister for this round.
  await handleMessage(context, {
    content: `<@${king.user.id}>, as the King, please appoint a Minister for this round using \`!appoint @player\`.`
  });

  // Wait for the King’s appointment command.
  const appointFilter = (m) =>
  m.author.id === king.user.id &&
  m.content.startsWith("!appoint") &&
  m.mentions.users.size > 0;
  try {
    const appointCollected = await context.channel.awaitMessages({
      filter: appointFilter,
      max: 1,
      time: 120000,
      errors: ["time"]
    });
    const appointMsg = appointCollected.first();
    const appointedUser = appointMsg.mentions.users.first();
    const appointedParticipant = game.participants.get(appointedUser.id);
    if (!appointedParticipant || appointedParticipant.eliminated) {
      await handleMessage(context, {
        content: `Invalid appointment. Please appoint a valid, active player.`
      });
      return runRound(game, context);
    }
    game.currentMinister = appointedParticipant;
    await handleMessage(context, {
      content: `<@${appointedParticipant.user.id}> has been appointed as Minister. Minister, please guess the Thief using \`!guess @player\`.`
    });

    // Wait for the Minister’s guess.
    const guessFilter = (m) =>
    m.author.id === appointedParticipant.user.id &&
    m.content.startsWith("!guess") &&
    m.mentions.users.size > 0;
    const guessCollected = await context.channel.awaitMessages({
      filter: guessFilter,
      max: 1,
      time: 120000,
      errors: ["time"]
    });
    const guessMsg = guessCollected.first();
    const guessedUser = guessMsg.mentions.users.first();
    const guessedParticipant = game.participants.get(guessedUser.id);

    if (!guessedParticipant || guessedParticipant.eliminated) {
      await handleMessage(context, {
        content: `Invalid guess. This round is forfeited.`
      });
    } else {
      // Process the guess
      if (guessedParticipant.role === "Thief") {
        // Correct guess – award bonus and eliminate the Thief.
        appointedParticipant.score += 5000;
        await handleMessage(context, {
          content: `Correct! <@${guessedUser.id}> was the Thief. <@${appointedParticipant.user.id}> earns 5,000 bonus points. The Thief is eliminated.`
        });
        guessedParticipant.eliminated = true;
      } else {
        // Incorrect guess – penalize Minister and reward the wrongly accused.
        appointedParticipant.score -= 1000;
        guessedParticipant.score += 5000;
        await handleMessage(context, {
          content: `Incorrect! <@${guessedUser.id}> is not the Thief. They gain 5,000 points, and <@${appointedParticipant.user.id}> loses 1,000 points.`
        });
      }
    }
  } catch (err) {
    await handleMessage(context, {
      content: `No valid appointment or guess was received in time. Skipping this round.`
    });
  }
  game.round++;
  // Continue with the next round.
  runRound(game, context);
}

/**
* Handles the final round when only two players remain.
*/
async function finalRound(game, context) {
  await handleMessage(context, {
    content: `Final Round! Only two players remain.`
  });
  const aliveParticipants = Array.from(game.participants.values()).filter(
    (p) => !p.eliminated
  );
  let king = aliveParticipants.find((p) => p.role === "King");
  if (!king) king = aliveParticipants[0];
  await handleMessage(context, {
    content: `<@${king.user.id}>, as the King, please appoint the final Minister using \`!appoint @player\`.`
  });

  try {
    const appointFilter = (m) =>
    m.author.id === king.user.id &&
    m.content.startsWith("!appoint") &&
    m.mentions.users.size > 0;
    const appointCollected = await context.channel.awaitMessages({
      filter: appointFilter,
      max: 1,
      time: 120000,
      errors: ["time"]
    });
    const appointMsg = appointCollected.first();
    const appointedUser = appointMsg.mentions.users.first();
    const appointedParticipant = game.participants.get(appointedUser.id);
    if (!appointedParticipant || appointedParticipant.eliminated) {
      await handleMessage(context, {
        content: `Invalid appointment.`
      });
      return finalRound(game, context);
    }
    game.currentMinister = appointedParticipant;
    await handleMessage(context, {
      content: `<@${appointedParticipant.user.id}> has been appointed as Minister. For the final guess, please use \`!guess @player\`.`
    });
    const guessFilter = (m) =>
    m.author.id === appointedParticipant.user.id &&
    m.content.startsWith("!guess") &&
    m.mentions.users.size > 0;
    const guessCollected = await context.channel.awaitMessages({
      filter: guessFilter,
      max: 1,
      time: 120000,
      errors: ["time"]
    });
    const guessMsg = guessCollected.first();
    const guessedUser = guessMsg.mentions.users.first();
    const guessedParticipant = game.participants.get(guessedUser.id);

    if (!guessedParticipant || guessedParticipant.eliminated) {
      await handleMessage(context, {
        content: `Invalid guess.`
      });
    } else {
      if (guessedParticipant.role === "Thief") {
        appointedParticipant.score += 5000;
        await handleMessage(context, {
          content: `Final guess correct! <@${guessedUser.id}> was the Thief. <@${appointedParticipant.user.id}> earns 5,000 bonus points.`
        });
      } else {
        appointedParticipant.score -= 1000;
        guessedParticipant.score += 5000;
        await handleMessage(context, {
          content: `Final guess incorrect! <@${guessedUser.id}> is not the Thief. They gain 5,000 points and <@${appointedParticipant.user.id}> loses 1,000 points.`
        });
      }
    }
  } catch (err) {
    await handleMessage(context, {
      content: `Final round timed out.`
    });
  }
  // Game over: display the final leaderboard.
  displayLeaderboard(game, context);
  activeGames.delete(game.guildId);
}

/**
* Displays the final leaderboard (all players sorted by score).
*/
async function displayLeaderboard(game, context) {
  const allParticipants = Array.from(game.participants.values());
  // Sort participants by descending score.
  const sorted = allParticipants.sort((a, b) => b.score - a.score);
  let description = "";
  sorted.forEach((p, index) => {
    description += `${index + 1}. ${p.user.tag} – ${p.score} points${
    p.eliminated ? " (Eliminated)": ""
    }\n`;
  });
  const embed = new EmbedBuilder()
  .setTitle("Leaderboard")
  .setDescription(description)
  .setColor(0xffd700);
  await handleMessage(context, {
    embeds: [embed]
  });
}

/**
* Called when the minimum players have joined and the starter clicks START.
* It stops join collection, assigns secret roles, sends each player their role via DM,
* and then kicks off the first round.
*/
async function startGame(game, context) {
  // Remove join buttons from the original join message.
  try {
    await game.joinMessage.edit({
      components: []
    });
  } catch (err) {
    console.error(err);
  }
  // Create an array of participant objects.
  const participantsArray = Array.from(game.participants.values());
  // Define the roles based on total players (4 core roles + optional roles).
  let roles = [];
  switch (participantsArray.length) {
    case 4:
      roles = ["King",
        "Minister",
        "Thief",
        "Protector"];
      break;
    case 5:
      roles = ["King",
        "Minister",
        "Thief",
        "Protector",
        "Inspector"];
      break;
    case 6:
      roles = ["King",
        "Minister",
        "Thief",
        "Protector",
        "Inspector",
        "Double Agent"];
      break;
    case 7:
      roles = ["King",
        "Minister",
        "Thief",
        "Protector",
        "Inspector",
        "Double Agent",
        "Rebel"];
      break;
    case 8:
      roles = [
        "King",
        "Minister",
        "Thief",
        "Protector",
        "Inspector",
        "Double Agent",
        "Rebel",
        "Spy"
      ];
      break;
    default:
      roles = ["King",
        "Minister",
        "Thief",
        "Protector"];
      break;
  }
  // Shuffle the roles and assign them to the participants.
  roles = shuffleArray(roles);
  for (let i = 0; i < participantsArray.length; i++) {
    const participant = participantsArray[i];
    participant.role = roles[i];
    // The King gets an initial 10,000 points.
    if (roles[i] === "King") {
      participant.score = 10000;
    }
    // Send each player their secret role via DM.
    try {
      await participant.user.send(`Your secret role in Kingdom Heist: **${participant.role}**`);
    } catch (err) {
      console.error(`Could not DM ${participant.user.tag}.`);
    }
  }
  await handleMessage(context, {
    content: "Roles have been assigned! Let the game begin!"
  });
  // Start the first round.
  runRound(game, context);
}

/**
* The exported command object.
*/
export default {
  name: "heist",
  description:
  "Join the Kingdom Heist game! Up to 8 players join via the PARTICIPATE button. When the starter (only one game per server) clicks START (minimum 4 players required), secret roles (King, Minister, Thief, Protector, and optional roles) are assigned. Then the King appoints a Minister each round via `!appoint @player` and that Minister must guess the Thief using `!guess @player`. Points are awarded/deducted accordingly. The game ends when only two players remain, and the final leaderboard is displayed.",
  aliases: [],
  args: "",
  example: ["heist"],
  emoji: "👑",
  category: "🎲 Games",
  cooldown: 10000,
  execute: async (args, message) => {
    // Check if a game is already running in this server.
    if (activeGames.has(message.guild.id)) {
      return handleMessage(message, {
        content: "A game is already in progress in this server."
      });
    }

    // Create a new game object.
    const game = {
      guildId: message.guild.id,
      channel: message.channel,
      starter: message.author,
      participants: new Map(),
      // key: userId, value: { user, role, score, eliminated }
      joinMessage: null,
      currentMinister: null,
      round: 1
    };

    // Add the game starter as the first participant.
    game.participants.set(message.author.id, {
      user: message.author,
      role: null,
      score: 0,
      eliminated: false
    });

    // Build the initial embed with a short story.
    const embed = new EmbedBuilder()
    .setTitle("Kingdom Heist")
    .setDescription(
      "A daring robbery has struck the Kingdom! Brave souls are called to join the quest to catch the elusive Thief. Click **PARTICIPATE** to join the game. (Minimum 4 players required; game will cancel after 10 minutes if not met.)"
    )
    .setColor(0x00ae86)
    .setFooter({
      text: `Players joined: ${game.participants.size}`
    });

    // Create the PARTICIPATE and START buttons.
    const participateButton = new ButtonBuilder()
    .setCustomId("participate")
    .setLabel("PARTICIPATE")
    .setStyle(ButtonStyle.Primary);
    const startButton = new ButtonBuilder()
    .setCustomId("start_game")
    .setLabel("START")
    .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(participateButton, startButton);

    // Send the join message.
    const joinMsg = await handleMessage(message, {
      embeds: [embed],
      components: [row]
    });
    game.joinMessage = joinMsg;
    activeGames.set(message.guild.id, game);

    // Create a component collector for the join message.
    const filter = (i) =>
    i.customId === "participate" || i.customId === "start_game";
    const collector = joinMsg.createMessageComponentCollector({
      filter,
      time: 600000 // 10 minutes
    });

    collector.on("collect", async (i) => {
      if (i.customId === "participate") {
        // Add the user if not already joined.
        if (game.participants.has(i.user.id)) {
          await i.reply({
            content: "You have already joined the game.", ephemeral: true
          });
        } else if (game.participants.size >= 8) {
          await i.reply({
            content: "Game is full (max 8 players).", ephemeral: true
          });
        } else {
          game.participants.set(i.user.id, {
            user: i.user,
            role: null,
            score: 0,
            eliminated: false
          });
          await i.reply({
            content: `You have joined the game! (${game.participants.size}/8)`,
            ephemeral: true
          });
          // Update the join embed footer.
          const updatedEmbed = EmbedBuilder.from(embed).setFooter({
            text: `Players joined: ${game.participants.size}`
          });
          await joinMsg.edit({
            embeds: [updatedEmbed]
          });
        }
      } else if (i.customId === "start_game") {
        // Only the game starter can start the game.
        if (i.user.id !== game.starter.id) {
          await i.reply({
            content: "Only the game starter can start the game.", ephemeral: true
          });
          return;
        }
        if (game.participants.size < 4) {
          await i.reply({
            content: "At least 4 players are required to start the game.", ephemeral: true
          });
          return;
        }
        collector.stop("game_started");
        // Start the game.
        startGame(game, message);
      }
    });

    collector.on("end",
      async (collected, reason) => {
        try {
          if (reason !== "game_started") {
            if (game.participants.size < 4) {
              await handleMessage(message, {
                content: "Game canceled due to insufficient players."
              });
              activeGames.delete(game.guildId);
            }
          }
        } catch (e) {}
      });
  }
};