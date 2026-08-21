import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import { CHANNELS, COLORS } from '../../../constants.js';
import { handleMessage } from '../../../helper.js';
import crypto from 'crypto';

const CATEGORY_MAP = {
  bug: { name: "🐛 Bug Report", color: COLORS.DANGER },
  idea: { name: "💡 Feature Suggestion", color: COLORS.GOLD },
  ui: { name: "🎨 UI & Design", color: COLORS.PURPLE },
  general: { name: "🌟 General Feedback", color: COLORS.SUCCESS },
};

function generateFeedbackId() {
  return "FB-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

export default {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Submit suggestions, bug reports, or ideas directly to the developers.')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('The category of your feedback')
        .setRequired(false)
        .addChoices(
          { name: '🐛 Bug Report', value: 'bug' },
          { name: '💡 Feature Suggestion', value: 'idea' },
          { name: '🎨 UI & Design', value: 'ui' },
          { name: '🌟 General Feedback', value: 'general' },
        )
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Detailed explanation of your feedback or report')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const user = interaction.user;
      const guild = interaction.guild;
      const categoryKey = interaction.options.getString('category');
      const feedbackText = interaction.options.getString('message')?.trim();

      // If user invoked /feedback without arguments, show the interactive guide
      if (!feedbackText) {
        const guideEmbed = new EmbedBuilder()
          .setTitle("📬 Kasiko Community Feedback Hub")
          .setColor(COLORS.PRIMARY)
          .setDescription(
            `We love hearing from our community! Use this command to report bugs, suggest features, or share your thoughts with the development team.\n\n` +
            `🎁 **Rewards for Genuine Feedback**\n` +
            `Accepted feature suggestions and confirmed, helpful bug reports will be rewarded with in-game **Cash** (<:kasiko_coin:1300141236841086977>), **rare items**, or **exclusive contributor badges**!\n\n` +
            `### 📝 **How to Submit via Slash Command**\n` +
            `\`/feedback category:<choice> message:<your detailed message>\`\n\n` +
            `### 🏷️ **Supported Categories**\n` +
            `• 🐛 **\`Bug Report\`** — Glitches, calculation errors, or unintended behaviors.\n` +
            `• 💡 **\`Feature Suggestion\`** — New gameplay features, economy items, or commands.\n` +
            `• 🎨 **\`UI & Design\`** — Improvements to embeds, canvas graphics, and layout.\n` +
            `• 🌟 **\`General Feedback\`** — General balance feedback, reviews, and appreciation.\n\n` +
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

        return await handleMessage(interaction, {
          embeds: [guideEmbed],
          components: [row]
        });
      }

      const category = (categoryKey && CATEGORY_MAP[categoryKey]) ? CATEGORY_MAP[categoryKey] : CATEGORY_MAP.general;

      if (feedbackText.length < 10) {
        return handleMessage(interaction, {
          content: '⚠️ Please provide a more detailed message (minimum 10 characters).'
        });
      }

      if (feedbackText.length > 1500) {
        return handleMessage(interaction, {
          content: '⚠️ Your feedback is too long (maximum 1500 characters). Please keep it concise.'
        });
      }

      const feedbackId = generateFeedbackId();
      const feedbackChannelId = CHANNELS.FEEDBACK;

      if (feedbackChannelId) {
        try {
          const staffChannel = await interaction.client.channels.fetch(feedbackChannelId).catch(() => null);
          if (staffChannel && staffChannel.isTextBased()) {
            const staffEmbed = new EmbedBuilder()
              .setTitle(`📬 New Feedback: ${category.name}`)
              .setColor(category.color)
              .addFields(
                {
                  name: "👤 Submitter",
                  value: `<@${user.id}> (\`${user.username}\` · \`${user.id}\`)`,
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
              .setThumbnail(user.displayAvatarURL({ size: 64, extension: "png" }))
              .setFooter({ text: `Kasiko Feedback System • Status: Pending Review` })
              .setTimestamp();

            await staffChannel.send({ embeds: [staffEmbed] });
          }
        } catch (dispatchErr) {
          console.error("[SlashFeedback] Error dispatching to feedback channel:", dispatchErr);
        }
      }

      const userReceiptEmbed = new EmbedBuilder()
        .setTitle("✅ Feedback Received!")
        .setColor(COLORS.SUCCESS)
        .setDescription(
          `**Thank you, ${user.username}!** Your feedback has been sent directly to the development team.\n\n` +
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

      return await handleMessage(interaction, {
        embeds: [userReceiptEmbed],
        components: [actionRow]
      });

    } catch (error) {
      console.error('Error executing /feedback command:', error);
      return await handleMessage(interaction, {
        content: '⚠️ An error occurred while submitting your feedback. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
