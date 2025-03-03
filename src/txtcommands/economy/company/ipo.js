import Company from '../../../../models/Company.js';
import {
  EmbedBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function ipoCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    // Retrieve the user's company using their Discord ID
    const company = await Company.findOne({
      owner: userId
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have a registered company. Please use the \`company start\` command to create one.`
      });
    }

    // Expanded banned words list to ensure the company name (IPO title) is appropriate.
    const bannedWords = [
      // Profanity
      "fuck",
      "shit",
      "bitch",
      "asshole",
      "damn",
      "motherfucker",
      "dick",
      "cock",
      "ass",
      "arse",
      "piss",
      "crap",
      "bugger",
      "sod",
      "wanker",
      "douchebag",
      "shithead",
      "bullshit",
      "jackass",
      "fucker",
      "cocksucker",
      "bollocks",
      "wank",

      // Racial and homophobic slurs
      "nigger",
      "nigga",
      "faggot",
      "cunt",
      "kike",
      "chink",
      "spic",
      "gook",
      "wetback",
      "tranny",
      "dyke",
      "raghead",
      "towelhead",
      "beaner",

      // Religious terms and blasphemy
      "islam",
      "christian",
      "jew",
      "muslim",
      "blasphemy",
      "satan",
      "goddamn",
      "jesus",
      "allah",
      "bible",
      "quran",

      // Major brands
      "apple",
      "microsoft",
      "google",
      "amazon",
      "facebook",
      "tesla",
      "netflix",
      "coca-cola",
      "adidas",
      "nike",
      "sony",
      "adobe",
      "twitter",
      "instagram",
      "snapchat",
      "uber",
      "lyft",
      "mcdonalds",
      "starbucks",
      "burger king",
      "walmart",

      // Adult content
      "porn",
      "xxx",
      "cum",
      "semen",
      "boobs",
      "tits",
      "dildo",
      "pussy",

      // Extremist and violent terms
      "hitler",
      "nazi",
      "isis",
      "kkk",
      "rapist",
      "murder",
      "terrorist",
      "massacre",
      "genocide",
      "slaughter",
      "fascist",

      // Other insults and ableist terms
      "slut",
      "whore",
      "bastard",
      "blah",
      "moron",
      "idiot",
      "retard",
      "dummy",
      "dumbass",
      "scumbag",
      "loser"
    ]

    if (bannedWords.some(word => company.name.toLowerCase().includes(word))) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, your company name contains prohibited language. The name should not include harmful, slang, vulgar, politically or religiously charged words, or names of real companies.`
      });
    }

    // Check if the company is already public.
    if (company.isPublic) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, your company **${company.name}** is already public.`
      });
    }

    // Minimum criteria: company must have a minimum market cap (e.g., 5000)
    const MIN_MARKET_CAP = 1000000;
    if (company.marketCap < MIN_MARKET_CAP) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, your company **${company.name}** does not meet the minimum market cap of ${MIN_MARKET_CAP} required for an IPO.`
      });
    }

    // Log the IPO submission in the designated review channel for admin approval.
    const reviewChannel = message.client.channels.cache.get("1345372141922685038");
    if (!reviewChannel) {
      return handleMessage(message, {
        content: `⚠ Could not locate the IPO review channel. Please contact an administrator.`
      });
    }

    const embed = new EmbedBuilder()
    .setTitle("IPO Submission Request")
    .setDescription(
      `User **${username}** (ID: ${userId}) has submitted an IPO request for their company **${company.name}**.\n\n` +
      `**Market Cap:** ${company.marketCap}\n` +
      `**Current Price:** ${company.currentPrice}\n\n` +
      `Only an admin can approve this request.`
    )
    .setColor("#facc15")
    .setTimestamp();

    await reviewChannel.send({
      embeds: [embed]
    });

    // Notify the user that their IPO submission is pending review.
    return handleMessage(message, {
      content: `✅ **${username}**, your IPO submission for **${company.name}** has been received and is pending admin approval. Please wait a few days; you can keep checking your company status for updates.`
    });

  } catch (error) {
    console.error("Error in ipoCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your IPO submission.\n**Error**: ${error.message}`
    });
  }
}