import {
  AttachmentBuilder,
  EmbedBuilder
} from "discord.js";
import {
  createCanvas,
  loadImage
} from "@napi-rs/canvas";

export default {
  name: "ship",
  description: "Test the love score between two users!",
  aliases: ["love",
    "match"],
  cooldown: 3000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      args.shift();
      // If user typed "ship random"
      const isRandom = args[0]?.toLowerCase() === "random" || !args[0];

      // All members (excluding bots) so we can pick random ones if needed
      // Make sure we're in a guild channel
      // Ensure we're in a guild channel
      if (!message.guild) {
        return message.reply("This command can only be used in servers.");
      }

      const allMembers = await message.guild.members.fetch();

      if (isRandom) {
        if (!allMembers || allMembers.size <= 1) {
          return message.reply(
            "Not enough members to perform `ship random`. At least 2 members are required!"
          );
        }
      }

      let user1 = null;
      let user2 = null;

      // Attempt to grab mentioned users from the message
      const mentions = message.mentions.users;

      // If we have two mentions, use those
      if (mentions.size >= 2) {
        const arr = [...mentions.values()];
        user1 = arr[0];
        user2 = arr[1];
      }
      // If we have one mention, ship them with the message author
      else if (mentions.size === 1) {
        user1 = message.author;
        user2 = mentions.first();
      }
      // If "random" was specified, pick two distinct random members
      else if (isRandom && allMembers && allMembers.size > 1) {
        const randomMember1 = message.author;
        let randomMember2 = allMembers.random();
        while (randomMember1.id === randomMember2.id) {
          randomMember2 = allMembers.random();
        }
        user1 = randomMember1;
        user2 = randomMember2.user;
      }
      // If nothing is mentioned or "random" can't be done, show usage or fallback
      else {
        return message.reply(
          "Please mention one/two users or use `ship random` (in a server with enough members) to test a love score!"
        );
      }

      // 2) Calculate a stable love score based on user IDs (so it doesn't change)
      const score = Math.min(100, (getLoveScore(user1.id, user2.id, user1.username, user2.username, 100, Math.max(30, Math.ceil(Math.random() * 40))) + Math.floor((Math.random() * 10))));

      // 3) Generate a short love quote depending on the score
      const quote = pickQuote(score);

      // 4) Create a canvas image using @napi-rs/canvas
      const canvasWidth = 700;
      const canvasHeight = 290;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // ———————————— Background ————————————
      // Draw a simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, "#ff9a9e"); // Pinkish
      gradient.addColorStop(1, "#ff848f"); // Light pinkish
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // ———————————— Load user avatars ————————————
      const avatarSize = 290;
      const user1Avatar = await loadImage(user1.displayAvatarURL({
        extension: "png", size: 512
      }));
      const user2Avatar = await loadImage(user2.displayAvatarURL({
        extension: "png", size: 512
      }));

      // Draw left user avatar (circle mask)
      drawRoundedImage(ctx, user1Avatar, 0, (canvasHeight / 2) - (avatarSize / 2), avatarSize);

      // Draw right user avatar (circle mask)
      drawRoundedImage(ctx, user2Avatar, canvasWidth - 290, (canvasHeight / 2) - (avatarSize / 2), avatarSize);

      // ———————————— Draw heart / score text with a circle ————————————

      // Circle dimensions
      const circleRadius = 90; // Adjust radius as needed
      const circleX = canvasWidth / 2; // Center X
      const circleY = canvasHeight / 2; // Center Y

      // Draw a circle
      ctx.fillStyle = "#ff9a9e"; // the circle color
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();

      // A big heart in the middle:
      ctx.fillStyle = "rgb(255,38,38)";
      ctx.font = "100px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♥", circleX, circleY - 12);

      // Score text below the heart
      ctx.fillStyle = "rgb(196,0,0)";
      ctx.font = "30px sans-serif";
      ctx.fillText(`${score}%`, circleX, circleY + 50);

      // 5) Convert to Discord attachment
      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "ship.png",
      });

      const msgDescription = `### 💘 **\`𝑾𝑰𝑵𝑫𝑺 𝑶𝑭 𝑨𝑭𝑭𝑬𝑪𝑻𝑰𝑶𝑵!\`**\n` +
      `### **${user1.username}** ❤️ **${user2.username}**\n` +
      `ᥫ᭡ ✧ ***_Score: ${score}%_***\n` +
      `-# 💌 _${quote}_\n`;

      // 7) Reply with embed + image
      await message.channel.send({
        content: msgDescription, files: [attachment]
      });
    } catch (e) {
      console.error(e);
      try {
        await message.channel.send("❗Something went wrong while shipping. Maybe there's an error caused while loading your PFP!");
      } catch (err) {
        console.error(err);
      }
    }
  },
};

  // ———————————————————————————————————————————————————————————————
  // Helper to calculate a stable love score based on user IDs and usernames
  function getLoveScore(id1, id2, username1, username2, maxScore = 100, seed = 31) {
    if (typeof id1 !== 'string' || typeof id2 !== 'string' ||
      typeof username1 !== 'string' || typeof username2 !== 'string') {
      throw new Error('IDs and usernames must be strings.');
    }

    // Combine IDs in a deterministic order
    const combinedIds = id1 < id2 ? `${id1}${id2}`: `${id2}${id1}`;
    const combinedUsernames = username1 < username2 ? `${username1}${username2}`: `${username2}${username1}`;

    // Hash function (FNV-1a inspired) for a string
    function hashString(str, seed) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, seed);
      }
      return hash;
    }

    // Calculate ID-based and username-based scores
    const idHash = Math.abs(hashString(combinedIds, seed) % (maxScore + 1));
    const usernameHash = Math.abs(hashString(combinedUsernames, seed) % (maxScore + 1));

    // Combine scores with weights: 80% IDs and 20% usernames
    const weightedScore = Math.round((idHash * 0.8) + (usernameHash * 0.2));

    // Ensure the final score doesn't exceed maxScore
    return Math.min(weightedScore, maxScore);
  }

  // ———————————————————————————————————————————————————————————————
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

  // ———————————————————————————————————————————————————————————————
  // Helper to draw rounded rectangular masked image with fixed 8px border radius
  function drawRoundedImage(ctx, img, x, y, size) {
    const radius = 16; // Fixed border radius
    ctx.save();
    ctx.beginPath();

    // Draw rounded rectangle
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

    // Draw the image
    ctx.drawImage(img, x, y, size, size);

    ctx.restore();
  }