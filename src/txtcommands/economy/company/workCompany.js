import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function workCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    // Retrieve the company associated with this user (assumed to be the founder)
    const company = await Company.findOne({
      owner: userId
    });
    if (!company) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you do not have a registered company. Please use the \`company start\` command to create one.`
      });
    }

    // Set a cooldown for the work command (e.g., 1 hour = 3600000 milliseconds)
    const COOLDOWN = 3600000;
    const now = new Date();
    if (company.lastWorkAt && (now - company.lastWorkAt < COOLDOWN)) {
      const remaining = Math.ceil((COOLDOWN - (now - company.lastWorkAt)) / 60000);
      return handleMessage(message, {
        content: `⚠️ **${username}**, 𝘺𝘰𝘶 𝘩𝘢𝘷𝘦 𝘢𝘭𝘳𝘦𝘢𝘥𝘺 𝘸𝘰𝘳𝘬𝘦𝘥 𝘳𝘦𝘤𝘦𝘯𝘵𝘭𝘺.\n\n<:kasiko_stopwatch:1355056680387481620> Please wait **${remaining} minute(s)** before working again.`
      });
    }

    // Calculate the work reward.
    const baseReward = 50;
    const volatilityFactor = company.volatility / 10; // Adjustable factor
    const reward = Math.floor((company.currentPrice * 0.005) + baseReward + company.currentPrice * 0.05 + Math.random() * 50 * volatilityFactor);

    // Retrieve and update the user's cash balance
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, user data not found.`
      });
    }

    userData.cash += reward;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Update the company's work statistics
    company.workCount += 1;
    company.lastWorkAt = now;

    // Apply a growth boost to the company due to work:
    // Increase the current price by a fixed percentage and update the market cap.
    const growthRate = 0.005; // 0.5% growth per work action
    company.currentPrice = Math.max(1, Math.round(company.currentPrice * (1 + growthRate) * 10) / 10);
    company.marketCap = Math.round((company.currentPrice * company.totalSharesOutstanding) * 10) / 10;

    // Update price history arrays.
    company.last10Prices.push(company.currentPrice);
    if (company.last10Prices.length > 10) {
      company.last10Prices.shift();
    }
    company.priceHistory.push({
      price: company.currentPrice, date: new Date()
    });

    await company.save();

    const Container = new ContainerBuilder()
    .setAccentColor(0xd36134)
    .addSectionComponents(
      section => section
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### <:briefcase:1389196495474921492> 𝗪𝗢𝗥𝗞 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘𝗗`),
        textDisplay => textDisplay.setContent("-# 𝘠𝘰𝘶𝘳 𝘦𝘧𝘧𝘰𝘳𝘵𝘴 𝘧𝘶𝘦𝘭𝘦𝘥 𝘤𝘰𝘮𝘱𝘢𝘯𝘺 𝘨𝘳𝘰𝘸𝘵𝘩!")
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
        .setDescription('Company work')
        .setURL("https://harshtiwari47.github.io/kasiko-public/images/office-work.png")
      )
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(
        `**${username}**, 𝘺𝘰𝘶 𝘸𝘰𝘳𝘬𝘦𝘥 𝘧𝘰𝘳 **${company.name}** 𝘢𝘯𝘥 𝘦𝘢𝘳𝘯𝘦𝘥 <:kasiko_coin:1300141236841086977> **${reward}**.\n` +
        `-# 𝘕𝘌𝘞 𝘚𝘛𝘖𝘊𝘒 𝘗𝘙𝘐𝘊𝘌𝘚: <:kasiko_coin:1300141236841086977> ${company.currentPrice}`
      )
    )

    return handleMessage(message, {
      components: [Container],
      flags: MessageFlags.IsComponentsV2
    });

  } catch (error) {
    console.error("Error in workCommand:", error);
    return handleMessage(message, {
      content: `⚠ An error occurred while processing your work command.\n**Error**: ${error.message}`
    });
  }
}