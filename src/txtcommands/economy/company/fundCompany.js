import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function fundCompanyCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    // Expected usage: company fund <companyName> <amount>
    const companyName = args[1];
    const amountArg = args[2];

    if (!companyName || !amountArg) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide the company name and the amount to invest.\n**Usage:** \`company fund <companyName> <amount>\``
      });
    }

    // Parse the investment amount.
    const investmentAmount = parseFloat(amountArg);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid investment amount greater than 0.`
      });
    }

    // Find the company by name (assumed stored in uppercase).
    const company = await Company.findOne({
      name: companyName.toUpperCase()
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, no company found with the name **${companyName.toUpperCase()}**.`
      });
    }

    // Prevent company owners from investing in their own company.
    if (company.owner === userId) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you cannot invest in your own company.`
      });
    }

    // Retrieve the user's data.
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "User data not found."
      });
    }

    if (userData.cash < investmentAmount) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have enough cash to invest <:kasiko_coin:1300141236841086977> ${investmentAmount}.`
      });
    }

    // Calculate the number of shares to issue based on the current stock price.
    const currentPrice = company.currentPrice;
    const sharesToIssue = Math.floor(investmentAmount / currentPrice);
    if (sharesToIssue <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, the investment amount is too low to purchase even 1 share at the current price of ${currentPrice}.`
      });
    }

    // Check if issuing new shares would exceed the authorized shares.
    if (company.totalSharesOutstanding + sharesToIssue > company.authorizedShares) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, the company cannot issue more shares. Your investment would exceed the authorized shares limit.`
      });
    }

    // Deduct the investment amount from the user's cash.
    userData.cash -= investmentAmount;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the company's shareholders list:
    let shareholder = company.shareholders.find(s => s.userId === userId);
    if (shareholder) {
      shareholder.shares += sharesToIssue;
      shareholder.lastInvestedAt = new Date();
      shareholder.cost += investmentAmount;
    } else {
      company.shareholders.push({
        userId,
        shares: sharesToIssue,
        role: 'funder',
        lastInvestedAt: new Date(),
        cost: investmentAmount
      });
    }

    // Record this investment as a funding round.
    company.fundingRounds.push({
      round: 'directFunding',
      amount: investmentAmount,
      sharesIssued: sharesToIssue,
      date: new Date()
    });

    // Increase the total shares outstanding.
    company.totalSharesOutstanding += sharesToIssue;

    // Optionally update the market cap (for example, currentPrice * totalSharesOutstanding).
    company.marketCap = currentPrice * company.totalSharesOutstanding;

    await company.save();

    const embed = new EmbedBuilder()
    .setDescription(`## 💰 Investment Successful!\n\n**${username}**, you have invested <:kasiko_coin:1300141236841086977> ${investmentAmount} into **${company.name}** and received **${sharesToIssue}** shares.`)
    .setColor("#a3e635")
    .setTimestamp();

    return handleMessage(message, {
      embeds: [embed]
    });

  } catch (error) {
    console.error("Error in fundCompanyCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your investment.\n**Error**: ${error.message}`
    });
  }
}