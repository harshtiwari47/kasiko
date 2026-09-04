import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
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

  // Send confirmation request
  const confirmEmbed = new EmbedBuilder()
    .setTitle("👥 Friend Request")
    .setDescription(
      `**${invoker.username}** wants to add **${targetUser.username}** as a friend!\n\n` +
      `**${targetUser.username}**, do you accept this friend request?\n\n` +
      `-# 💫 Friends get a **+20% ship score boost** and **higher item drop rates** when shipping!`
    )
    .setColor(0x5865f2)
    .setThumbnail(targetUser.displayAvatarURL({ extension: "png", size: 128 }))
    .setFooter({ text: `Friends: ${friendsList.length}/${MAX_FRIENDS} • Expires in 60s` });

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

  const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

  const responseMsg = await handleMessage(context, {
    embeds: [confirmEmbed],
    components: [row],
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
        const successEmbed = new EmbedBuilder()
          .setTitle("💖 Friendship Formed!")
          .setDescription(
            `**${invoker.username}** and **${targetUser.username}** are now friends! 🎉\n\n` +
            `-# 💫 Ship together for a +20% score boost and higher item drops!`
          )
          .setColor(0x57f287);

        const disabledRow = new ActionRowBuilder().addComponents(
          acceptBtn.setDisabled(true),
          declineBtn.setDisabled(true)
        );

        await responseMsg.edit({
          embeds: [successEmbed],
          components: [disabledRow],
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
      const declineEmbed = new EmbedBuilder()
        .setDescription(`❌ **${targetUser.username}** declined the friend request.`)
        .setColor(0xed4245);

      const disabledRow = new ActionRowBuilder().addComponents(
        acceptBtn.setDisabled(true),
        declineBtn.setDisabled(true)
      );

      await responseMsg.edit({
        embeds: [declineEmbed],
        components: [disabledRow],
      }).catch(() => {});
    }
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      const timeoutEmbed = new EmbedBuilder()
        .setDescription(`⏰ Friend request from **${invoker.username}** to **${targetUser.username}** expired.`)
        .setColor(0x99aab5);

      const disabledRow = new ActionRowBuilder().addComponents(
        acceptBtn.setDisabled(true),
        declineBtn.setDisabled(true)
      );

      await responseMsg.edit({
        embeds: [timeoutEmbed],
        components: [disabledRow],
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
    const emptyEmbed = new EmbedBuilder()
      .setTitle("👥 Friends List")
      .setDescription(
        `You don't have any friends yet!\n\n` +
        `Use \`kas friends add @user\` to send a friend request.\n` +
        `-# 💫 Friends get a +20% ship score boost and higher item drops!`
      )
      .setColor(0x99aab5)
      .setFooter({ text: `0/${MAX_FRIENDS} friends` });

    return handleMessage(context, { embeds: [emptyEmbed] });
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

  const embed = new EmbedBuilder()
    .setTitle(`👥 ${invoker.username}'s Friends`)
    .setDescription(pages[0])
    .setColor(0x5865f2)
    .setFooter({ text: `${friendsList.length}/${MAX_FRIENDS} friends${pages.length > 1 ? ` • Page 1/${pages.length}` : ''}` });

  if (pages.length <= 1) {
    return handleMessage(context, { embeds: [embed] });
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
    embeds: [embed],
    components: [paginationRow],
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

    const updatedEmbed = new EmbedBuilder()
      .setTitle(`👥 ${invoker.username}'s Friends`)
      .setDescription(pages[currentPage])
      .setColor(0x5865f2)
      .setFooter({ text: `${friendsList.length}/${MAX_FRIENDS} friends • Page ${currentPage + 1}/${pages.length}` });

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
      embeds: [updatedEmbed],
      components: [updatedRow],
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
    await responseMsg.edit({ components: [disabledRow] }).catch(() => {});
  });
}

export default FriendsCmd;
