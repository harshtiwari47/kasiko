import News from '../../../models/News.js';
import {
  Helper,
  handleMessage,
  discordUser
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

export async function getRecentNews(context) {
  try {
    const recentNews = await News.find().sort({
      createdAt: -1
    }).limit(5);
    if (recentNews.length === 0) {
      return handleMessage(context, "📰 No recent news available at the moment.");
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

    return handleMessage(context, {
      embeds: [newsEmbed]
    });
  } catch (err) {
    if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
      console.error(err);
    }
    return handleMessage(context, "⚠️ An error occurred while fetching the news.");
  }
}

export async function createNews(userId, messageContent, context) {
  try {
    if (!messageContent || messageContent.trim().length === 0) {
      return handleMessage(context, "⚠️ News message cannot be empty.");
    }

    const newNews = new News({
      userId,
      message: messageContent,
    });
    await newNews.save();

    return handleMessage(context, `✅ News created successfully! 📰\n"${messageContent}" has been added to the developer news.`);
  } catch (err) {
    if (err.message !== "Unknown Message" && err.message !== "Missing Permissions") {
      console.error(err);
    }
    return handleMessage(context, "⚠️ Failed to create news. Please try again.");
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

  execute: async (args, message) => {
    const user = discordUser(message);
    if (args[1] === "list") {
      // Fetch and display the top 5 recent news
      return getRecentNews(message);
    } else if (args[1] === "stocks") {
      return sendNewspaper(message);
    } else if (args[1] === "create") {
      // Allow only the developer to create a news entry
      if (user.id !== DEVELOPER_ID) {
        return handleMessage(message, "⚠️ You are not authorized to use this command.");
      }

      if (args.length < 3) {
        return handleMessage(message, "⚠️ Usage: `news create <message>` to create a news article.");
      }

      const newsMessage = args.slice(2).join(" ");
      return createNews(user.id, newsMessage, message);
    } else {
      // Invalid usage
      return handleMessage(message, "⚠️ Invalid subcommand! Use `news list` or `news stocks` to view the latest developer news.");
    }
  },
};