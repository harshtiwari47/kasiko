import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
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

export async function investCompanyCommand(message, args) {
  try {
    args.shift();
    const userId = message.author.id;
    const userName = message.author.username;
    let company;
    let amount;

    // Determine the input format.
    // If a company name is provided (args length >= 3) then use it.
    if (args.length >= 3) {
      const companyName = args[1];
      amount = parseInt(args[2]);
      if (isNaN(amount) || amount <= 0) {
        return handleMessage(message, {
          content: `ⓘ **${userName}**, please provide a valid amount.\nUsage: \`company invest <companyName> <amount>\``
        });
      }
      company = await Company.findOne({
        name: companyName
      });
      if (!company) {
        return handleMessage(message, {
          content: `ⓘ **${userName}**, company **${companyName}** not found.`
        });
      }
    } else {
      // Otherwise, the user is investing in their own company.
      amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) {
        return handleMessage(message, {
          content: `ⓘ **${userName}**, please provide a valid amount.\nUsage: \`company invest <amount>\` or \`company invest <companyName> <amount>\``
        });
      }
      company = await Company.findOne({
        owner: userId
      });
      if (!company) {
        return handleMessage(message, {
          content: `ⓘ **${userName}**, you do not have a registered company.`
        });
      }
    }

    // Retrieve investor's user data.
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: `ⓘ **${userName}**, user data not found.`
      });
    }

    // Ensure the investor has enough cash.
    if (userData.cash < amount) {
      return handleMessage(message, {
        content: `ⓘ **${userName}**, you don't have enough cash to invest.`
      });
    }

    // Deduct the investment from the investor's cash.
    userData.cash -= amount;
    await updateUser(userId, userData);

    // Calculate the boost factor and update company stats.
    const boostFactor = 1 + (amount / 10000000);
    company.currentPrice = parseFloat((company.currentPrice * boostFactor).toFixed(2));
    company.marketCap += amount;

    // Update price history.
    company.last10Prices.push(company.currentPrice);
    if (company.last10Prices.length > 10) {
      company.last10Prices.shift();
    }
    company.maxPrice = Math.max(...company.last10Prices);
    company.minPrice = Math.min(...company.last10Prices);

    await company.save();

    const investEmbed = new EmbedBuilder()
    .setTitle("🥂 Company Investment")
    .setDescription(`**${userName}** invested <:kasiko_coin:1300141236841086977> **${amount}** cash into **${company.name}**, boosting its stock price to <:kasiko_coin:1300141236841086977> **${company.currentPrice}**.`)
    .setColor("#2ecc71")
    .setTimestamp();

    return handleMessage(message, {
      embeds: [investEmbed]
    });
  } catch (error) {
    console.error("Error in investCompanyCommand:", error);
    try {
      return handleMessage(message, {
        content: `⚠ An error occurred during investment.\n**Error**: ${error.message}`
      });
    } catch (err) {
      console.error("Error sending error message:", err);
    }
  }
}