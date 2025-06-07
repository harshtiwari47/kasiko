import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

import {
  rewardStructure
} from '../reward.js';

export const GeneralEmbed = (battle, name, avatar, currentBoss, playerStats) => {
  // Build the EmbedBuilder for “General”
  const battleEmbed = new EmbedBuilder()
  .setDescription(`### 𝗛𝗢𝗥𝗜𝗭𝗢𝗡 𝗕𝗔𝗧𝗧𝗟𝗘 • 𝗚𝗘𝗡𝗘𝗥𝗔𝗟\n` +
    `🔥 𝘽𝙖𝙩𝙩𝙡𝙚 𝙄𝙣𝙛𝙤\n` +
    [
      `**Code:** ***\` ${battle.code} \`*** **Players:** ${battle.players.length}`,
      `**Boss Number:** ${battle.currentBossIndex + 1}`,
      `**Created:** ${new Date(
        battle.createdAt
      ).toLocaleString()}`,
      `**Activity:** ${new Date(
        battle.lastUpdatedAt
      ).toLocaleString()}`,
    ].join('\n')
  )
  .setColor('Random')
  .setAuthor({
    name: name, iconURL: avatar
  })

  const bossEmbed = new EmbedBuilder()
  .setColor('Random')
  .setDescription(`🐲 𝘾𝙪𝙧𝙧𝙚𝙣𝙩 𝘽𝙤𝙨𝙨\n` +
    [
      `**Name:** ***${currentBoss.name}*** @${currentBoss.difficulty}`,
      `**HP:** ${currentBoss.health} / ${currentBoss.maxHealth}`,
      currentBoss.specialPowers.length
      ? `**Specials:** ${currentBoss.specialPowers
      .map((p) => `${p.name} *(${p.type} ${p.value})*`)
      .join(', ')}`: '**Specials:** None',
      `**Special Used**: ${currentBoss.lastSpecialUsedAt ? currentBoss.lastSpecialUsedAt.toLocaleString(): "No Info"}`,
      `-# *${currentBoss.description}*`
    ].join('\n')
  )
  .setImage("https://harshtiwari47.github.io/kasiko-public/images/dragons/shadowspire.png");

  const generalEmbed = new EmbedBuilder()
  .setColor(0x0099ff)
  .addFields(
    {
      name: '🦸‍♂️ Your Stats',
      value: [
        `**Total Damage Dealt:** ${playerStats?.totalDamage ?? 0}`,
        playerStats?.currentDragon
        ? `**Dragon:** ${playerStats.currentDragon.name} (${playerStats.currentDragon.health} HP)`: '**Dragon:** None',
        playerStats?.currentDragon?.abilities?.length
        ? `**Abilities:** ${playerStats.currentDragon.abilities
        .map((a) => a.name)
        .join(', ')}`: '**Abilities:** None',
        `**Last Action:** ${new Date(
          playerStats?.lastActionAt ?? battle.lastUpdatedAt
        ).toLocaleString()}`,
      ].join('\n'),
      inline: false,
    }
  )
  .setFooter({
    text: 'Use the buttons below to switch sections.'
  });

  // Build the row of buttons
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId('hb_general')
    .setLabel('GENERAL')
    .setDisabled(true)
    .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
    .setCustomId('hb_players')
    .setLabel('PLAYERS')
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId('hb_history')
    .setLabel('HISTORY')
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId('hb_rewards')
    .setLabel('REWARDS')
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId('hb_howto')
    .setLabel('HOW TO PLAY')
    .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [battleEmbed,
      bossEmbed],
    buttons: buttonRow
  }
}

export async function PlayerEmbed(interaction, battle, name, avatar, page = 0) {
  const PAGE_SIZE = 4;
  const totalPlayers = battle.playerStats.length;
  const totalPages = Math.ceil(totalPlayers / PAGE_SIZE);

  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const playersOnPage = battle.playerStats.slice(start, end);

  const embed = new EmbedBuilder()
  .setTitle(`👥 𝗛𝗢𝗥𝗜𝗭𝗢𝗡 𝗣𝗟𝗔𝗬𝗘𝗥𝗦`)
  .setColor("Random")
  .setAuthor({
    name: name, iconURL: avatar
  })

  for (const stats of playersOnPage) {
    const dragon = stats.currentDragon;
    const abilities = dragon?.abilities?.map((a,i) => "**P" + (i + 1) + "**: " + a.emoji + " " + a.name + " (lvl. " + a.level + ")").join(', ') || 'None';

    embed.addFields({
      name: `<@${stats.playerId}>`,
      value: [
        `**𝙏𝙤𝙩𝙖𝙡 𝘿𝙖𝙢𝙖𝙜𝙚:** ${stats.totalDamage}`,
        `**𝙏𝙤𝙩𝙖𝙡 𝙃𝙚𝙖𝙡𝙞𝙣𝙜:** ${stats.totalHealing}`,
        dragon
        ? `**𝘿𝙧𝙖𝙜𝙤𝙣:** <:${dragon.id}:${dragon.emoji}> ${dragon.name} (${dragon.health} HP)`: `**Dragon:** None`,
        `**𝘼𝙗𝙞𝙡𝙞𝙩𝙞𝙚𝙨:** ${abilities}`
      ].join('\n'),
      inline: false
    });
  }

  embed.setFooter({
    text: `𝘗𝘢𝘨𝘦 ${page + 1} 𝘰𝘧 ${totalPages}`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId(`hb_prevPlayer_${page}`)
    .setLabel('⬅️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page === 0),

    new ButtonBuilder()
    .setCustomId(`hb_nextPlayer_${page}`)
    .setLabel('➡️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages - 1),

    new ButtonBuilder()
    .setCustomId(`hb_general`)
    .setLabel('GENERAL')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId('hb_players')
    .setLabel('PLAYERS')
    .setDisabled(true)
    .setStyle(ButtonStyle.Primary),
  );

  return {
    embeds: [embed],
    buttons: row
  };
}

export async function HistoryEmbed(interaction, battle, name, avatar) {
  const events = battle.history.slice(-7).reverse(); // Get last 7 events

  const embed = new EmbedBuilder()
  .setTitle(`📜 𝗕𝗔𝗧𝗧𝗟𝗘 𝗛𝗜𝗦𝗧𝗢𝗥𝗬 (𝖫𝖺𝗌𝗍 ${events.length})`)
  .setColor('Random')
  .setAuthor({
    name: name,
    iconURL: avatar
  });

  if (events.length === 0) {
    embed.setDescription("𝘕𝘰 𝘩𝘪𝘴𝘵𝘰𝘳𝘺 𝘢𝘷𝘢𝘪𝘭𝘢𝘣𝘭𝘦 𝘺𝘦𝘵.");
  } else {
    for (const evt of events) {
      const time = `<t:${Math.floor(new Date(evt.timestamp).getTime() / 1000)}:R>`;
      const user = `<@${evt.playerId}>`;
      const target = evt.target === 'boss' ? '**the boss**': `<@${evt.target}>`;
      const action = evt.action;
      let line = `🕐 ${time} — ${user} `;

      if (action === 'attack') {
        line += `attacked ${target} for **${evt.damage || 0}** damage.`;
      } else if (action === 'heal') {
        line += `healed ${target} for **${evt.healing || 0}** HP.`;
      } else if (action === 'special') {
        line += `used **${evt.specialName || 'a special move'}** on ${target}`;
        if (evt.damage) line += ` dealing **${evt.damage}** damage`;
        if (evt.healing) line += ` and healing for **${evt.healing}** HP`;
        line += `.`;
      } else if (action === 'defeat') {
        line += `defeated **${evt.bossName || 'the boss'}** (Boss #${evt.bossIndex + 1}). 🎉`;
      } else {
        line += `did something unknown.`;
      }

      embed.addFields({
        name: '\u200B',
        value: line
      });
    }
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId(`hb_general`)
    .setLabel('GENERAL')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_players`)
    .setLabel('PLAYERS')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_history`)
    .setLabel('HISTORY')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true),

    new ButtonBuilder()
    .setCustomId(`hb_rewards`)
    .setLabel('REWARDS')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_howto`)
    .setLabel('HOW TO PLAY')
    .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    buttons: row
  };
}

export async function RewardsEmbed(interaction, battle, name, avatar) {
  const bossIndex = battle.currentBossIndex ?? 0;
  const maxIndex = Math.min(bossIndex,
    rewardStructure.length - 1);
  const current = rewardStructure[maxIndex];

  const embed = new EmbedBuilder()
  .setTitle("🎁 𝗛𝗢𝗥𝗜𝗭𝗢𝗡 𝗕𝗔𝗧𝗧𝗟𝗘 𝗥𝗘𝗪𝗔𝗥𝗗𝗦")
  .setDescription(`𝘙𝘦𝘸𝘢𝘳𝘥𝘴 𝘢𝘳𝘦 𝘥𝘪𝘴𝘵𝘳𝘪𝘣𝘶𝘵𝘦𝘥 𝘣𝘢𝘴𝘦𝘥 𝘰𝘯 𝘥𝘢𝘮𝘢𝘨𝘦 𝘥𝘦𝘢𝘭𝘵 𝘸𝘩𝘦𝘯 𝘢 𝘣𝘰𝘴𝘴 𝘪𝘴 𝘥𝘦𝘧𝘦𝘢𝘵𝘦𝘥.\n\n**Current Boss:** #${bossIndex + 1}\n-# *Rewards upon defeat:*`)
  .setColor('Random')
  .addFields(
    {
      name: `🥇 TOP 1`,
      value: `<:kasiko_coin:1300141236841086977> ${current.top1.toLocaleString()} Cash`,
      inline: true
    },
    {
      name: `🥈 TOP 2–3`,
      value: `<:kasiko_coin:1300141236841086977> ${current.top2_3.toLocaleString()} Cash`,
      inline: true
    },
    {
      name: `🎖️ OTHERS`,
      value: `<:kasiko_coin:1300141236841086977> ${current.others.toLocaleString()} Cash`,
      inline: true
    }
  )
  .setAuthor({
    name: name,
    iconURL: avatar
  })
  .setFooter({
    text: `Defeating higher bosses yields better rewards!`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId(`hb_general`)
    .setLabel('GENERAL')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_players`)
    .setLabel('PLAYERS')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_history`)
    .setLabel('HISTORY')
    .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
    .setCustomId(`hb_rewards`)
    .setLabel('REWARDS')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true),

    new ButtonBuilder()
    .setCustomId(`hb_howto`)
    .setLabel('HOW TO PLAY')
    .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    buttons: row
  };
}

export async function HelpEmbed(context, name, avatar) {
  const embed = new EmbedBuilder()
  .setTitle("🐲 How to Play Horizon Battles")
  .setDescription(`Team up with others to battle 5 mighty bosses with your dragons!`)
  .setColor("#b3a1ea")
  .setAuthor({
    name: name, iconURL: avatar
  })
  .setFooter({
    text: "Good luck, warrior!"
  })
  .addFields(
    {
      name: "🆕 Create or Join",
      value: "`horizon new` — Start a new Horizon battle\n`horizon join <code>` — Join a battle with a code"
    },
    {
      name: "⚔️ Attack",
      value: "`attack p1` — Use your primary attack\n`attack p2` — Use your secondary attack\n\nEach attack deals damage and may heal your dragon!"
    },
    {
      name: "📊 Battle Info",
      value: "`horizon` — View current battle stats & actions\nClick the buttons to view players, history, or rewards."
    },
    {
      name: "📤 Exit Battle",
      value: "`horizon exit` — Leave your current battle (only before a boss is defeated)"
    },
    {
      name: "🧑‍💼 Your Stats",
      value: "`horizon me` — View your Horizon profile and last battle summary"
    }
  );

  return {
    embeds: [embed]
  };
}