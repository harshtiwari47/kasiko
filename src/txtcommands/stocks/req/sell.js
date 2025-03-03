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
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function sellSharesCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;
    
    // Expected usage: stock sell <companyName> <numShares>
    const companyName = args[1];
    const sharesArg = args[2];

    if (!companyName || !sharesArg) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide the company name and the number of shares to sell.\n**Usage:** \`stock sell <companyName> <numShares>\``
      });
    }

    const numShares = parseInt(sharesArg, 10);
    if (isNaN(numShares) || numShares <= 0) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a valid number of shares greater than 0.`
      });
    }

    // Find the company (assuming names are stored in uppercase)
    const company = await Company.findOne({
      name: companyName.toUpperCase()
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, no company found with the name **${companyName.toUpperCase()}**.`
      });
    }

    // Retrieve the user's data
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "User data not found."
      });
    }

    // Check if the user owns any shares of this company
    let shareholder = company.shareholders.find(s => s.userId === userId);
    if (!shareholder) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not own any shares of **${company.name}**.`
      });
    }

    // Ensure the user has enough shares to sell
    if (shareholder.shares < numShares) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have ${numShares} shares to sell. You currently own ${shareholder.shares} shares.`
      });
    }

    // Calculate the total sale value based on the company’s current price
    const currentPrice = company.currentPrice;
    const totalSaleValue = Math.round(currentPrice * numShares * 10) / 10;

    // Increase the user's cash by the sale value
    userData.cash += totalSaleValue;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the shareholder's record
    shareholder.shares -= numShares;
    shareholder.cost -= totalSaleValue;
    // Remove the shareholder entry if they no longer own any shares
    if (shareholder.shares === 0) {
      company.shareholders = company.shareholders.filter(s => s.userId !== userId);
    }

    // Decrease total shares outstanding and update the market cap
    company.totalSharesOutstanding -= numShares;
    company.marketCap = currentPrice * company.totalSharesOutstanding;

    await company.save();

    const description = `## 📊 𝐒𝐡𝐚𝐫𝐞𝐬 𝐒𝐨𝐥𝐝\n\n\n**${username}**, you have sold **${numShares}** shares of **${company.name}** for <:kasiko_coin:1300141236841086977> **${totalSaleValue}** 𝑪𝒂𝒔𝒉.`;

    return handleMessage(message, {
      content: description
    });

  } catch (error) {
    console.error("Error in sellSharesCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your share sale.\n**Error**: ${error.message}`
    });
  }
}