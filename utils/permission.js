import {
  InteractionType,
  PermissionsBitField
} from 'discord.js';

export async function checkPerms(message) {

  const permissionNames = {
    1: "CREATE_INSTANT_INVITE",
    2: "KICK_MEMBERS",
    4: "BAN_MEMBERS",
    8: "ADMINISTRATOR",
    16: "MANAGE_CHANNELS",
    32: "MANAGE_GUILD",
    64: "ADD_REACTIONS",
    128: "VIEW_AUDIT_LOG",
    256: "PRIORITY_SPEAKER",
    1024: "READ_MESSAGES or VIEW_CHANNEL",
    // Duplicate: READ_MESSAGES & VIEW_CHANNEL
    2048: "SEND_MESSAGES",
    4096: "SEND_TTS_MESSAGES",
    8192: "MANAGE_MESSAGES",
    16384: "EMBED_LINKS",
    32768: "ATTACH_FILES",
    65536: "READ_MESSAGE_HISTORY",
    131072: "MENTION_EVERYONE",
    262144: "EXTERNAL_EMOJIS or USE_EXTERNAL_EMOJIS",
    // Duplicate: EXTERNAL_EMOJIS & USE_EXTERNAL_EMOJIS
    1048576: "CONNECT",
    2097152: "SPEAK",
    4194304: "MUTE_MEMBERS",
    8388608: "DEAFEN_MEMBERS",
    16777216: "MOVE_MEMBERS",
    33554432: "USE_VAD",
    67108864: "CHANGE_NICKNAME",
    134217728: "MANAGE_NICKNAMES",
    268435456: "MANAGE_ROLES or MANAGE_ROLES_OR_PERMISSIONS",
    // Duplicate: MANAGE_ROLES & MANAGE_ROLES_OR_PERMISSIONS
    536870912: "MANAGE_WEBHOOKS",
    1073741824: "MANAGE_EMOJIS",
    2147483648: "USE_APPLICATION_COMMANDS",
    137438953472: "USE_EXTERNAL_STICKERS"
  };

  // Define required permissions
  const requiredPermissions = [
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.UseExternalStickers,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.UseApplicationCommands,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.ReadMessageHistory,
  ];

  const botPermissions = message.channel.permissionsFor(message.client.user);

  if (!botPermissions) {
    console.error('Could not fetch permissions for the bot.');
    return;
  }

  // Find missing permissions
  const missingPermissions = requiredPermissions.filter(perm => !botPermissions.has(perm));

  // If all permissions are granted, do nothing
  if (missingPermissions.length === 0) return;

  console.log(`Bot is missing these permissions: ${missingPermissions.map(perm => (permissionNames[perm] || "Unknown")).join(', ')} \n in server ${message.guild.id}`);

  if (botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
    return "\n- " + missingPermissions.map(perm => {
      if (permissionNames[perm]) {
        return permissionNames[perm]
      }
    }).join(',\n- ')
  }

  return;
}