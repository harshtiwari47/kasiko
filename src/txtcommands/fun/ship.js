import {
  AttachmentBuilder,
  EmbedBuilder
} from "discord.js";
import {
  createCanvas,
  loadImage
} from "@napi-rs/canvas";
import fs from "fs";
import path from 'path';

const shipDatabasePath = path.join(process.cwd(), 'database', 'customScores.json');

export default {
  name: "ship",
  description: "Test the love score between two users!",
  aliases: ["love",
    "match"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      args.shift();
      // If user typed "ship random"
      const isRandom = args[0]?.toLowerCase() === "random" || !args[0];

      if (!message.guild) {
        return message.reply("This command can only be used in servers.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const allMembers = await message.guild.members.fetch();

      if (isRandom) {
        if (!allMembers || allMembers.size <= 1) {
          return message.reply("Not enough members to perform `ship random`. At least 2 members are required!")
          .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
        }
      }

      let user1 = null;
      let user2 = null;
      const mentions = message.mentions.users;

      if (mentions.size >= 2) {
        const arr = [...mentions.values()];
        user1 = arr[0];
        user2 = arr[1];
      } else if (mentions.size === 1) {
        user1 = message.author;
        user2 = mentions.first();
      } else if (isRandom && allMembers && allMembers.size > 1) {
        const randomMember1 = message.author;
        let randomMember2 = allMembers.random();
        while (randomMember1.id === randomMember2.id) {
          randomMember2 = allMembers.random();
        }
        user1 = randomMember1;
        user2 = randomMember2.user;
      } else {
        return message.reply("Please mention one/two users or use `ship random` (in a server with enough members) to test a love score!")
        .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Attempt to load a custom score from a JSON file.
      let customScore = null;
      try {
        // The JSON file should be in the same folder and have a structure like:
        // { "userID1-userID2": 85, "userID3-userID4": 42 }
        const data = fs.readFileSync(shipDatabasePath, 'utf8');
        const customScores = JSON.parse(data);
        // Create a sorted key (e.g. "123456789-987654321") so the order doesn't matter.
        const key = [user1.id,
          user2.id].sort().join("-");
        if (customScores.hasOwnProperty(key)) {
          customScore = customScores[key];
        }
      } catch (error) {
        console.error("Error reading customScores.json:", error);
      }

      // Calculate score: if custom score is set, use it; otherwise, calculate it.
      const score = customScore !== null
      ? Math.min(100, customScore): Math.min(100, (getLoveScore(user1.id, user2.id, user1.username, user2.username, 100, Math.max(30, Math.ceil(Math.random() * 40))) + Math.floor((Math.random() * 10))));

      const quote = pickQuote(score);

      // Create a canvas image
      const canvasWidth = 700;
      const canvasHeight = 290;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(1, "#ff848f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Load user avatars
      const avatarSize = 290;
      const user1Avatar = await loadImage(user1.displayAvatarURL({
        extension: "png", size: 512
      }));
      const user2Avatar = await loadImage(user2.displayAvatarURL({
        extension: "png", size: 512
      }));

      // Draw avatars with circle masks
      drawRoundedImage(ctx, user1Avatar, 0, (canvasHeight / 2) - (avatarSize / 2), avatarSize);
      drawRoundedImage(ctx, user2Avatar, canvasWidth - avatarSize, (canvasHeight / 2) - (avatarSize / 2), avatarSize);

      // Draw heart and score
      const circleRadius = 90;
      const circleX = canvasWidth / 2;
      const circleY = canvasHeight / 2;
      ctx.fillStyle = "#ff9a9e";
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();

      ctx.fillStyle = "rgb(255,38,38)";
      ctx.font = "100px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♥", circleX, circleY - 12);

      ctx.fillStyle = "rgb(196,0,0)";
      ctx.font = "30px sans-serif";
      ctx.fillText(`${score}%`, circleX, circleY + 50);

      // Send embed with the generated image
      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "ship.png"
      });
      const msgDescription = `### <a:red_heart:1356865968164569158>  *** 𝙒𝙄𝙉𝘿𝙎 𝙊𝙁 𝘼𝙁𝙁𝙀𝘾𝙏𝙄𝙊𝙉 ***\n` +
      `### **${user1.username}** <:wine:1356880010866069562> **${user2.username}**\n` +
      `ᥫ᭡ ﹒ ***_𝗦𝗰𝗼𝗿𝗲 ⪩ ${score}%_***\n` +
      `-# 💌 _${quote}_\n`;

      await message.channel.send({
        content: msgDescription, files: [attachment]
      });
    } catch (e) {
      console.error(e);
      return message.channel.send("❗Something went wrong while shipping. Maybe there's an error caused while loading your PFP!")
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
};

  // Helper to calculate a stable love score based on user IDs and usernames
  function getLoveScore(id1, id2, username1, username2, maxScore = 100, seed = 31) {
    if (typeof id1 !== 'string' || typeof id2 !== 'string' ||
      typeof username1 !== 'string' || typeof username2 !== 'string') {
      throw new Error('IDs and usernames must be strings.');
    }
    const combinedIds = id1 < id2 ? `${id1}${id2}`: `${id2}${id1}`;
    const combinedUsernames = username1 < username2 ? `${username1}${username2}`: `${username2}${username1}`;

    function hashString(str, seed) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, seed);
      }
      return hash;
    }

    const idHash = Math.abs(hashString(combinedIds, seed) % (maxScore + 1));
    const usernameHash = Math.abs(hashString(combinedUsernames, seed) % (maxScore + 1));
    const weightedScore = Math.round((idHash * 0.8) + (usernameHash * 0.2));
    return Math.min(weightedScore, maxScore);
  }

  // Pick a quote based on the love score
  function pickQuote(score) {
    if (score < 10) {
      return "Uh-oh... not much of a connection here... (｡•́︿•̀｡) 𓂀";
    } else if (score < 20) {
      return "Maybe there's hope... but it's still a little awkward (･_･;) ⋆⁺₊❅";
    } else if (score < 30) {
      return "Hmm, not much chemistry here… but who knows what the future holds? (｡•́︿•̀｡)";
    } else if (score < 40) {
      return "There's a glimmer of something... but it's still uncertain (¬_¬) 𓂃 ࣪˖";
    } else if (score < 50) {
      return "A spark is definitely in the air! (´∩｡• ᵕ •｡∩`) ♡˚₊· ͟͟͞͞➳❥";
    } else if (score < 60) {
      return "Things are heating up! Could be something special (灬º‿º灬)♡ ⋆｡˚ ⋆";
    } else if (score < 70) {
      return "You're getting there—love is blooming, slowly but surely! (っ˘ω˘ς)";
    } else if (score < 80) {
      return "You're quite the match! It's like destiny's at work (◍•ᴗ•◍)❤ 𓂃";
    } else if (score < 90) {
      return "A deep connection, almost like it was meant to be (◍＞◡＜◍) ᥫ᭡";
    } else if (score < 100) {
      return "It's a cosmic bond! You two are perfectly in sync (♡°▽°♡) ⋆⁺₊❅";
    } else {
      return "A perfect match! True love, no doubt! (*≧ω≦) 𓂀 ⋆";
    }
  }

  // Helper to draw rounded rectangular masked image with a fixed border radius
  function drawRoundedImage(ctx, img, x, y, size) {
    const radius = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  }