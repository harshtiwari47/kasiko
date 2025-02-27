import Company from '../../../../models/Company.js';
import { getUserData, updateUser } from '../../../../database.js';
import { EmbedBuilder } from 'discord.js';

export async function upgradeCompanyCommand(message, args) {
  const userId = message.author.id;
  const upgradeType = args[1]; // e.g., "protection", "stability", "marketcap"
  const amount = parseInt(args[2]);
  
  if (!upgradeType || isNaN(amount) || amount <= 0) {
    return message.channel.send("Usage: `!company upgrade <protection|stability|marketcap> <amount>`");
  }
  
  const company = await Company.findOne({ owner: userId });
  if (!company) {
    return message.channel.send("You do not have a registered company.");
  }
  
  const userData = await getUserData(userId);
  if (!userData) return message.channel.send("User data not found.");
  
  // Example cost: 500K cash per upgrade unit.
  const costPerUnit = 500000;
  const totalCost = costPerUnit * amount;
  
  if (userData.cash < totalCost) {
    return message.channel.send(`You don't have enough cash for this upgrade. Required: ${totalCost} cash.`);
  }
  
  // Deduct cost.
  userData.cash -= totalCost;
  
  // Apply the upgrade.
  switch (upgradeType.toLowerCase()) {
    case "protection":
      company.protection += amount * 10;
      break;
    case "stability":
      company.volatility = Math.max(1, company.volatility - amount);
      break;
    case "marketcap":
      company.marketCap += amount * 100000;
      break;
    default:
      return message.channel.send("Invalid upgrade type. Use `protection`, `stability`, or `marketcap`.");
  }
  
  await updateUser(userId, userData);
  await company.save();
  
  const upgradeEmbed = new EmbedBuilder()
    .setTitle("Company Upgrade")
    .setDescription(`Your company's **${upgradeType}** has been upgraded by **${amount}** unit(s) for a cost of **${totalCost}** cash.`)
    .setColor("#2ecc71")
    .setTimestamp();
  
  return message.channel.send({ embeds: [upgradeEmbed] });
}