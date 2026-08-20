import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  MessageFlags
} from 'discord.js';
import User from '../../../models/User.js';
import {
  getLatestCampaign,
  buildBroadcastContainer,
  DEFAULT_REVIVAL_CAMPAIGN
} from '../../../utils/broadcastEngine.js';

export default {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('View active events, claim event rewards, or manage notification settings.')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Action to perform')
        .setRequired(false)
        .addChoices(
          { name: '🎁 View Latest Event', value: 'view' },
          { name: '✨ Claim Event Rewards', value: 'claim' },
          { name: '🔔 Toggle Notifications', value: 'toggle' },
        )
    ),

  async execute(interaction) {
    try {
      if (!interaction.deferred) {
        await interaction.deferReply({ ephemeral: false });
      }

      const userId = interaction.user.id;
      const username = interaction.user.username;
      const action = interaction.options.getString('action') || 'view';

      let user = await User.findOne({ id: userId });
      if (!user) {
        user = new User({ id: userId, cash: 1000, inventory: {}, settings: { eventAlerts: true } });
        await user.save();
      }

      const campaign = await getLatestCampaign();
      const isClaimed = (user.claimedCampaigns || []).includes(campaign.campaignId);
      const eventAlerts = user.settings?.eventAlerts !== false;

      // ── Action: CLAIM ─────────────────────────────────────────────────────
      if (action === 'claim') {
        if (isClaimed) {
          return await interaction.editReply({
            content: `⚠️ **${username}**, you have already claimed the rewards for **${campaign.title}**!`
          });
        }

        const rewards = campaign.rewards;
        const incFields = {
          cash: rewards.cash || 0
        };
        for (const item of (rewards.items || [])) {
          incFields[`inventory.${item.id}`] = item.amount;
        }

        const updatedUser = await User.findOneAndUpdate(
          {
            id: userId,
            claimedCampaigns: { $ne: campaign.campaignId }
          },
          {
            $addToSet: { claimedCampaigns: campaign.campaignId },
            $inc: incFields
          },
          { new: true }
        );

        if (!updatedUser) {
          return await interaction.editReply({
            content: `⚠️ **${username}**, you have already claimed this event reward!`
          });
        }

        return await interaction.editReply({
          content:
            `🎉 **EVENT REWARDS CLAIMED!**\n\n` +
            `Your gift package has been added to your account:\n` +
            `• <:kasiko_coin:1300141236841086977> **+${rewards.cash.toLocaleString()} Cash**\n` +
            `• <:scratch_card:1382990344186105911> **+2 Scratch Cards**\n` +
            `• <:pet_food:1385884583077351464> **+5 Pet Food**\n` +
            `• <:rose:1343097565738172488> **+5 Roses**\n` +
            `• <:lollipop:1385131583333203968> **+3 Lollipops**\n` +
            `• <:teddybear:1385131451321946113> **+2 Teddy Bears**\n\n` +
            `Use \`kas inv\` to view your bag or \`kas use scratch\` to test your luck! 🍀`
        });
      }

      // ── Action: TOGGLE ────────────────────────────────────────────────────
      if (action === 'toggle') {
        if (!user.settings) user.settings = {};
        const newState = !eventAlerts;
        user.settings.eventAlerts = newState;
        await user.save();

        return await interaction.editReply({
          content: newState
            ? `🔔 **Event Notifications Enabled!** You will receive direct messages about special events, drops, and community rewards.`
            : `🔕 **Event Notifications Disabled.** You will no longer receive event broadcast DMs. You can re-enable anytime using \`/event action:Toggle Notifications\`.`
        });
      }

      // ── Action: VIEW (Default) ────────────────────────────────────────────
      const container = buildBroadcastContainer({
        username,
        campaign,
        isClaimed,
        eventAlerts
      });

      return await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      console.error('Error executing /event command:', error);
      return await interaction.editReply({
        content: '⚠️ An error occurred while fetching event information. Please try again later.'
      });
    }
  }
};
