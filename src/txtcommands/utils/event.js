import {
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import User from '../../../models/User.js';
import {
  getLatestCampaign,
  buildBroadcastContainer,
  DEFAULT_REVIVAL_CAMPAIGN,
  sendEventClaimLog
} from '../../../utils/broadcastEngine.js';
import { discordUser, handleMessage } from '../../../helper.js';

export default {
  name: 'event',
  description: 'View the latest community events, claim exclusive event rewards, or manage your notification preferences.',
  aliases: ['events', 'notify', 'notifications', 'latestevent', 'eventreward'],
  args: '[claim|on|off|toggle]',
  example: [
    'event',
    'event claim',
    'notify off',
    'notify on'
  ],
  cooldown: 5000,
  category: '🔧 Utility',

  execute: async (args, context) => {
    try {
      const { id: userId, username, name } = discordUser(context);
      const sub = (args[1] || '').toLowerCase();

      let user = await User.findOne({ id: userId });
      if (!user) {
        user = new User({ id: userId, cash: 1000, inventory: {}, settings: { eventAlerts: true } });
        await user.save();
      }

      const campaign = await getLatestCampaign();
      const isClaimed = (user.claimedCampaigns || []).includes(campaign.campaignId);
      const eventAlerts = user.settings?.eventAlerts !== false;

      // ── Subcommand: NOTIFICATION TOGGLE (on/off/toggle) ───────────────────
      if (sub === 'on' || sub === 'enable') {
        if (!user.settings) user.settings = {};
        user.settings.eventAlerts = true;
        await user.save();
        return handleMessage(context, {
          content: `🔔 **Event Notifications Enabled!** You will receive direct messages about special events, drops, and community rewards.`
        });
      }

      if (sub === 'off' || sub === 'disable') {
        if (!user.settings) user.settings = {};
        user.settings.eventAlerts = false;
        await user.save();
        return handleMessage(context, {
          content: `🔕 **Event Notifications Disabled.** You will no longer receive event broadcast DMs. You can re-enable anytime using \`kas event on\`.`
        });
      }

      if (sub === 'toggle') {
        if (!user.settings) user.settings = {};
        const newState = !eventAlerts;
        user.settings.eventAlerts = newState;
        await user.save();
        return handleMessage(context, {
          content: newState
            ? `🔔 **Event Notifications Enabled!**`
            : `🔕 **Event Notifications Disabled.**`
        });
      }

      // ── Subcommand: CLAIM ─────────────────────────────────────────────────
      if (sub === 'claim') {
        if (isClaimed) {
          return handleMessage(context, {
            content: `⚠️ **${name}**, you have already claimed the rewards for **${campaign.title}**!`
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
          return handleMessage(context, {
            content: `⚠️ **${name}**, you have already claimed this event reward!`
          });
        }

        // Send log to log channel and increment claim counter
        const { totalClaimed } = await sendEventClaimLog(context.client || context.channel?.client, {
          user: { id: userId, username, name },
          campaignId: campaign.campaignId,
          campaignTitle: campaign.title,
          rewards
        });

        return handleMessage(context, {
          content:
            `🎉 **EVENT REWARDS CLAIMED!** (Claim #${totalClaimed.toLocaleString()})\n\n` +
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

      // ── Default: Render Interactive Event Card ────────────────────────────
      const container = buildBroadcastContainer({
        username: name || username,
        campaign,
        isClaimed,
        eventAlerts
      });

      return await handleMessage(context, {
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

    } catch (err) {
      console.error('[EventCommand] Error:', err);
      return handleMessage(context, {
        content: `**Error**: ${err.message}`
      });
    }
  }
};
