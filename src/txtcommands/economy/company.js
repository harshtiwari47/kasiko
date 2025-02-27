import { startCompanyCommand } from './company/startCompany.js';
import { companyReportCommand } from './company/companyReport.js';
import { investCompanyCommand } from './company/investCompany.js';
import { upgradeCompanyCommand } from './company/upgradeCompany.js';
import { companyProfileCommand } from './company/companyProfile.js';
import { workCompanyCommand } from './company/workCompany.js';
import { withdrawSalaryCommand } from './company/withdrawSalary.js';

export default {
  name: "company",
  description: "Manage your self-created company and its finances.",
  aliases: ["co", "biz", "enterprise"],
  args: "<command> [parameters]",
  example: [
    "company start <companyName> <sector>",
    "company report",
    "company invest <amount>",
    "company upgrade <protection|stability|marketcap> <amount>",
    "company profile",
    "company work",
    "company withdraw"
  ],
  related: [],
  emoji: "🏢",
  cooldown: 10000,
  category: "🏦 Economy",

  execute: async (args, message) => {
    try {
      // args[0] is the main command name; subcommand is in args[1]
      const subcommand = args[1] ? args[1].toLowerCase() : null;
      
      switch(subcommand) {
        case "start":
          return await startCompanyCommand(message, args.slice(1));
        case "report":
          return await companyReportCommand(message, args.slice(1));
        case "invest":
          return await investCompanyCommand(message, args.slice(1));
        case "upgrade":
          return await upgradeCompanyCommand(message, args.slice(1));
        case "profile":
          return await companyProfileCommand(message, args.slice(1));
        case "work":
          return await workCompanyCommand(message, args.slice(1));
        case "withdraw":
          return await withdrawSalaryCommand(message, args.slice(1));
        default:
          const helpEmbed = {
            title: "Company Command Help",
            description: "Available subcommands:",
            fields: [
              { name: "start", value: "`company start <companyName> <sector>` - Register a new company (requires net worth >1M and 3M cash)" },
              { name: "report", value: "`company report` - Generate a quarterly report to update profit/loss" },
              { name: "invest", value: "`company invest <amount>` - Invest cash to boost your company" },
              { name: "upgrade", value: "`company upgrade <protection|stability|marketcap> <amount>` - Upgrade a company attribute" },
              { name: "profile", value: "`company profile` - View your company's profile" },
              { name: "work", value: "`company work` - Work to boost your stock price (max 3 times/day, 6 hours apart)" },
              { name: "withdraw", value: "`company withdraw` - Withdraw your salary (available every 7 days)" }
            ],
            color: 0x007bff,
            timestamp: new Date()
          };
          return message.channel.send({ embeds: [helpEmbed] });
      }
    } catch (err) {
      console.error("Error in company command:", err);
      return message.channel.send("An error occurred while processing your company command.");
    }
  }
};