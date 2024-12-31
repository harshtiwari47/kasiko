import Orca from '../../../models/Orca.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  client
} from '../../../bot.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

// ====================== Utility Functions ====================== //

/**
* Returns the current orca document (at most one in DB).
* Spawns a new one with a 15% chance if none exists.
*/
async function huntForOrca(serverId) {
  const orca = await Orca.findOne();
  if (!orca) {
    // 15% chance to spawn new Orca
    const roll = Math.random() * 100;
    if (roll <= 15) {
      const newOrca = new Orca( {
        serverId,
        lastAppearance: new Date(),
      });
      await newOrca.save();
      return newOrca;
    }
    // no spawn this time
    return null;
  }
  // We already have an orca in DB
  return orca;
}

/**
* The "Claim" step. If an orca is found but not yet claimed (hunter == null),
* the user becomes the discoverer (hunter).
*/
async function claimOrca(serverId, userId, username, guildName) {
  const orca = await Orca.findOne();
  if (!orca) {
    // No orca at all
    return {
      success: false,
      message: `No Orca has been found yet. Please hunt first!`,
    };
  }

  if (orca.hunter) {
    // It's already claimed
    return {
      success: false,
      message: `The Orca has already been claimed by **${orca.hunter}**! Please use **Pray**.`,
    };
  }

  // No hunter yet => user becomes the discoverer
  orca.hunter = username;
  orca.hunterId = userId;
  await orca.save();

  return {
    success: true,
    message: `**${username}** has claimed the Legendary Orca in **${guildName}**! Now everyone can **Pray** for rewards.`,
  };
}

/**
* The "Pray" step. Rewards the user depending on:
*  - whether they're the discoverer (50k)
*  - same server member (2.5k)
*  - or from a different server (1k)
*  - ensures you can't pray twice for the same Orca
*/
async function prayToOrca(serverId, userId, username, guildName) {
  const orca = await Orca.findOne();
  if (!orca) {
    return {
      success: false,
      message: `No Orca has been found or claimed yet. Please hunt first!`,
    };
  }
  // If no discoverer yet, user can't pray for rewards
  if (!orca.hunterId) {
    return {
      success: false,
      message: `This Orca has not been claimed yet! Someone must **Claim** it first.`,
    };
  }

  // Now we check user data
  const userData = await getUserData(userId);
  if (!userData.orca || typeof userData.orca !== 'object') {
    userData.orca = {
      id: '',
      prayed: false,
      count: 0
    };
  }

  // If user already prayed for THIS orca
  if (
    userData.orca.id === orca._id.toString() &&
    (userData.orca.prayed === true || userData.orca.prayed === "true")
  ) {
    return {
      success: false,
      message: `You have **already prayed** to the current Orca! Wait until a new one is discovered.`,
    };
  }

  // Mark that user has prayed
  userData.orca.id = orca._id.toString();
  userData.orca.prayed = true;

  // Rewards
  const hunterReward = 50000;
  const serverReward = 2500;
  const otherReward = 1000;

  let message = '';
  // Are they the discoverer?
  const isHunter = (userId === orca.hunterId);
  if (isHunter) {
    userData.cash = (userData.cash || 0) + hunterReward;
    userData.orca.count = (userData.orca.count || 0) + 1;
    message = `**${username}** (the Orca discoverer) prayed and received **50,000** cash!`;
  } else {
    // If same server
    if (orca.serverId === serverId) {
      userData.cash = (userData.cash || 0) + serverReward;
      message = `**${username}** prayed and received **2,500** cash (same server reward)!`;
    } else {
      // Different server
      userData.cash = (userData.cash || 0) + otherReward;
      message = `**${username}** prayed and received **1,000** cash (another server's Orca).`;
    }
  }

  await updateUser(userId, userData);

  return {
    success: true,
    message: message,
  };
}

/**
* Builds an embed that describes the current Orca state so we can show it in the Control Panel.
*/
async function buildOrcaEmbed(orca) {
  let desc = '';
  let title = '◈✦ 𝑇ℎ𝑒 𝑂𝑟𝑐𝑎 𝑄𝑢𝑒𝑠𝑡 ✦◈';
  let discovered = false;

  if (!orca) {
    // No orca in DB
    desc = `<:orca:1313094374921605172> No Orca currently exists. Try **Hunt** for a 15% chance to spawn one! 🔍`;
  } else {
    if (!orca.hunter) {
      discovered = true;
      // Orca exists but not claimed
      desc = `# <:orca:1313094374921605172> An Orca has **spawned** but is not yet discovered! Be the first to **Claim** it!`;
    } else {
      const serverName = await client.guilds.fetch(orca.serverId);
      // Orca claimed
      desc = `🎉 <:orca:1313094374921605172> **The Legendary Orca** has been discovered by **${orca.hunter}** in ${serverName}.\n\n` +
      `Use **Pray** for your share of the reward!`;
    }
  }

  let embed = new EmbedBuilder()
  .setColor('#a9d1de')
  .setTitle(title)
  .setDescription(desc);

  if (discovered) {
    embed.setImage(`https://harshtiwari47.github.io/kasiko-public/images/orca.jpg`);
  } else {
    embed.setThumbnail('https://harshtiwari47.github.io/kasiko-public/images/orca.jpg');
  }

  return embed;
}

/**
* Builds the row of buttons, enabling/disabling based on the current Orca state.
*/
function buildOrcaButtons(orca) {
  // By default, everything is disabled
  let huntDisabled = true;
  let claimDisabled = true;
  let prayDisabled = true;

  // If no orca => enable Hunt
  if (!orca) {
    huntDisabled = false;
  } else {
    // If orca exists but not claimed => enable Claim
    if (!orca.hunter) {
      claimDisabled = false;
    } else {
      // If orca is claimed => enable Pray
      prayDisabled = false;
    }
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('hunt_orca')
    .setLabel('Hunt')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(huntDisabled),
    new ButtonBuilder()
    .setCustomId('claim_orca')
    .setLabel('Claim')
    .setStyle(ButtonStyle.Success)
    .setDisabled(claimDisabled),
    new ButtonBuilder()
    .setCustomId('pray_orca')
    .setLabel('Pray')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(prayDisabled),
  );
  return [row];
}

// ====================== Main Command Execution ====================== //

export async function execute(args, message) {
  const {
    channel,
    guild,
    author
  } = message;
  const serverId = guild.id;
  const userId = author.id;
  const username = author.username;
  const guildName = guild.name;

  // We'll create a single "Orca Control Panel" message and keep editing it.
  // 1) Figure out the current orca state
  let orca = await Orca.findOne();

  // Build the initial embed and buttons
  let embed = await buildOrcaEmbed(orca);
  let components = buildOrcaButtons(orca);

  // Send the control panel
  const controlMessage = await channel.send({
    embeds: [embed],
    components,
  });

  // Create a collector for button interactions for (e.g.) 60 seconds
  const collector = controlMessage.createMessageComponentCollector({
    time: 60 * 1000,
  });

  collector.on('collect', async (interaction) => {
    // So we don't get "This interaction failed"
    await interaction.deferUpdate({
      ephemeral: false
    });

    // Let's see which button was clicked
    let resultMessage = '';
    const clickUser = interaction.user;
    const clickUserId = clickUser.id;
    const clickUsername = clickUser.username;

    try {
      if (interaction.customId === 'hunt_orca') {
        // Attempt to find/spawn the orca
        orca = await huntForOrca(serverId);
        if (!orca) {
          resultMessage = `**${clickUsername}** tried hunting... but **no Orca** appeared this time. (15% chance)`;
        } else if (!orca.hunter) {
          // Orca spawned, not claimed
          resultMessage = `**${clickUsername}** found an Orca lurking! First person to **Claim** gets to discover it.`;
        } else {
          // orca is claimed
          resultMessage = `**${clickUsername}** found an **already claimed** Orca (by ${orca.hunter}). Use **Pray** to get rewards!`;
        }
      } else if (interaction.customId === 'claim_orca') {
        // If there's an orca and no discoverer, set the discoverer
        const claimResult = await claimOrca(serverId, clickUserId, clickUsername, guildName);
        resultMessage = claimResult.message;
      } else if (interaction.customId === 'pray_orca') {
        // If orca is discovered, we do the pray logic
        const prayResult = await prayToOrca(serverId, clickUserId, clickUsername, guildName);
        resultMessage = prayResult.message;
      }

    } catch (err) {
      console.error(err);
      resultMessage = '❌ An error occurred. Please try again.';
    }

    // Now re-fetch the orca from DB (in case we changed it in the previous steps)
    orca = await Orca.findOne();

    // Rebuild embed & buttons to reflect the *new* orca state
    embed = await buildOrcaEmbed(orca);
    components = buildOrcaButtons(orca);

    // Edit the control panel message
    await controlMessage.edit({
      embeds: [embed],
      components,
    });

    // Send a short ephemeral response to the *clicking* user so we don't spam the channel
    if (resultMessage) {
      await interaction.followUp({
        content: resultMessage,
        ephemeral: true, // So only they see it
      });
    }
  });

  // When time is up, disable the buttons
  collector.on('end',
    async () => {
      try {
        const fetchedMsg = await channel.messages.fetch(controlMessage.id);
        if (!fetchedMsg) return;

        const oldComponents = fetchedMsg.components;
        if (!oldComponents.length) return;

        const row = ActionRowBuilder.from(oldComponents[0]);
        row.components.forEach((btn) => btn.setDisabled(true));

        await fetchedMsg.edit({
          components: [row],
        });
      } catch (err) {
        console.error('Error disabling orca buttons:', err);
      }
    });
}

export default {
  name: 'orca',
  description: 'Hunt, Claim, and Pray for the Legendary Orca in quest.',
  aliases: ['orcahunt'],
  args: '',
  example: [],
  cooldown: 10000, // 10 seconds cooldown
  category: '🌱 Explore',
  execute,
};