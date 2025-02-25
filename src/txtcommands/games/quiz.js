import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} from 'discord.js';

import path from 'path';
import {
  fileURLToPath
} from 'url';
import fs from 'fs';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths to quiz JSON files
const fastestQuizPath = path.join(__dirname, './quizzes/fastest.json');
const missingQuizPath = path.join(__dirname, './quizzes/missing.json');
const scrambledQuizPath = path.join(__dirname, './quizzes/scrambled.json');
const emojiQuizPath = path.join(__dirname, './quizzes/emoji.json');

// Read JSON files synchronously
const fastestQuiz = JSON.parse(fs.readFileSync(fastestQuizPath, 'utf-8'));
const missingQuiz = JSON.parse(fs.readFileSync(missingQuizPath, 'utf-8'));
const scrambledQuiz = JSON.parse(fs.readFileSync(scrambledQuizPath, 'utf-8'));
const emojiQuiz = JSON.parse(fs.readFileSync(emojiQuizPath, 'utf-8'));

// Map to store active quiz games per guild
const activeGames = new Map();

export default {
  name: "quiz",
  description: "Jump into a fast-paced trivia game with diverse question types—Fastest Answer, Missing Word, Scrambled Word, and Emoji Riddles. Answer within 25 seconds, rack up points, and climb the leaderboard. Think fast and show off your smarts!",
  aliases: [],
  args: "[duration in minutes: 2, 3, 5, 10]",
  example: [
    "quiz 2",
    "quiz 5"
  ],
  emoji: "🤔",
  category: "🎲 Games",
  cooldown: 10000,
  execute: async (args, message) => {
    try {
      args.shift();

      if (!message.guild) return message.reply("ⓘ This command can only be used in a guild.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

      // Prevent more than one quiz game per guild.

      if (activeGames.has(message.guild.id)) {
        const existingGame = activeGames.get(message.guild.id);

        // Check if the game is still active
        if (Date.now() < existingGame.endTime) {
          return message.reply("ⓘ ᴀ Qᴜɪᴢ ɢᴀᴍᴇ ɪꜱ ᴀʟʀᴇᴀᴅʏ ʀᴜɴɴɪɴɢ ɪɴ ᴛʜɪꜱ ɢᴜɪʟᴅ")
          .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        } else {
          // If the game has expired, remove it from activeGames
          activeGames.delete(message.guild.id);
        }
      }

      const durationArg = args[0] ? args[0]: 2;
      const allowedDurations = [2,
        3,
        5,
        10];
      const duration = parseInt(durationArg);

      if (!allowedDurations.includes(duration)) {
        return message.reply(`ⓘ ᴘʟᴇᴀꜱᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ :stopwatch: ᴅᴜʀᴀᴛɪᴏɴ ɪɴ ᴍɪɴᴜᴛᴇꜱ:\n**${allowedDurations.join(', ')}**\n-# **Example:** \`quiz 2\`\n-# - 𝖣𝖾𝖿𝖺𝗎𝗅𝗍 𝗂𝗌 2 𝗆𝗂𝗇𝗌.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const gameDuration = duration * 60 * 1000; // convert minutes to milliseconds
      const gameEndTime = Date.now() + gameDuration;

      // Initialize game state for this guild
      const gameState = {
        host: message.author.id,
        scores: new Map(),
        // key: user id, value: points
        channel: message.channel,
        endTime: gameEndTime,
        running: true,
      };

      activeGames.set(message.guild.id, gameState);
      await message.channel.send(`✦ . ⁺  𝑸𝒖𝒊𝒛 𝒈𝒂𝒎𝒆 𝒔𝒕𝒂𝒓𝒕𝒆𝒅! :stopwatch:\n**Duration:** ${duration} minute(s).\n### Get ready!`);

      // Start the game loop (async function returns when the game is over)
      runQuizGame(gameState, message.guild.id).then(async () => {
        activeGames.delete(message.guild.id);
        // When the game ends, show the final scores with pagination.
        displayFinalScores(gameState, message.channel);
      });
    } catch (err) {
      if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
        console.error(err);
      }
      return message.channel.send(`⚠ Something went wrong while starting the quiz game! 💢\n- **Error**: ${err.message}`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
}

  /**
  * Runs the quiz game loop.
  * It picks a random quiz type and question each round,
  * then waits 30 seconds for an answer.
  */
  async function runQuizGame(gameState, guildId) {
    // Define the available quiz types and link each to its JSON array.
    const quizTypes = [{
      name: "Fastest Answer",
      questions: fastestQuiz
    },
      {
        name: "Missing Word",
        questions: missingQuiz
      },
      {
        name: "Scrambled Word",
        questions: scrambledQuiz
      },
      {
        name: "Emoji Riddle",
        questions: emojiQuiz
      }];

    const channel = gameState.channel;

    // Continue sending questions until the game time is up.
    while (Date.now() < gameState.endTime) {
      // Pick a random quiz type and question.
      const quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
      const questionsArray = quizType.questions;
      const questionData = questionsArray[Math.floor(Math.random() * questionsArray.length)];
      // Expected structure for each questionData: { question: "…", answer: "…" }

      // Send an embed with the question.
      const questionEmbed = new EmbedBuilder()
      .setTitle(`✮ 𝐐𝐮𝐢𝐳: ${quizType.name}`)
      .setDescription(`${questionData.question}${quizType.name === "Emoji Riddle" ? "\n-# **Hint:** " + questionData.hint: ""}`)
      .setFooter({
        text: "ⓘ 𝘠𝘰𝘶 𝘢𝘭𝘭 𝘩𝘢𝘷𝘦 25 𝘴𝘦𝘤𝘰𝘯𝘥𝘴 𝘵𝘰 𝘢𝘯𝘴𝘸𝘦𝘳!"
      })
      .setColor("Random");

      await channel.send({
        embeds: [questionEmbed]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

      // Create a message collector for 30 seconds.
      const filter = m => !m.author.bot;
      const collector = channel.createMessageCollector({
        filter, time: 25000
      });
      
      const answeredUsers = new Set();

      // Wrap the collector in a Promise so we can await its end.
      await new Promise(resolve => {
        collector.on("collect", async m => {
          if (answeredUsers.has(m.author.id)) return;
          // Compare answer (case-insensitive, trimmed)
          const userAnswer = m.content.trim().toLowerCase();
          const correctAnswer = questionData.answer.trim().toLowerCase();
          if (userAnswer === correctAnswer) {
            // Update score for the user.
            const currentScore = gameState.scores.get(m.author.id) || 0;
            gameState.scores.set(m.author.id, currentScore + 1);
            answeredUsers.add(m.author.id);

            m.author.send(`${m.author} got it right! ദ്ദി \nYou correctly answered the quiz question.\n**Question:** ${questionData.question}\n-# (This message was sent in DMs to keep the results private.)`)
            .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
          }
        });
        collector.on("end",
          () => {
            channel.send(`Time's up! The correct answer was: **${questionData.answer}**`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
            resolve();
          });
      });

      // Check if there is enough time left for another full 20-second question.
      const remainingTime = gameState.endTime - Date.now();
      if (remainingTime < 20000) {
        // Wait the remaining time (if any) then exit.
        await new Promise(r => setTimeout(r, remainingTime));
        break;
      }
    }
  }

  /**
  * Displays the final scores in an embed with button pagination (10 entries per page).
  */
  async function displayFinalScores(gameState, channel) {
    // Convert scores Map into a sorted array.
    const scoresArray = Array.from(gameState.scores.entries()).map(([userId, score]) => ({
      userId, score
    }));
    scoresArray.sort((a, b) => b.score - a.score);

    if (scoresArray.length === 0) {
      return channel.send("ⓘ Quiz game over! No one scored any points.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(scoresArray.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageScores = scoresArray.slice(start, end);
      const description = pageScores
      .map((entry, index) => `**${start + index + 1}.** <@${entry.userId}> — ${entry.score} point(s)`)
      .join("\n");
      return new EmbedBuilder()
      .setTitle("𝑸𝒖𝒊𝒛 𝑮𝒂𝒎𝒆 𝑹𝒆𝒔𝒖𝒍𝒕𝒔")
      .setDescription(description)
      .setFooter({
        text: `Page ${page + 1} of ${totalPages}`
      })
      .setColor("Random");
    };

    // Send the first embed.
    const embedMessage = await channel.send({
      embeds: [generateEmbed(currentPage)]
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    // If only one page, no need for pagination.
    if (totalPages <= 1) return;

    // Create two buttons for previous and next.
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
    );

    await embedMessage.edit({
      components: [row]
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    // Create a button collector that lasts 60 seconds.
    const collector = embedMessage.createMessageComponentCollector({
      time: 60000
    });

    collector.on("collect", async interaction => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "prev" && currentPage > 0) {
        currentPage--;
      } else if (interaction.customId === "next" && currentPage < totalPages - 1) {
        currentPage++;
      }

      // Update buttons to disable when on first or last page.
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
        new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1)
      );

      await interaction.update({
        embeds: [generateEmbed(currentPage)], components: [newRow]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    });

    collector.on("end",
      async () => {
        try {
          // Remove buttons after the collector ends.
          if (embedMessage && embedMessage.edit) await embedMessage.edit({
            components: []
          });
        } catch (err) {}
      });
  }