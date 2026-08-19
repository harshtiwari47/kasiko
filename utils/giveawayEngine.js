import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import Giveaway from '../models/Giveaway.js';
import { CHANNELS, COLORS, GIVEAWAY_CONFIG } from '../constants.js';
import { getUserData, updateUser } from '../database.js';
import { sendErrorLog } from './errorLogger.js';

/**
 * Generate a random prize amount between 500k and 2M rounded to 10k intervals.
 */
export function generateDailyPrize() {
  const min = GIVEAWAY_CONFIG.MIN_PRIZE || 500000;
  const max = GIVEAWAY_CONFIG.MAX_PRIZE || 2000000;
  const step = 10000;
  const steps = Math.floor((max - min) / step);
  return min + (Math.floor(Math.random() * (steps + 1)) * step);
}

/**
 * Launch a daily cash giveaway.
 */
export async function startDailyGiveaway(client, options = {}) {
  try {
    if (!client?.isReady()) {
      console.warn('[GiveawayEngine] Client not ready to start giveaway.');
      return null;
    }

    const channelId = options.channelId || CHANNELS.GIVEAWAY;
    if (!channelId) {
      console.error('[GiveawayEngine] No giveaway channel configured.');
      return null;
    }

    const channel = await client.channels.fetch(channelId).catch(err => {
      console.error(`[GiveawayEngine] Failed to fetch channel ${channelId}:`, err.message);
      return null;
    });

    if (!channel || !channel.isTextBased()) {
      console.error(`[GiveawayEngine] Channel ${channelId} is invalid or not text-based.`);
      return null;
    }

    const prize = options.prize || generateDailyPrize();
    const durationHours = options.durationHours || GIVEAWAY_CONFIG.DEFAULT_DURATION_HOURS || 24;
    const alertRoleId = options.alertRoleId !== undefined ? options.alertRoleId : GIVEAWAY_CONFIG.ALERT_ROLE_ID;

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + (durationHours * 60 * 60 * 1000));
    const endTimestamp = Math.floor(endsAt.getTime() / 1000);

    // Initial Embed
    const embed = new EmbedBuilder()
      .setTitle('🎉 DAILY CASH GIVEAWAY 🎉')
      .setColor(COLORS.GOLD)
      .setDescription(
        `A new daily cash drop has landed! Click the **Enter Giveaway** button below for your chance to win!\n\n` +
        `💰 **Prize:** <:kasiko_coin:1300141236841086977> **${prize.toLocaleString()} Cash**\n` +
        `⏰ **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n` +
        `👥 **Entries:** \`0 entered\`\n` +
        `👑 **Host:** Kasiko Daily Drops`
      )
      .setFooter({ text: 'Kasiko Automated Giveaways • 1 Winner Selected at Timer End' })
      .setTimestamp(endsAt);

    // Temporary button before sending
    const initialRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter_temp')
        .setLabel('🎉 Enter Giveaway (0)')
        .setStyle(ButtonStyle.Success)
    );

    // Mention alert role if configured
    let content = '';
    if (alertRoleId) {
      if (alertRoleId.toLowerCase() === 'everyone') content = '@everyone';
      else if (alertRoleId.toLowerCase() === 'here') content = '@here';
      else content = `<@&${alertRoleId}>`;
    }

    const sentMessage = await channel.send({
      content: content.trim() ? content : undefined,
      embeds: [embed],
      components: [initialRow]
    });

    // Update customId to include the actual messageId
    const actualRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${sentMessage.id}`)
        .setLabel('🎉 Enter Giveaway (0)')
        .setStyle(ButtonStyle.Success)
    );

    await sentMessage.edit({ components: [actualRow] }).catch(() => {});

    // Save to Database
    const giveawayDoc = new Giveaway({
      messageId: sentMessage.id,
      channelId: channel.id,
      guildId: channel.guild?.id || null,
      prize,
      alertRoleId: alertRoleId || null,
      startedAt,
      endsAt,
      ended: false,
      winnerId: null,
      entries: [],
      entryCount: 0,
      isDaily: options.isDaily !== undefined ? options.isDaily : true
    });

    await giveawayDoc.save();
    console.log(`[GiveawayEngine] ✅ Daily giveaway started: ${prize.toLocaleString()} Cash (Message: ${sentMessage.id})`);
    return giveawayDoc;

  } catch (error) {
    console.error('[GiveawayEngine] Error starting daily giveaway:', error);
    sendErrorLog(error, { source: 'GiveawayEngine.startDailyGiveaway' }).catch(() => {});
    return null;
  }
}

/**
 * Handle user clicking the enter giveaway button.
 */
export async function handleGiveawayEntry(interaction) {
  try {
    const customId = interaction.customId;
    const messageId = customId.replace('giveaway_enter_', '');
    const userId = interaction.user.id;

    const giveaway = await Giveaway.findOne({ messageId });

    if (!giveaway) {
      return interaction.reply({
        content: '⚠️ This giveaway could not be found or has expired.',
        ephemeral: true
      });
    }

    if (giveaway.ended || giveaway.endsAt <= new Date()) {
      return interaction.reply({
        content: '⚠️ This giveaway has already ended!',
        ephemeral: true
      });
    }

    // Check if user already entered
    if (giveaway.entries.includes(userId)) {
      return interaction.reply({
        content: `✅ **You are already entered in this giveaway!**\n💰 **Prize:** <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**\n🍀 Good luck!`,
        ephemeral: true
      });
    }

    // Atomically add user entry to prevent race conditions
    const updated = await Giveaway.findOneAndUpdate(
      {
        messageId,
        ended: false,
        entries: { $ne: userId }
      },
      {
        $addToSet: { entries: userId },
        $inc: { entryCount: 1 }
      },
      { new: true }
    );

    if (!updated) {
      return interaction.reply({
        content: `✅ **You are already entered in this giveaway!**`,
        ephemeral: true
      });
    }

    // Send ephemeral confirmation to user
    await interaction.reply({
      content: `🎉 **Entry Confirmed!** You have entered the giveaway for <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**! 🍀`,
      ephemeral: true
    });

    // Periodically update the message button label with current entry count
    try {
      const endTimestamp = Math.floor(updated.endsAt.getTime() / 1000);
      const updatedEmbed = new EmbedBuilder()
        .setTitle('🎉 DAILY CASH GIVEAWAY 🎉')
        .setColor(COLORS.GOLD)
        .setDescription(
          `A new daily cash drop has landed! Click the **Enter Giveaway** button below for your chance to win!\n\n` +
          `💰 **Prize:** <:kasiko_coin:1300141236841086977> **${updated.prize.toLocaleString()} Cash**\n` +
          `⏰ **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n` +
          `👥 **Entries:** \`${updated.entryCount} entered\`\n` +
          `👑 **Host:** Kasiko Daily Drops`
        )
        .setFooter({ text: 'Kasiko Automated Giveaways • 1 Winner Selected at Timer End' })
        .setTimestamp(updated.endsAt);

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${updated.messageId}`)
          .setLabel(`🎉 Enter Giveaway (${updated.entryCount})`)
          .setStyle(ButtonStyle.Success)
      );

      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [updatedRow]
      }).catch(() => {});
    } catch (_) { /* ignore edit errors */ }

  } catch (error) {
    console.error('[GiveawayEngine] Error handling giveaway entry:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ An error occurred while registering your entry. Please try again.',
          ephemeral: true
        });
      }
    } catch (_) {}
  }
}

/**
 * Conclude and resolve a giveaway: select winner, grant cash, update cards, post celebration.
 */
export async function resolveGiveaway(giveawayIdOrDoc, client) {
  try {
    let giveaway = typeof giveawayIdOrDoc === 'string'
      ? await Giveaway.findById(giveawayIdOrDoc)
      : giveawayIdOrDoc;

    if (!giveaway || giveaway.ended) return null;

    giveaway.ended = true;

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);

    // ── Scenario A: No Entries ───────────────────────────────────────────────
    if (!giveaway.entries || giveaway.entries.length === 0) {
      await giveaway.save();
      console.log(`[GiveawayEngine] Giveaway ${giveaway.messageId} ended with 0 entries.`);

      if (channel && channel.isTextBased()) {
        try {
          const originalMsg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
          if (originalMsg) {
            const endedEmbed = new EmbedBuilder()
              .setTitle('🎉 DAILY CASH GIVEAWAY [ENDED] 🎉')
              .setColor(COLORS.DANGER)
              .setDescription(
                `This giveaway has concluded.\n\n` +
                `💰 **Prize:** <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**\n` +
                `❌ **Winner:** *No entries received*\n` +
                `👥 **Total Entries:** \`0\``
              )
              .setFooter({ text: 'Giveaway Ended' })
              .setTimestamp();

            const disabledRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`giveaway_ended_${giveaway.messageId}`)
                .setLabel('Ended (0 entries)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );

            await originalMsg.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
          }

          // Follow-up announcement
          const noEntriesEmbed = new EmbedBuilder()
            .setTitle('📢 Daily Giveaway Concluded')
            .setColor(COLORS.WARNING)
            .setDescription(
              `The daily giveaway for <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash** has ended with no participants.\n` +
              `The prize pool will roll over to the next daily drop!`
            )
            .setFooter({ text: 'Kasiko Automated Giveaways' })
            .setTimestamp();

          await channel.send({ embeds: [noEntriesEmbed] });
        } catch (e) {
          console.error('[GiveawayEngine] Error sending no-entry message:', e);
        }
      }
      return giveaway;
    }

    // ── Scenario B: Winner Selection ─────────────────────────────────────────
    const winnerId = giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)];
    giveaway.winnerId = winnerId;
    await giveaway.save();

    // Safely credit cash to winner
    try {
      const userData = await getUserData(winnerId);
      if (userData) {
        const currentCash = userData.cash || 0;
        await updateUser(winnerId, { cash: currentCash + giveaway.prize });
        console.log(`[GiveawayEngine] ✅ Credited ${giveaway.prize.toLocaleString()} Cash to winner ${winnerId}`);
      }
    } catch (cashErr) {
      console.error(`[GiveawayEngine] Error crediting cash to winner ${winnerId}:`, cashErr);
    }

    // Update original message and post celebratory follow-up in channel
    if (channel && channel.isTextBased()) {
      try {
        let winnerUser = null;
        try {
          winnerUser = await client.users.fetch(winnerId).catch(() => null);
        } catch (_) {}

        const winnerTag = winnerUser ? winnerUser.username : `<@${winnerId}>`;

        const originalMsg = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (originalMsg) {
          const endedEmbed = new EmbedBuilder()
            .setTitle('🎉 DAILY CASH GIVEAWAY [ENDED] 🎉')
            .setColor(COLORS.SUCCESS)
            .setDescription(
              `This giveaway has concluded!\n\n` +
              `💰 **Prize:** <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**\n` +
              `🏆 **Winner:** <@${winnerId}> (\`${winnerTag}\`)\n` +
              `👥 **Total Entries:** \`${giveaway.entries.length} participants\``
            )
            .setFooter({ text: 'Giveaway Concluded' })
            .setTimestamp();

          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`giveaway_ended_${giveaway.messageId}`)
              .setLabel(`Ended (Winner: ${winnerTag})`)
              .setStyle(ButtonStyle.Success)
              .setDisabled(true)
          );

          await originalMsg.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
        }

        // Celebratory follow-up announcement
        const followUpEmbed = new EmbedBuilder()
          .setTitle('🎉 CONGRATULATIONS TO THE WINNER! 🎉')
          .setColor(COLORS.SUCCESS)
          .setDescription(
            `🏆 <@${winnerId}> has won the **Daily Cash Giveaway**!\n\n` +
            `💰 **Prize Won:** <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**\n` +
            `💳 **Deposit Status:** Funds have been deposited directly into your wallet!\n` +
            `👥 **Participants:** **${giveaway.entries.length} players**\n\n` +
            `*Thank you to everyone who entered! Stay tuned for tomorrow's daily drop!* 🍀`
          )
          .setThumbnail(winnerUser?.displayAvatarURL?.({ size: 128, extension: 'png' }) || null)
          .setFooter({ text: `Kasiko Daily Drops • Message ID: ${giveaway.messageId}` })
          .setTimestamp();

        await channel.send({
          content: `🎉 Congratulations <@${winnerId}>! You won the daily giveaway!`,
          embeds: [followUpEmbed]
        });

      } catch (postErr) {
        console.error('[GiveawayEngine] Error posting winner announcement:', postErr);
      }
    }

    return giveaway;

  } catch (error) {
    console.error('[GiveawayEngine] Error resolving giveaway:', error);
    sendErrorLog(error, { source: 'GiveawayEngine.resolveGiveaway' }).catch(() => {});
    return null;
  }
}

/**
 * Check and resolve all expired active giveaways.
 */
export async function checkActiveGiveaways(client) {
  try {
    if (!client?.isReady()) return;

    const now = new Date();
    const expiredGiveaways = await Giveaway.find({
      ended: false,
      endsAt: { $lte: now }
    });

    for (const giveaway of expiredGiveaways) {
      await resolveGiveaway(giveaway, client);
    }
  } catch (error) {
    console.error('[GiveawayEngine] Error checking active giveaways:', error);
  }
}

/**
 * Reroll an ended giveaway to pick a new winner.
 */
export async function rerollGiveaway(messageId, client) {
  try {
    const giveaway = await Giveaway.findOne({ messageId });
    if (!giveaway) throw new Error('Giveaway not found.');
    if (!giveaway.ended) throw new Error('Giveaway is still active. End it first before rerolling.');
    if (!giveaway.entries || giveaway.entries.length === 0) throw new Error('No entries were registered in this giveaway.');

    // Filter out previous winner if possible
    const availablePool = giveaway.entries.filter(id => id !== giveaway.winnerId);
    const pool = availablePool.length > 0 ? availablePool : giveaway.entries;
    const newWinnerId = pool[Math.floor(Math.random() * pool.length)];

    giveaway.winnerId = newWinnerId;
    await giveaway.save();

    // Credit cash to new winner
    const userData = await getUserData(newWinnerId);
    if (userData) {
      await updateUser(newWinnerId, { cash: (userData.cash || 0) + giveaway.prize });
    }

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel && channel.isTextBased()) {
      let winnerUser = null;
      try {
        winnerUser = await client.users.fetch(newWinnerId).catch(() => null);
      } catch (_) {}

      const rerollEmbed = new EmbedBuilder()
        .setTitle('🔄 GIVEAWAY REROLLED! 🔄')
        .setColor(COLORS.GOLD)
        .setDescription(
          `A new winner has been selected for the giveaway!\n\n` +
          `🏆 **New Winner:** <@${newWinnerId}>\n` +
          `💰 **Prize:** <:kasiko_coin:1300141236841086977> **${giveaway.prize.toLocaleString()} Cash**\n` +
          `💳 **Status:** Deposited directly into your wallet!`
        )
        .setThumbnail(winnerUser?.displayAvatarURL?.({ size: 128, extension: 'png' }) || null)
        .setFooter({ text: `Kasiko Giveaway Reroll • Original Message: ${giveaway.messageId}` })
        .setTimestamp();

      await channel.send({
        content: `🎉 Congratulations <@${newWinnerId}>! You are the new winner!`,
        embeds: [rerollEmbed]
      });
    }

    return { success: true, newWinnerId, prize: giveaway.prize };

  } catch (error) {
    console.error('[GiveawayEngine] Error rerolling giveaway:', error);
    throw error;
  }
}
