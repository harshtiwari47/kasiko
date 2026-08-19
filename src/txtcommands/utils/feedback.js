import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import { CHANNELS, COLORS } from "../../../constants.js";
import crypto from "crypto";

const CATEGORY_MAP = {
  bug: { name: "🐛 Bug Report", color: COLORS.DANGER, key: "BUG" },
  glitch: { name: "🐛 Bug Report", color: COLORS.DANGER, key: "BUG" },
  error: { name: "🐛 Bug Report", color: COLORS.DANGER, key: "BUG" },
  idea: { name: "💡 Feature Suggestion", color: COLORS.GOLD, key: "IDEA" },
  suggest: { name: "💡 Feature Suggestion", color: COLORS.GOLD, key: "IDEA" },
  suggestion: { name: "💡 Feature Suggestion", color: COLORS.GOLD, key: "IDEA" },
  feature: { name: "💡 Feature Suggestion", color: COLORS.GOLD, key: "IDEA" },
  review: { name: "🌟 General Review", color: COLORS.SUCCESS, key: "REVIEW" },
  general: { name: "🌟 General Feedback", color: COLORS.PRIMARY, key: "GENERAL" },
  ui: { name: "🎨 UI & Design Feedback", color: COLORS.PURPLE, key: "UI" },
  design: { name: "🎨 UI & Design Feedback", color: COLORS.PURPLE, key: "UI" },
};

function generateFeedbackId() {
  return "FB-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

export default {
  name: "feedback",
  description: "Submit suggestions, bug reports, and ideas directly to the bot developers.",
  aliases: ["suggest", "suggestion", "bugreport", "reportbug", "feedbacks"],
  args: "[category] <message>",
  example: [
    "feedback bug Animal battle canvas text wraps weirdly",
    "feedback idea Add clan wars with weekly leaderboards",
    "suggest Make stock prices react faster to trading volume"
  ],
  cooldown: 30000,
  category: "🔧 Utility",

  execute: async (args, message) => {
    try {
      const author = message.author;
      const guild = message.guild;

      // If invoked with no arguments, display interactive instructions guide
      if (!args[1]) {
        const guideEmbed = new EmbedBuilder()
          .setTitle("📬 Kasiko Community Feedback Hub")
          .setColor(COLORS.PRIMARY)
          .setDescription(
            `We love hearing from our community! Use this command to report bugs, suggest features, or share your thoughts with the development team.\n\n` +
            `🎁 **Rewards for Genuine Feedback**\n` +
            `Accepted feature suggestions and confirmed, helpful bug reports will be rewarded with in-game **Cash** (<:kasiko_coin:1300141236841086977>), **rare items**, or **exclusive contributor badges**!\n\n` +
            `### 📝 **How to Submit Feedback**\n` +
            `\`kas feedback <category> <your detailed message>\`\n` +
            `*Aliases:* \`kas suggest\`, \`kas bugreport\`\n\n` +
            `### 🏷️ **Supported Categories**\n` +
            `• 🐛 **\`bug\`** — Glitches, calculation errors, or unintended behaviors.\n` +
            `• 💡 **\`idea\`** / **\`suggest\`** — New gameplay features, economy items, or commands.\n` +
            `• 🎨 **\`ui\`** — Improvements to embeds, canvas graphics, and layout.\n` +
            `• 🌟 **\`general\`** — General balance feedback, reviews, and appreciation.\n\n` +
            `### ✅ **What TO Include**\n` +
            `• Clear and specific explanation of your idea or issue.\n` +
            `• Exact command names involved (e.g. \`animalbattle\`, \`stocks\`, \`bank\`).\n` +
            `• Steps to reproduce (if reporting a bug).\n\n` +
            `### ❌ **What NOT To Include**\n` +
            `• Passwords, bot tokens, or private sensitive info.\n` +
            `• Profanity, toxicity, or spam.\n` +
            `• Asking for free coins, items, or staff roles.\n` +
            `• Vague reports like *"it doesn't work"* without details.`
          )
          .setFooter({
            text: "Every submission is reviewed by our team • Thank you for helping us improve!"
          })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Join Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/DVFwCqUZnc")
        );

        return message.reply({
          embeds: [guideEmbed],
          components: [row]
        }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
      }

      // Parse Category & Message
      let categoryInput = args[1].toLowerCase();
      let feedbackText = "";
      let category = CATEGORY_MAP[categoryInput];

      if (category) {
        feedbackText = args.slice(2).join(" ").trim();
      } else {
        // If first argument is not a known category, treat all args as general feedback
        category = CATEGORY_MAP.general;
        feedbackText = args.slice(1).join(" ").trim();
      }

      // Validate minimum length
      if (feedbackText.length < 10) {
        return message.reply(
          `<:warning:1366050875243757699> **${author.username}**, please provide a more detailed message (minimum 10 characters).\n` +
          `**Usage:** \`kas feedback <category> <detailed message>\``
        );
      }

      // Validate maximum length
      if (feedbackText.length > 1500) {
        return message.reply(
          `<:warning:1366050875243757699> **${author.username}**, your feedback is too long (maximum 1500 characters). Please keep it concise.`
        );
      }

      const feedbackId = generateFeedbackId();

      // Dispatch to Staff Feedback Channel
      const feedbackChannelId = CHANNELS.FEEDBACK;

      if (feedbackChannelId) {
        try {
          const staffChannel = await message.client.channels.fetch(feedbackChannelId).catch(() => null);
          if (staffChannel && staffChannel.isTextBased()) {
            const staffEmbed = new EmbedBuilder()
              .setTitle(`📬 New Feedback: ${category.name}`)
              .setColor(category.color)
              .addFields(
                {
                  name: "👤 Submitter",
                  value: `<@${author.id}> (\`${author.username}\` · \`${author.id}\`)`,
                  inline: true
                },
                {
                  name: "🌐 Location",
                  value: guild ? `**${guild.name}** (\`${guild.id}\`)` : "Direct Messages",
                  inline: true
                },
                {
                  name: "🆔 Ticket ID",
                  value: `\`${feedbackId}\``,
                  inline: true
                },
                {
                  name: "📝 Feedback Details",
                  value: feedbackText
                }
              )
              .setThumbnail(author.displayAvatarURL({ size: 64, extension: "png" }))
              .setFooter({ text: `Kasiko Feedback System • Status: Pending Review` })
              .setTimestamp();

            await staffChannel.send({ embeds: [staffEmbed] });
          }
        } catch (dispatchErr) {
          console.error("[FeedbackCommand] Error dispatching to feedback channel:", dispatchErr);
        }
      }

      // Send User Receipt & Confirmation
      const userReceiptEmbed = new EmbedBuilder()
        .setTitle("✅ Feedback Received!")
        .setColor(COLORS.SUCCESS)
        .setDescription(
          `**Thank you, ${author.username}!** Your feedback has been sent directly to the development team.\n\n` +
          `**Category:** ${category.name}\n` +
          `**Ticket ID:** \`${feedbackId}\`\n\n` +
          `> *"${feedbackText.length > 250 ? feedbackText.substring(0, 247) + "..." : feedbackText}"*\n\n` +
          `🎁 **Rewards Notice:** Accepted feature ideas and confirmed bug reports will be rewarded with in-game **Cash** (<:kasiko_coin:1300141236841086977>), **items**, or **exclusive badges**!`
        )
        .setFooter({ text: `Ticket ${feedbackId} • Thank you for supporting Kasiko!` })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join Support Community")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/DVFwCqUZnc")
      );

      return message.reply({
        embeds: [userReceiptEmbed],
        components: [actionRow]
      }).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

    } catch (err) {
      console.error("[FeedbackCommand] Error executing command:", err);
      return message.reply("<:alert:1366050815089053808> An error occurred while submitting your feedback. Please try again later.");
    }
  },
};
