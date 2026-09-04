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
import {
  handleMessage,
} from '../../../helper.js';

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
    .setEmoji({ name: "✅" })
    .setStyle(ButtonStyle.Success);

  const declineBtn = new ButtonBuilder()
    .setCustomId("friend_decline")
    .setLabel("Decline")
    .setEmoji({ name: "❌" })
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
  let friendsList = await getCachedFriends(invoker.id);

  if (!friendsList || friendsList.length === 0) {
    const emptyContainer = new ContainerBuilder()
      .setAccentColor(0x99aab5)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### 👥 **${invoker.username.toUpperCase()}'S FRIENDS**`),
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
  let friendObjects = await Promise.all(
    friendsList.map(async (friendId) => {
      try {
        const user = context.client.users.cache.get(friendId) || await context.client.users.fetch(friendId).catch(() => null);
        return {
          id: friendId,
          username: user ? user.username : `User (${friendId})`
        };
      } catch {
        return {
          id: friendId,
          username: `User (${friendId})`
        };
      }
    })
  );

  const PAGE_SIZE = 5;

  const buildPageContainer = (pageIndex, currentFriendObjects, disabled = false) => {
    const totalPages = Math.max(1, Math.ceil(currentFriendObjects.length / PAGE_SIZE));
    const validPage = Math.min(Math.max(0, pageIndex), totalPages - 1);
    const startIdx = validPage * PAGE_SIZE;
    const pageFriends = currentFriendObjects.slice(startIdx, startIdx + PAGE_SIZE);

    const container = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`### 👥 **${invoker.username.toUpperCase()}'S FRIENDS**`)
      );

    if (pageFriends.length === 0) {
      container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`*You don't have any friends yet!*\n\nUse \`kas friends add @user\` to send a friend request.`)
      );
    } else {
      for (const friend of pageFriends) {
        container.addSectionComponents(
          section => section
            .addTextDisplayComponents(
              textDisplay => textDisplay.setContent(`> 💗 **${friend.username}**`)
            )
            .setButtonAccessory(
              button => button
                .setCustomId(`friends_rm_${friend.id}`)
                .setLabel("Remove")
                .setEmoji({ name: "🗑️" })
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled)
            )
        );
      }
    }

    container.addSeparatorComponents(separate => separate);
    container.addTextDisplayComponents(
      textDisplay => textDisplay.setContent(
        `-# 👥 ${currentFriendObjects.length}/${MAX_FRIENDS} friends · Page ${validPage + 1}/${totalPages} · Click 🗑️ Remove next to any friend to remove them`
      )
    );

    if (totalPages > 1) {
      container.addActionRowComponents(
        row => row.addComponents(
          new ButtonBuilder()
            .setCustomId("friends_prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || validPage === 0),
          new ButtonBuilder()
            .setCustomId("friends_next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || validPage === totalPages - 1)
        )
      );
    }

    return container;
  };

  let currentPage = 0;

  const responseMsg = await handleMessage(context, {
    components: [buildPageContainer(currentPage, friendObjects)],
    flags: MessageFlags.IsComponentsV2,
  });

  if (!responseMsg || !responseMsg.createMessageComponentCollector) return;

  const filter = (i) => i.user.id === invoker.id;
  const collector = responseMsg.createMessageComponentCollector({
    filter,
    time: 120000,
  });

  collector.on("collect", async (interaction) => {
    try {
      if (interaction.customId === "friends_prev") {
        await interaction.deferUpdate().catch(() => {});
        currentPage = Math.max(currentPage - 1, 0);
        await responseMsg.edit({
          components: [buildPageContainer(currentPage, friendObjects)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      } else if (interaction.customId === "friends_next") {
        await interaction.deferUpdate().catch(() => {});
        const totalPages = Math.max(1, Math.ceil(friendObjects.length / PAGE_SIZE));
        currentPage = Math.min(currentPage + 1, totalPages - 1);
        await responseMsg.edit({
          components: [buildPageContainer(currentPage, friendObjects)],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      } else if (interaction.customId.startsWith("friends_rm_")) {
        const targetId = interaction.customId.replace("friends_rm_", "");
        const targetFriend = friendObjects.find(f => f.id === targetId);
        const targetName = targetFriend ? targetFriend.username : targetId;

        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        const res = await removeFriend(invoker.id, targetId);
        if (res.success) {
          friendObjects = friendObjects.filter(f => f.id !== targetId);
          const totalPages = Math.max(1, Math.ceil(friendObjects.length / PAGE_SIZE));
          if (currentPage >= totalPages) {
            currentPage = Math.max(0, totalPages - 1);
          }

          await interaction.editReply({
            content: `👋 **${targetName}** has been removed from your friends list.`,
          }).catch(() => {});

          await responseMsg.edit({
            components: [buildPageContainer(currentPage, friendObjects)],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => {});
        } else {
          await interaction.editReply({
            content: `⚠️ Could not remove **${targetName}**. Please try again later.`,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[Friends Collector Error]:", err);
    }
  });

  collector.on("end", async () => {
    try {
      await responseMsg.edit({
        components: [buildPageContainer(currentPage, friendObjects, true)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    } catch (e) {}
  });
}

export default FriendsCmd;
