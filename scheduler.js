import cron from 'node-cron';
import {
  VoteModel
} from './models/voteModel.js';
import {
  client
} from './bot.js';
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