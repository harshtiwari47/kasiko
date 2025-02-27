import Company from '../../../../models/Company.js';
import { createStockEmbed } from '../../stocks/stocks.js';
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

export async function companyProfileCommand(message, args) {
  try {
    const userId = message.author.id;
    const username = message.author.username;
    
    // Find the user's company.
    const company = await Company.findOne({ owner: userId });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have a registered company. Use \`!company start\` to create one.`
      });
    }
    
    // Create and send the stock embed for the company.
    const embed = createStockEmbed(company.name, company.toJSON());
    return handleMessage(message, { embeds: embed });
  } catch (error) {
    console.error("Error in companyProfileCommand:", error);
    try {
      return handleMessage(message, {
        content: `⚠ **${message.author.username}**, an error occurred while fetching your company profile.\n**Error**: ${error.message}`
      });
    } catch (err) {
      console.error("Error sending error message:", err);
    }
  }
}