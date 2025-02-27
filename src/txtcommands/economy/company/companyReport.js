import Company from '../../../../models/Company.js';
import { getUserData, updateUser } from '../../../../database.js';
import { EmbedBuilder } from 'discord.js';

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


export async function companyReportCommand(message, args) {
  try {
    const userId = message.author.id;
    
    // Find the user's company.
    const company = await Company.findOne({ owner: userId });
    if (!company) {
      return handleMessage(message, {
        content: "ⓘ You do not have a registered company. Start one with `company start <name>`."
      });
    }
    
    // Simulate a quarterly report.
    // Generate a random profit percentage between -10% and +20%.
    const profitPercentage = (Math.random() * 30 - 10) / 100;
    const revenue = company.marketCap * (Math.random() * 0.05 + 0.01);
    const profit = revenue * profitPercentage;
    
    // Adjust stock price slightly.
    const priceChangeFactor = 1 + profitPercentage / 10;
    company.currentPrice = parseFloat((company.currentPrice * priceChangeFactor).toFixed(2));
    
    // Update price history.
    company.last10Prices.push(company.currentPrice);
    if (company.last10Prices.length > 10) company.last10Prices.shift();
    company.maxPrice = Math.max(...company.last10Prices);
    company.minPrice = Math.min(...company.last10Prices);
    company.trend = profitPercentage >= 0 ? "up" : "down";
    
    await company.save();
    
    // Retrieve user data to credit/deduct profit.
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "ⓘ User data not found."
      });
    }
    
    userData.cash += profit;
    userData.networth += profit;
    await updateUser(userId, userData);
    
    const reportEmbed = new EmbedBuilder()
      .setTitle(`${profit >= 0 ? "<:stocks_profit:1321342107574599691>": "<:stocks_loss:1321342088020885525>"} 𝙌𝙐𝘼𝙍𝙏𝙀𝙍𝙇𝙔 𝙍𝙀𝙋𝙊𝙍𝙏 𝙁𝙊𝙍 ${company.name}`)
      .setDescription(
        `**Revenue:** <:kasiko_coin:1300141236841086977> ${revenue.toFixed(2)}\n` +
        `**Profit:** <:kasiko_coin:1300141236841086977> ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}\n` +
        `**Profit Margin:** <:kasiko_coin:1300141236841086977> ${(profitPercentage * 100).toFixed(2)}%\n\n` +
        `➤ 𝗡𝗲𝘄 𝘀𝘁𝗼𝗰𝗸 𝗽𝗿𝗶𝗰𝗲: <:kasiko_coin:1300141236841086977> **${company.currentPrice}**`
      )
      .setColor(profit >= 0 ? "#7fde95" : "#e35663")
      .setThumbnail("https://harshtiwari47.github.io/kasiko-public/images/Company-Report.jpg")
      .setTimestamp();
    
    return handleMessage(message, { embeds: [reportEmbed] });
  } catch (error) {
    console.error("Error in companyReportCommand:", error);
    try {
      return handleMessage(message, {
        content: `⚠ An error occurred while generating the company report.\n**Error**: ${error.message}`
      });
    } catch (err) {
      console.error("Error sending error message:", err);
    }
  }
}