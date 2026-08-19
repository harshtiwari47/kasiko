import cron from 'node-cron';
import {
  VoteModel
} from './models/voteModel.js';
import {
  client
} from './bot.js';
import redisClient from './redis.js';
import { syncStatsToMongoDB } from './utils/stats.js';
import { checkActiveGiveaways, startDailyGiveaway } from './utils/giveawayEngine.js';
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle
} from 'discord.js';

const BOT_ID = process.env.APP_ID;

/**
* Sends the DM and updates lastReminderSent.
*/
async function sendVoteReminder(doc) {
  try {
    const user = await client.users.fetch(doc.userId);

    const voteButton = new ButtonBuilder()
    .setLabel('𝙑𝙤𝙩𝙚 𝙁𝙤𝙧 𝘽𝙤𝙩')
    .setStyle(ButtonStyle.Link)
    .setURL(`https://top.gg/bot/${BOT_ID}/vote`);

    const row = new ActionRowBuilder().addComponents(voteButton);
    const embed = new EmbedBuilder()
    .setTitle('⏰ 𝙍𝙀𝙈𝙄𝙉𝘿𝙀𝙍: 𝙑𝙊𝙏𝙀 𝙉𝙊𝙒!')
    .setDescription(`**𝘏𝘦𝘺 𝘵𝘩𝘦𝘳𝘦, 𝘧𝘳𝘪𝘦𝘯𝘥!**\n` +
      `Don't forget to *vote* for bot on _Top.gg_ and keep that vote streak shining! ✨\n\n` +
      `After you vote, be sure to run **\`/economy vote\`** command to claim your reward 🎁\n` +
      `-# *Thank you for all your support — it means the world to us!*`)

    await user.send({
      embeds: [embed], components: [row]
    });

    // mark the time so we don’t double-send
    doc.lastReminderSent = new Date();
    await doc.save();
  } catch (err) {
    console.error(`Failed to send DM to ${doc.userId}:`, err);
  }
}

export function scheduleReminders() {
  // run this check every hour
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const twelveHours = 12 * 60 * 60 * 1000;

    // fetch full docs so we can read & write lastReminderSent
    const docs = await VoteModel.find({
      reminder: true
    });

    for (const doc of docs) {
      // if never sent, or it’s been ≥12h since lastReminderSent
      if (!doc.lastReminderSent || now - doc.lastReminderSent >= twelveHours) {
        await sendVoteReminder(doc);
      }
    }
  });

  console.log('✅ Vote reminder scheduler initialized (runs every hour)');
}

/**
 * Periodically sync Redis analytics counters into MongoDB for persistent historical storage.
 * Runs every 15 minutes.
 */
export function scheduleStatsSync() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      if (client?.isReady()) {
        await syncStatsToMongoDB(client, redisClient);
      }
    } catch (err) {
      console.error('[StatsScheduler] Error during scheduled stats sync:', err);
    }
  });

  // Also trigger an initial sync 30 seconds after startup once connected
  setTimeout(async () => {
    try {
      if (client?.isReady()) {
        await syncStatsToMongoDB(client, redisClient);
      }
    } catch (e) {}
  }, 30000);

  console.log('✅ Analytics sync scheduler initialized (runs every 15 minutes)');
}

/**
 * Automated Giveaway Scheduler:
 * - Checks and resolves expired giveaways every minute.
 * - Spawns a daily cash drop at 00:00 UTC.
 */
export function scheduleGiveaways() {
  // Check and resolve expired active giveaways every minute
  cron.schedule('* * * * *', async () => {
    try {
      if (client?.isReady()) {
        await checkActiveGiveaways(client);
      }
    } catch (err) {
      console.error('[GiveawayScheduler] Error checking active giveaways:', err);
    }
  });

  // Daily giveaway spawn at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    try {
      if (client?.isReady()) {
        await startDailyGiveaway(client);
      }
    } catch (err) {
      console.error('[GiveawayScheduler] Error launching daily giveaway:', err);
    }
  });

  // Initial check upon startup after 15 seconds
  setTimeout(async () => {
    try {
      if (client?.isReady()) {
        await checkActiveGiveaways(client);
      }
    } catch (e) {}
  }, 15000);

  console.log('✅ Daily Giveaway scheduler initialized (checks every minute, daily drop at 00:00 UTC)');
}