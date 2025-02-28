import Company from '../../../../models/Company.js';
import {
  EmbedBuilder
} from 'discord.js';

// Universal function for sending responses
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function workCompanyCommand(message, args) {
  try {
    const userId = message.author.id;
    const username = message.author.username;

    // Find the user's company.
    const company = await Company.findOne({
      owner: userId
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ ${username}, you don't have a registered company. Use \`company start <name>\` to create one.`
      });
    }

    const now = new Date();
    const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

    // Reset workCount if last work was on a previous day.
    if (company.lastWorkAt) {
      const lastWorkDate = new Date(company.lastWorkAt);
      if (lastWorkDate.toDateString() !== now.toDateString()) {
        company.workCount = 0;
      }
    } else {
      company.workCount = 0;
    }

    // Check if already worked 3 times today.
    if (company.workCount >= 3) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you have already worked 3 times today. Please wait until tomorrow.`
      });
    }

    // Ensure at least 6 hours have passed since last work.
    if (company.lastWorkAt && (now - new Date(company.lastWorkAt)) < sixHours) {
      const remaining = sixHours - (now - new Date(company.lastWorkAt));
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return handleMessage(message, {
        content: `ⓘ ${username}, you need to wait ${hours} hours and ${minutes} minutes before working again.`
      });
    }

    // Boost stock price by 0.5-1%.
    const boostPercentage = Math.random() * 0.005 + 0.005;
    company.currentPrice = parseFloat((company.currentPrice * (1 + boostPercentage)).toFixed(2));

    // Update price history.
    company.last10Prices.push(company.currentPrice);
    if (company.last10Prices.length > 10) {
      company.last10Prices.shift();
    }
    company.maxPrice = Math.max(...company.last10Prices);
    company.minPrice = Math.min(...company.last10Prices);
    company.trend = 'up';

    company.workCount += 1;
    company.lastWorkAt = now;

    await company.save();

    const embed = new EmbedBuilder()
    .setTitle("💼 𝙒𝙤𝙧𝙠 𝘾𝙤𝙢𝙥𝙡𝙚𝙩𝙚𝙙")
    .setDescription(`**${username}**, you worked hard and boosted your company's stock price by **${(boostPercentage * 100).toFixed(2)}%**!`)
    .addFields({
      name: "🎉 New Stock Price", value: "<:kasiko_coin:1300141236841086977> " + company.currentPrice.toString(), inline: false
    })
    .setColor("#cc782e")
    .setTimestamp();

    return handleMessage(message, {
      embeds: [embed]
    });
  } catch (error) {
    console.error("Error in workCompanyCommand:", error);
    try {
      return handleMessage(message, {
        content: `⚠ An error occurred while processing your work command.\n**Error**: ${error.message}`
      });
    } catch (err) {
      console.error("Error sending error message:", err);
    }
  }
}