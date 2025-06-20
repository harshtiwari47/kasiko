import News from '../../../models/News.js';
import {
  Helper
} from '../../../helper.js';
import {
  sendNewspaper
} from "../stocks/stocks.js";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
const DEVELOPER_ID = "1223321207743582211"; //Discord user ID

export async function getRecentNews(channel) {
  try {
    const recentNews = await News.find().sort({
      createdAt: -1
    }).limit(5);
    if (recentNews.length === 0) {
      return channel.send("📰 No recent news available at the moment.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    let newsList = recentNews
    .map((news, index) => {
      const publishDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(news.createdAt));

      return `${index + 1}. ${news.message}\n-#  🗓️ DATE: ${publishDate}`;
    })
    .join('\n\n');

    const newsEmbed = new EmbedBuilder()
    .setDescription(`📰 **Top 5 Recent Developer News:**\n\n${newsList}`)
    .setColor("#e0e6ed");

    return channel.send({
      embeds: [newsEmbed]
    }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (err) {
    if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
      console.error(err);
    }
    return channel.send("⚠️ An error occurred while fetching the news.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function createNews(userId, message, channel) {
  try {
    if (!message || message.trim().length === 0) {
      return channel.send("⚠️ News message cannot be empty.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    const newNews = new News( {
      userId,
      message,
    });
    await newNews.save();

    return channel.send(`✅ News created successfully! 📰\n"${message}" has been added to the developer news.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (err) {
    if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
      console.error(err);
    }
    return channel.send("⚠️ Failed to create news. Please try again.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export default {
  name: "news",
  description: "View the top recent developer news or stock market news.",
  aliases: ["newspaper"],
  args: "<list|stocks>",
  example: ["news list"],
  emoji: "🗞️",
  category: "📰 Information",
  cooldown: 10000,
  // 5 seconds cooldown

  execute: async (args, message) => {
    if (args[1] === "list") {
      // Fetch and display the top 5 recent news
      return getRecentNews(message.channel);
    } else if (args[1] === "stocks") {
      return sendNewspaper(message);
    } else if (args[1] === "create") {
      // Allow only the developer to create a news entry
      if (message.author.id !== DEVELOPER_ID) {
        return message.channel.send("⚠️ You are not authorized to use this command.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      if (args.length < 3) {
        return message.channel.send("⚠️ Usage: `news create <message>` to create a news article.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      const newsMessage = args.slice(2).join(" ");
      return createNews(message.author.id, newsMessage, message.channel);
    } else {
      // Invalid usage
      return message.channel.send("⚠️ Invalid subcommand! Use `news list` or `news stocks` to view the latest developer news.").catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
  },
};