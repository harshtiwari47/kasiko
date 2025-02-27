import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder
} from 'discord.js';

export async function withdrawSalaryCommand(message, args) {
  try {
    const userId = message.author.id;
    const username = message.author.username;

    // Find the user's company.
    const company = await Company.findOne({
      owner: userId
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you don't have a registered company. Use \`!company start\` to create one.`
      });
    }

    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Check if 7 days have passed since the last withdrawal.
    if (company.lastSalaryWithdrawal && (now - new Date(company.lastSalaryWithdrawal)) < sevenDays) {
      const remaining = sevenDays - (now - new Date(company.lastSalaryWithdrawal));
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      return handleMessage(message, {
        content: `ⓘ **${username}**, you can withdraw your salary in ${days} days and ${hours} hours.`
      });
    }

    // Calculate salary (0.1% of marketCap with a minimum of 50,000).
    const baseSalary = company.marketCap * 0.1;
    const salary = Math.max(baseSalary, 50000);

    // Update the withdrawal time.
    company.lastSalaryWithdrawal = now;
    await company.save();

    // Credit salary to the user.
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, user data not found.`
      });
    }
    userData.cash += salary;
    userData.networth += salary;
    await updateUser(userId, userData);

    const embed = new EmbedBuilder()
    .setTitle("💸 𝙎𝙖𝙡𝙖𝙧𝙮 𝙒𝙞𝙩𝙝𝙙𝙧𝙖𝙬𝙣")
    .setDescription(`**${username}**, you have withdrawn your salary of <:kasiko_coin:1300141236841086977> **${salary.toFixed(2)}** cash from your company **${company.name}**.`)
    .setColor("#2ecc71")
    .setTimestamp();

    return handleMessage(message, {
      embeds: [embed]
    });
  } catch (error) {
    console.error("Error in withdrawSalaryCommand:", error);
    try {
      return handleMessage(message, {
        content: `⚠ **${message.author.username}**, an error occurred while processing your salary withdrawal.\n**Error**: ${error.message}`
      });
    } catch (err) {
      console.error("Error sending error message:", err);
    }
  }
}