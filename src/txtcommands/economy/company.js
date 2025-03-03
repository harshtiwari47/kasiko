import {
  startCompanyCommand
} from './company/startCompany.js';
import {
  fundCompanyCommand
} from './company/fundCompany.js';
import {
  companyProfileCommand
} from './company/companyProfile.js';
import {
  workCommand
} from './company/workCompany.js';
import {
  salaryCommand
} from './company/withdrawSalary.js';
import {
  ipoCommand
} from './company/ipo.js';
import {
  viewFundersCommand
} from './company/funders.js';

export default {
  name: "company",
  description: "Manage your self-created company and its finances.",
  aliases: ["co",
    "biz",
    "enterprise"],
  args: "<command> [parameters]",
  example: [
    "company start <companyName> <sector>",
    "company fund <company> <amount>",
    "company profile",
    "company work",
    "company withdraw",
    "company funders",
    "company ipo"
  ],
  related: ["stocks"],
  emoji: "🏢",
  cooldown: 10000,
  category: "🏦 Economy",

  execute: async (args, message) => {
    try {
      // args[0] is the main command name; subcommand is in args[1]
      const subcommand = args[1] ? args[1].toLowerCase(): null;

      switch (subcommand) {
      case "start":
        return await startCompanyCommand(message, args.slice(1));
      case "ipo":
        return await ipoCommand(message, args.slice(1));
      case "funders":
        return await viewFundersCommand(message, args.slice(1));
      case "fund":
        return await fundCompanyCommand(message, args.slice(1));
      case "profile":
        return await companyProfileCommand(message, args.slice(1));
      case "work":
        return await workCommand(message, args.slice(1));
      case "withdraw":
        return await salaryCommand(message, args.slice(1));
      default:
        const helpEmbed = {
          title: "🏢 Company Command Help",
          description:
          "Manage your self-created company and its finances using the following commands.\nFor additional details, please use: `/guide company`.",
          fields: [{
            name: "Start a Company",
            value:
            "`company start <companyName> <sector>`\nCreate your company in a specific sector.",
          },
            {
              name: "IPO",
              value:
              "`company ipo`\nTake your company public through an Initial Public Offering.",
            },
            {
              name: "View Funders",
              value:
              "`company funders`\nSee who has invested in your company.",
            },
            {
              name: "Fund Your Company",
              value:
              "`company fund <company> <amount>`\nInvest additional funds into your company.",
            },
            {
              name: "Company Profile",
              value:
              "`company profile`\nDisplay detailed information about your company.",
            },
            {
              name: "Work for Your Company",
              value:
              "`company work`\nPerform tasks to earn revenue for your company.",
            },
            {
              name: "Withdraw Salary",
              value:
              "`company withdraw`\nRetrieve your earned salary from the company funds.",
            },
          ],
          footer: {
            text: "Build and manage your business empire with these commands!",
          },
          color: 0x007bff,
        };

        return message.channel.send({
          embeds: [helpEmbed]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }
    } catch (err) {
      console.error("Error in company command:", err);
      return message.channel.send("An error occurred while processing your company command.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  }
};