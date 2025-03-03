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

export async function salaryCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    // Retrieve the company associated with this user (the owner)
    const company = await Company.findOne({
      owner: userId
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have a registered company. Please use the \`company start\` command to create one.`
      });
    }

    // Set a cooldown for the salary command: 3 days (259200000 milliseconds)
    const COOLDOWN = 259200000;
    const now = new Date();
    if (company.lastSalaryWithdrawal && (now - company.lastSalaryWithdrawal < COOLDOWN)) {
      const remainingMs = COOLDOWN - (now - company.lastSalaryWithdrawal);
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.ceil((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      return handleMessage(message, {
        content: `ⓘ **${username}**, you have already withdrawn your salary recently. Please wait ${remainingDays} day(s) and ${remainingHours} hour(s) before withdrawing your salary again.`
      });
    }

    // Calculate salary reward: a base salary plus a bonus based on the company's current price and a small random component.
    const baseSalary = 50000;
    const bonus = Math.floor(company.currentPrice * 100);
    const salaryReward = baseSalary + bonus + Math.floor(Math.random() * 50); // Random addition up to 50

    // Retrieve and update the user's cash balance
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, user data not found.`
      });
    }

    userData.cash += salaryReward;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the company's lastSalaryWithdrawal timestamp
    company.lastSalaryWithdrawal = now;
    await company.save();

    const embed = new EmbedBuilder()
    .setTitle("💼 SALARY WITHDRAWAL")
    .setDescription(`💸 **${username}**, you have withdrawn your salary from **${company.name}** and received <:kasiko_coin:1300141236841086977> ${salaryReward}.`)
    .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/bosschair.jpg`)
    .setColor("#60faa4")
    .setTimestamp();

    return handleMessage(message, {
      embeds: [embed]
    });

  } catch (error) {
    console.error("Error in salaryCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your salary withdrawal.\n**Error**: ${error.message}`
    });
  }
}