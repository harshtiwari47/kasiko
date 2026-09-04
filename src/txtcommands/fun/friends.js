import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
} from "discord.js";

import {
  getUserData,
} from '../../../database.js';

import {
  getCachedFriends,
  addFriend,
  removeFriend,
  MAX_FRIENDS,
} from './req/friendsCache.js';

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;
  if (isInteraction) {
    if (!context.deferred) {
      await context
        .deferReply()
        .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

const FriendsCmd = {
  name: "friends",
  description: "Manage your friends list! Add, remove, or view your friends (max 30). Friends get a ship score boost!",
  aliases: ["friend", "fl"],
  cooldown: 5000,
  example: [
    "friends",
    "friends add @user",
    "friends remove @user",
    "friends list",
  ],
  category: "🧩 Fun",

  execute: async (args, context) => {
    try {
      if (!context.guild) {
        return handleMessage(context, "⚠️ This command can only be used in servers.");
      }

      const invoker = context.user || context.author;

      // Remove the command name from args
      if (args?.length > 0 && ["friends", "friend", "fl"].includes(args[0]?.toLowerCase())) {
        args.shift();
      }

      const subCommand = args[0]?.toLowerCase();

      // ── ADD FRIEND ──
      if (subCommand === "add") {
        return await handleAddFriend(args, context, invoker);
      }

      // ── REMOVE FRIEND ──
      if (subCommand === "remove" || subCommand === "rm" || subCommand === "delete") {
        return await handleRemoveFriend(args, context, invoker);
      }

      // ── VIEW FRIENDS LIST (default) ──
      return await handleViewFriends(context, invoker);

    } catch (e) {
      console.error('[Friends Command Error]:', e);
      return handleMessage(context, "❗ Something went wrong with the friends command.");
    }
  },
};

// ── ADD FRIEND ────────────────────────────────────────────────────────────────

async function handleAddFriend(args, context, invoker) {
  // Get the mentioned user
  let targetUser = null;
  if (context.mentions?.users?.size > 0) {
    targetUser = context.mentions.users.first();
  } else if (args[1]) {
    // Try to resolve by ID
    const userId = args[1].replace(/[<@!>]/g, '');
    try {
      targetUser = await context.client.users.fetch(userId);
    } catch {
      return handleMessage(context, "⚠️ Could not find that user. Please mention them or provide a valid ID.");
    }
  }

  if (!targetUser) {
    return handleMessage(context, "⚠️ Please mention a user to add. Usage: `kas friends add @user`");
  }

  if (targetUser.id === invoker.id) {
    return handleMessage(context, "⚠️ You can't add yourself as a friend!");
  }

  if (targetUser.bot) {
    return handleMessage(context, "⚠️ You can't be friends with bots!");
  }

  // Check if invoker has a kasiko account
  const invokerData = await getUserData(invoker.id);
  if (!invokerData) {
    return handleMessage(context, "⚠️ You need a Kasiko account first! Use any command to create one.");
  }

  // Check if already friends
  const friendsList = await getCachedFriends(invoker.id);
  if (friendsList.includes(targetUser.id)) {
    return handleMessage(context, `✅ You and **${targetUser.username}** are already friends!`);
  }

  // Check invoker's friend limit
  if (friendsList.length >= MAX_FRIENDS) {
    return handleMessage(context, `⚠️ Your friends list is full! (${MAX_FRIENDS}/${MAX_FRIENDS}). Remove someone first with \`kas friends remove @user\`.`);
  }

  // Check target's friend limit
  const targetFriendsList = await getCachedFriends(targetUser.id);
  if (targetFriendsList.length >= MAX_FRIENDS) {
    return handleMessage(context, `⚠️ **${targetUser.username}**'s friends list is full! (${MAX_FRIENDS}/${MAX_FRIENDS}).`);
  }

  // Send confirmation request using Discord Containers (Components V2)
  const confirmContainer = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(`### 👥 **FRIEND REQUEST**`),
      textDisplay => textDisplay.setContent(
        `**${invoker.username}** wants to add **${targetUser.username}** as a friend!\n\n` +
        `**${targetUser.username}**, do you accept this friend request?`
      )
    )
    .addSeparatorComponents(separate => separate)
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(
        `-# 💫 Friends get a **+20% ship score boost** and **higher item drop rates** when shipping!\n` +
        `-# 👥 Friends: ${friendsList.length}/${MAX_FRIENDS} · Expires in 60s`
      )
    );

  const acceptBtn = new ButtonBuilder()
    .setCustomId("friend_accept")
    .setLabel("Accept")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const declineBtn = new ButtonBuilder()
    .setCustomId("friend_decline")
    .setLabel("Decline")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  confirmContainer.addActionRowComponents(row => row.addComponents(acceptBtn, declineBtn));

  const responseMsg = await handleMessage(context, {
    components: [confirmContainer],
    flags: MessageFlags.IsComponentsV2,
  });

  if (!responseMsg) return;

  // Only the TARGET user can accept/decline
  const filter = (i) => i.user.id === targetUser.id;
  const collector = responseMsg.createMessageComponentCollector
    ? responseMsg.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000,
        max: 1,
      })
    : null;

  if (!collector) return;

  collector.on("collect", async (interaction) => {
    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === "friend_accept") {
      const result = await addFriend(invoker.id, targetUser.id);

      if (result.success) {
        const successContainer = new ContainerBuilder()
          .setAccentColor(0x57f287)
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`### 💖 **FRIENDSHIP FORMED!**`),
            textDisplay => textDisplay.setContent(`**${invoker.username}** and **${targetUser.username}** are now friends! 🎉`),
            textDisplay => textDisplay.setContent(`-# 💫 Ship together for a +20% score boost and higher item drops!`)
          );

        await responseMsg.edit({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      } else if (result.error === 'already_friends') {
        await interaction.followUp({
          content: `✅ You're already friends with **${invoker.username}**!`,
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.followUp({
          content: `⚠️ Could not add friend. ${result.error === 'user1_full' || result.error === 'user2_full' ? 'Friends list is full!' : 'Please try again later.'}`,
          ephemeral: true,
        }).catch(() => {});
      }
    } else {
      const declineContainer = new ContainerBuilder()
        .setAccentColor(0xed4245)
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`❌ **${targetUser.username}** declined the friend request.`)
        );

      await responseMsg.edit({
        components: [declineContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      const timeoutContainer = new ContainerBuilder()
        .setAccentColor(0x99aab5)
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`⏰ Friend request from **${invoker.username}** to **${targetUser.username}** expired.`)
        );

      await responseMsg.edit({
        components: [timeoutContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    }
  });
}

// ── REMOVE FRIEND ─────────────────────────────────────────────────────────────

async function handleRemoveFriend(args, context, invoker) {
  let targetUser = null;
  if (context.mentions?.users?.size > 0) {
    targetUser = context.mentions.users.first();
  } else if (args[1]) {
    const userId = args[1].replace(/[<@!>]/g, '');
    try {
      targetUser = await context.client.users.fetch(userId);
    } catch {
      return handleMessage(context, "⚠️ Could not find that user.");
    }
  }

  if (!targetUser) {
    return handleMessage(context, "⚠️ Please mention a user to remove. Usage: `kas friends remove @user`");
  }

  const friendsList = await getCachedFriends(invoker.id);
  if (!friendsList.includes(targetUser.id)) {
    return handleMessage(context, `⚠️ **${targetUser.username}** is not on your friends list.`);
  }

  const result = await removeFriend(invoker.id, targetUser.id);

  if (result.success) {
    return handleMessage(context, `👋 **${targetUser.username}** has been removed from your friends list.`);
  } else {
    return handleMessage(context, "⚠️ Could not remove friend. Please try again later.");
  }
}

// ── VIEW FRIENDS LIST ─────────────────────────────────────────────────────────

async function handleViewFriends(context, invoker) {
  const friendsList = await getCachedFriends(invoker.id);

  if (friendsList.length === 0) {
    const emptyContainer = new ContainerBuilder()
      .setAccentColor(0x99aab5)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### 👥 **FRIENDS LIST**`),
        textDisplay => textDisplay.setContent(
          `*You don't have any friends yet!*\n\n` +
          `Use \`kas friends add @user\` to send a friend request.`
        )
      )
      .addSeparatorComponents(separate => separate)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# 💫 Friends get a +20% ship score boost and higher item drops! · 0/${MAX_FRIENDS} friends`)
      );

    return handleMessage(context, {
      components: [emptyContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  // Resolve usernames
  const friendEntries = [];
  for (const friendId of friendsList) {
    try {
      const user = await context.client.users.fetch(friendId).catch(() => null);
      const displayName = user ? user.username : `Unknown (${friendId})`;
      friendEntries.push(`> 💗 **${displayName}**`);
    } catch {
      friendEntries.push(`> 💗 \`${friendId}\``);
    }
  }

  // Paginate if more than 10
  const pages = [];
  for (let i = 0; i < friendEntries.length; i += 10) {
    pages.push(friendEntries.slice(i, i + 10).join('\n'));
  }

  const buildPageContainer = (page) => {
    return new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### 👥 **${invoker.username.toUpperCase()}'S FRIENDS**`),
        textDisplay => textDisplay.setContent(pages[page])
      )
      .addSeparatorComponents(separate => separate)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# 👥 ${friendsList.length}/${MAX_FRIENDS} friends · Page ${page + 1}/${pages.length}`)
      );
  };

  if (pages.length <= 1) {
    return handleMessage(context, {
      components: [buildPageContainer(0)],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  // Add pagination buttons
  let currentPage = 0;
  const prevBtn = new ButtonBuilder()
    .setCustomId("friends_prev")
    .setLabel("◀")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);
  const nextBtn = new ButtonBuilder()
    .setCustomId("friends_next")
    .setLabel("▶")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pages.length <= 1);

  const paginationRow = new ActionRowBuilder().addComponents(prevBtn, nextBtn);

  const responseMsg = await handleMessage(context, {
    components: [buildPageContainer(0), paginationRow],
    flags: MessageFlags.IsComponentsV2,
  });

  if (!responseMsg) return;

  const filter = (i) => i.user.id === invoker.id;
  const collector = responseMsg.createMessageComponentCollector
    ? responseMsg.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 120000,
      })
    : null;

  if (!collector) return;

  collector.on("collect", async (interaction) => {
    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === "friends_next") {
      currentPage = Math.min(currentPage + 1, pages.length - 1);
    } else if (interaction.customId === "friends_prev") {
      currentPage = Math.max(currentPage - 1, 0);
    }

    const updatedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("friends_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("friends_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === pages.length - 1)
    );

    await responseMsg.edit({
      components: [buildPageContainer(currentPage), updatedRow],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  });

  collector.on("end", async () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("friends_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("friends_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    await responseMsg.edit({
      components: [buildPageContainer(currentPage), disabledRow],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  });
}

export default FriendsCmd;
