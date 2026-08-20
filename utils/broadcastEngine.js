import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  EmbedBuilder
} from 'discord.js';
import Broadcast from '../models/Broadcast.js';
import User from '../models/User.js';
import { getUserData, updateUser } from '../database.js';
import { COLORS, CHANNELS } from '../constants.js';
import { sendErrorLog } from './errorLogger.js';

export const DEFAULT_REVIVAL_CAMPAIGN = {
  campaignId: 'revival_welcome_2026',
  title: '🌟 KASIKO IS BACK — YOUR WELCOME REWARD HAS ARRIVED!',
  description:
    `Hey there! Kasiko has received massive new gameplay updates & overhauls!\n\n` +
    `✨ **What's New in Kasiko:**\n` +
    `• <:spark:1355139233559351326> **Real-Time Stock Market:** Trade shares, build portfolios & track volume dynamics!\n` +
    `• <:forest_tree:1354366758596776070> **Animal Arena Battles:** Build your 3-animal team and battle wild beasts & players!\n` +
    `• <:moneybag:1365976001179553792> **Automated Daily Cash Drops:** 500k to 2M Cash giveaways daily in our server!\n` +
    `• <:cart:1355034533061460060> **Expanded Inventory & Economy:** Smooth purchasing, animal feeds & new items!`,
  rewards: {
    cash: 250000,
    items: [
      { id: 'scratch_card', amount: 2, name: 'Scratch Cards', emoji: '<:scratch_card:1382990344186105911>' },
      { id: 'food', amount: 5, name: 'Pet Food', emoji: '<:pet_food:1385884583077351464>' },
      { id: 'rose', amount: 5, name: 'Roses', emoji: '<:rose:1343097565738172488>' },
      { id: 'lollipop', amount: 3, name: 'Lollipops', emoji: '<:lollipop:1385131583333203968>' },
      { id: 'teddy', amount: 2, name: 'Teddy Bears', emoji: '<:teddybear:1385131451321946113>' }
    ]
  }
};

// In-memory queue state
let isQueueRunning = false;
let isQueuePaused = false;

/**
 * Build the interactive Discord Container for the broadcast DM.
 */
export function buildBroadcastContainer({
  username = 'Player',
  campaign = DEFAULT_REVIVAL_CAMPAIGN,
  isClaimed = false,
  eventAlerts = true
}) {
  const C = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(t => t.setContent(`### ${campaign.title}`))
    .addSeparatorComponents(s => s)
    .addTextDisplayComponents(t => t.setContent(
      `Hello **${username}**!\n\n${campaign.description}\n\n` +
      `🎁 **Your Welcome Back Gift Package:**\n` +
      `• <:kasiko_coin:1300141236841086977> **250,000 Cash**\n` +
      `• <:scratch_card:1382990344186105911> **2× Scratch Cards**\n` +
      `• <:pet_food:1385884583077351464> **5× Pet Food**\n` +
      `• <:rose:1343097565738172488> **5× Roses**\n` +
      `• <:lollipop:1385131583333203968> **3× Lollipops**\n` +
      `• <:teddybear:1385131451321946113> **2× Teddy Bears**`
    ))
    .addSeparatorComponents(s => s);

  // Row 1: Claim Rewards & Guide Buttons
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`broadcast_claim_${campaign.campaignId}`)
      .setLabel(isClaimed ? '✅ Rewards Claimed' : '🎁 Claim Welcome Rewards')
      .setStyle(isClaimed ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(isClaimed),
    new ButtonBuilder()
      .setCustomId('broadcast_guide')
      .setLabel('📖 Guide & Commands')
      .setStyle(ButtonStyle.Primary)
  );

  // Row 2: Support Server Link & Notification Preference Toggle
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🌐 Join Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/DVFwCqUZnc'),
    new ButtonBuilder()
      .setCustomId('broadcast_toggle_notify')
      .setLabel(eventAlerts ? '🔔 Notifications: ON' : '🔕 Notifications: OFF')
      .setStyle(eventAlerts ? ButtonStyle.Secondary : ButtonStyle.Danger)
  );

  C.addActionRowComponents(actionRow => actionRow.addComponents(row1.components));
  C.addActionRowComponents(actionRow => actionRow.addComponents(row2.components));

  return C;
}

/**
 * Send a single test broadcast DM to the executing owner.
 */
export async function sendTestBroadcast(client, userId) {
  try {
    const discordUser = await client.users.fetch(userId);
    if (!discordUser) throw new Error('User not found.');

    const userDoc = await User.findOne({ id: userId });
    const isClaimed = userDoc?.claimedCampaigns?.includes(DEFAULT_REVIVAL_CAMPAIGN.campaignId) || false;
    const eventAlerts = userDoc?.settings?.eventAlerts !== false;

    const container = buildBroadcastContainer({
      username: discordUser.username,
      campaign: DEFAULT_REVIVAL_CAMPAIGN,
      isClaimed,
      eventAlerts
    });

    await discordUser.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    return { success: true, username: discordUser.username };
  } catch (err) {
    console.error('[BroadcastEngine] Error sending test broadcast:', err);
    throw err;
  }
}

/**
 * Start or resume the rate-limited broadcast background queue.
 * Processes 1 user every 2500ms (~24 DMs/min) to adhere to Discord limits.
 */
export async function startBroadcastQueue(client, campaignId = DEFAULT_REVIVAL_CAMPAIGN.campaignId, reportChannelId = null) {
  if (isQueueRunning && !isQueuePaused) {
    throw new Error('A broadcast queue is already actively running.');
  }

  let campaignDoc = await Broadcast.findOne({ campaignId });
  if (!campaignDoc) {
    campaignDoc = new Broadcast({
      campaignId,
      title: DEFAULT_REVIVAL_CAMPAIGN.title,
      description: DEFAULT_REVIVAL_CAMPAIGN.description,
      rewards: {
        cash: DEFAULT_REVIVAL_CAMPAIGN.rewards.cash,
        items: DEFAULT_REVIVAL_CAMPAIGN.rewards.items.map(i => ({ id: i.id, amount: i.amount }))
      },
      status: 'running',
      reportChannelId
    });
    await campaignDoc.save();
  } else {
    campaignDoc.status = 'running';
    if (reportChannelId) campaignDoc.reportChannelId = reportChannelId;
    await campaignDoc.save();
  }

  isQueueRunning = true;
  isQueuePaused = false;

  // Run in background without blocking
  (async () => {
    try {
      console.log(`[BroadcastEngine] 🚀 Starting broadcast queue for campaign: ${campaignId}`);

      const allUsers = await User.find({ isBan: { $ne: true } }).select('id settings claimedCampaigns').lean();
      campaignDoc.totalTargetUsers = allUsers.length;
      await campaignDoc.save();

      const processedSet = new Set(campaignDoc.processedUserIds || []);
      const reportChannel = campaignDoc.reportChannelId ? await client.channels.fetch(campaignDoc.reportChannelId).catch(() => null) : null;

      let counterSinceLastReport = 0;

      for (const userEntry of allUsers) {
        if (isQueuePaused || !isQueueRunning) {
          console.log('[BroadcastEngine] Queue paused or stopped.');
          break;
        }

        const userId = userEntry.id;
        if (!userId || processedSet.has(userId)) continue;

        // Check user notification preference
        if (userEntry.settings?.dm === false || userEntry.settings?.eventAlerts === false) {
          campaignDoc.optedOutCount += 1;
          campaignDoc.processedUserIds.push(userId);
          processedSet.add(userId);
          continue;
        }

        // Send DM
        try {
          const targetDiscordUser = await client.users.fetch(userId).catch(() => null);
          if (!targetDiscordUser) {
            campaignDoc.failedCount += 1;
          } else {
            const isClaimed = (userEntry.claimedCampaigns || []).includes(campaignId);
            const container = buildBroadcastContainer({
              username: targetDiscordUser.username,
              campaign: DEFAULT_REVIVAL_CAMPAIGN,
              isClaimed,
              eventAlerts: true
            });

            await targetDiscordUser.send({
              components: [container],
              flags: MessageFlags.IsComponentsV2
            });

            campaignDoc.sentCount += 1;
          }
        } catch (sendErr) {
          if (sendErr.code === 50007 || sendErr.code === 50001) {
            // Closed DMs / no mutual guild / blocked
            campaignDoc.closedDmCount += 1;
          } else {
            campaignDoc.failedCount += 1;
            console.error(`[BroadcastEngine] Error sending DM to ${userId}:`, sendErr.message);
          }
        }

        campaignDoc.processedUserIds.push(userId);
        processedSet.add(userId);
        campaignDoc.lastProcessedAt = new Date();
        counterSinceLastReport++;

        // Send live status report every 20 users
        if (counterSinceLastReport >= 20) {
          counterSinceLastReport = 0;
          await campaignDoc.save();

          if (reportChannel && reportChannel.isTextBased()) {
            const remaining = Math.max(0, campaignDoc.totalTargetUsers - campaignDoc.processedUserIds.length);
            const statusEmbed = new EmbedBuilder()
              .setTitle('📊 Broadcast Progress Update')
              .setColor(COLORS.PRIMARY)
              .setDescription(
                `**Campaign:** \`${campaignDoc.campaignId}\`\n\n` +
                `• ✅ **Sent:** \`${campaignDoc.sentCount}\`\n` +
                `• 🔒 **Closed DMs:** \`${campaignDoc.closedDmCount}\`\n` +
                `• 🔕 **Opted-Out:** \`${campaignDoc.optedOutCount}\`\n` +
                `• ❌ **Failed:** \`${campaignDoc.failedCount}\`\n` +
                `• ⏳ **Remaining:** \`${remaining}\` / \`${campaignDoc.totalTargetUsers}\``
              )
              .setFooter({ text: 'Rate-limit: 1 DM / 2.5s • Safe Mode' })
              .setTimestamp();

            await reportChannel.send({ embeds: [statusEmbed] }).catch(() => {});
          }
        }

        // Token bucket delay: 2.5s
        await new Promise(r => setTimeout(r, 2500));
      }

      // Conclude queue
      if (!isQueuePaused) {
        campaignDoc.status = 'completed';
        isQueueRunning = false;
        await campaignDoc.save();

        if (reportChannel && reportChannel.isTextBased()) {
          const completeEmbed = new EmbedBuilder()
            .setTitle('🎉 Broadcast Campaign Completed!')
            .setColor(COLORS.SUCCESS)
            .setDescription(
              `**Campaign:** \`${campaignDoc.campaignId}\` has finished broadcasting.\n\n` +
              `• ✅ **Total Sent:** \`${campaignDoc.sentCount}\`\n` +
              `• 🔒 **Closed DMs:** \`${campaignDoc.closedDmCount}\`\n` +
              `• 🔕 **Opted-Out:** \`${campaignDoc.optedOutCount}\`\n` +
              `• ❌ **Failed:** \`${campaignDoc.failedCount}\`\n` +
              `• 👥 **Total Processed:** \`${campaignDoc.processedUserIds.length}\` / \`${campaignDoc.totalTargetUsers}\``
            )
            .setTimestamp();

          await reportChannel.send({ embeds: [completeEmbed] }).catch(() => {});
        }
      }

    } catch (queueErr) {
      console.error('[BroadcastEngine] Fatal queue error:', queueErr);
      isQueueRunning = false;
      if (campaignDoc) {
        campaignDoc.status = 'paused';
        await campaignDoc.save().catch(() => {});
      }
    }
  })();

  return campaignDoc;
}

/**
 * Pause the active broadcast queue.
 */
export async function pauseBroadcastQueue(campaignId = DEFAULT_REVIVAL_CAMPAIGN.campaignId) {
  isQueuePaused = true;
  isQueueRunning = false;

  const doc = await Broadcast.findOne({ campaignId });
  if (doc) {
    doc.status = 'paused';
    await doc.save();
  }
  return doc;
}

/**
 * Get current broadcast status.
 */
export async function getBroadcastStatus(campaignId = DEFAULT_REVIVAL_CAMPAIGN.campaignId) {
  const doc = await Broadcast.findOne({ campaignId });
  if (!doc) return null;

  const remaining = Math.max(0, doc.totalTargetUsers - (doc.processedUserIds?.length || 0));
  return {
    campaignId: doc.campaignId,
    status: doc.status,
    totalTargetUsers: doc.totalTargetUsers,
    sentCount: doc.sentCount,
    closedDmCount: doc.closedDmCount,
    optedOutCount: doc.optedOutCount,
    failedCount: doc.failedCount,
    processedCount: doc.processedUserIds?.length || 0,
    remaining,
    isRunning: isQueueRunning && !isQueuePaused
  };
}

/**
 * Get the latest active campaign or fallback default.
 */
export async function getLatestCampaign() {
  const latest = await Broadcast.findOne().sort({ createdAt: -1 });
  if (latest) {
    return {
      campaignId: latest.campaignId,
      title: latest.title,
      description: latest.description,
      rewards: {
        cash: latest.rewards?.cash || 250000,
        items: latest.rewards?.items?.length ? latest.rewards.items : DEFAULT_REVIVAL_CAMPAIGN.rewards.items
      }
    };
  }
  return DEFAULT_REVIVAL_CAMPAIGN;
}

/**
 * Handle user clicking [ 🎁 Claim Rewards ].
 */
export async function handleClaimBroadcastReward(interaction) {
  try {
    const userId = interaction.user.id;
    const campaignId = interaction.customId.replace('broadcast_claim_', '') || DEFAULT_REVIVAL_CAMPAIGN.campaignId;
    const campaign = await getLatestCampaign();
    const rewards = campaign.rewards;

    // Build atomic increment object for items and cash
    const incFields = {
      cash: rewards.cash || 0
    };
    for (const item of (rewards.items || [])) {
      incFields[`inventory.${item.id}`] = item.amount;
    }

    // Atomic update preventing double-claiming
    const updatedUser = await User.findOneAndUpdate(
      {
        id: userId,
        claimedCampaigns: { $ne: campaignId }
      },
      {
        $addToSet: { claimedCampaigns: campaignId },
        $inc: incFields
      },
      { new: true }
    );

    if (!updatedUser) {
      return await interaction.reply({
        content: '⚠️ **You have already claimed this event reward!**',
        ephemeral: true
      });
    }

    // Ephemeral confirmation
    await interaction.reply({
      content:
        `🎉 **EVENT REWARDS CLAIMED!**\n\n` +
        `Your gift package has been added to your account:\n` +
        `• <:kasiko_coin:1300141236841086977> **+${rewards.cash.toLocaleString()} Cash**\n` +
        `• <:scratch_card:1382990344186105911> **+2 Scratch Cards**\n` +
        `• <:pet_food:1385884583077351464> **+5 Pet Food**\n` +
        `• <:rose:1343097565738172488> **+5 Roses**\n` +
        `• <:lollipop:1385131583333203968> **+3 Lollipops**\n` +
        `• <:teddybear:1385131451321946113> **+2 Teddy Bears**\n\n` +
        `Use \`kas inv\` to view your bag or \`kas use scratch\` to test your luck! 🍀`,
      ephemeral: true
    });

    // Update message button to claimed state
    try {
      const updatedContainer = buildBroadcastContainer({
        username: interaction.user.username,
        campaign,
        isClaimed: true,
        eventAlerts: updatedUser.settings?.eventAlerts !== false
      });

      await interaction.message.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } catch (_) {}

  } catch (error) {
    console.error('[BroadcastEngine] Error claiming reward:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ An error occurred while claiming your reward. Please try again.',
          ephemeral: true
        });
      }
    } catch (_) {}
  }
}

/**
 * Handle user clicking [ 📖 Guide & Commands ].
 */
export async function handleGuideModalOrReply(interaction) {
  try {
    const guideContent =
      `### 📖 **Kasiko Quick Command Guide**\n\n` +
      `• 💰 **Economy:** \`kas daily\`, \`kas work\`, \`kas crime\`, \`kas beg\`, \`kas balance\`\n` +
      `• 📈 **Stocks:** \`kas stocks\`, \`kas buy stock <name> <shares>\`, \`kas portfolio\`\n` +
      `• 🦌 **Wildlife:** \`kas hunt\`, \`kas ab\` (Animal Battle), \`kas feed\`, \`kas team\`\n` +
      `• 🛍️ **Shop & Inventory:** \`kas shop\`, \`kas buy <item>\`, \`kas inv\`, \`kas use scratch\`\n` +
      `• 💍 **Social & Marriage:** \`kas marry @user\`, \`kas share rose @user\`, \`kas profile\`\n` +
      `• 🎁 **Giveaways:** \`kas giveaway\`\n` +
      `• 📬 **Feedback:** \`kas feedback <bug|idea> <message>\`\n\n` +
      `*Type \`kas help\` in any server channel to explore full documentation!*`;

    return await interaction.reply({
      content: guideContent,
      ephemeral: true
    });
  } catch (error) {
    console.error('[BroadcastEngine] Error showing guide:', error);
  }
}

/**
 * Handle user clicking [ 🔕 Notifications: ON/OFF ].
 */
export async function handleToggleNotification(interaction) {
  try {
    const userId = interaction.user.id;
    let user = await User.findOne({ id: userId });
    if (!user) {
      user = new User({ id: userId, settings: { eventAlerts: true } });
    }

    if (!user.settings) user.settings = {};
    const currentState = user.settings.eventAlerts !== false;
    const newState = !currentState;
    user.settings.eventAlerts = newState;
    await user.save();

    const isClaimed = user.claimedCampaigns?.includes(DEFAULT_REVIVAL_CAMPAIGN.campaignId) || false;

    // Ephemeral response
    await interaction.reply({
      content: newState
        ? `🔔 **Event Notifications Enabled!** You will receive alerts about special events, drops, and community rewards.`
        : `🔕 **Event Notifications Disabled.** You will no longer receive event broadcast DMs. You can re-enable anytime!`,
      ephemeral: true
    });

    // Update message button
    try {
      const updatedContainer = buildBroadcastContainer({
        username: interaction.user.username,
        campaign: DEFAULT_REVIVAL_CAMPAIGN,
        isClaimed,
        eventAlerts: newState
      });

      await interaction.message.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } catch (_) {}

  } catch (error) {
    console.error('[BroadcastEngine] Error toggling notifications:', error);
  }
}
