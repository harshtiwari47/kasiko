import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';
import Server from '../../../models/Server.js';
import redisClient from '../../../redis.js';

export default {
  data: new SlashCommandBuilder()
  .setName('setshiproles')
  .setDescription('Set the ship roles for male and/or female.')
  // Only allow users with the Manage Server permission to use this command
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addRoleOption(option =>
    option
    .setName('male')
    .setDescription('Select the role for male ship role.')
    .setRequired(false)
  )
  .addRoleOption(option =>
    option
    .setName('female')
    .setDescription('Select the role for female ship role.')
    .setRequired(false)
  ),

  async execute(interaction) {
    // Defer the reply to allow for async database work
    await interaction.deferReply();

    try {
      // Get the role options for male and female
      const maleRole = interaction.options.getRole('male');
      const femaleRole = interaction.options.getRole('female');

      // Ensure the command is used in a guild
      if (!interaction.guild) {
        return await interaction.editReply('❌ This command can only be used in a server.');
      }

      // Fetch (or create) the Server document
      const serverId = interaction.guild.id;
      let serverDoc = await Server.findOne({
        id: serverId
      });
      if (!serverDoc) {
        serverDoc = new Server( {
          id: serverId,
          name: interaction.guild.name,
          ownerId: interaction.guild.ownerId,
          permissions: 'all_channels', // or your desired default
          shipRoles: {
            male: null, female: null
          }
        });
      }

      // Require at least one role option to be provided
      if (!maleRole && !femaleRole) {
        return await interaction.editReply(
          `You must specify at least one role: Male or Female.\n\n` +
          `CURRENT ROLE STATUS:\n` +
          `<:left:1350355384111468576> **Male**: ${serverDoc?.shipRoles?.male ? "Present": "Not set"}\n` +
          `<:left:1350355384111468576> **Female**: ${serverDoc?.shipRoles?.female ? "Present": "Not set"}`
        );
      }

      // Update shipRoles; note that shipRoles.male/female should only contain the role ID
      if (maleRole) {
        serverDoc.shipRoles.male = maleRole.id;
      }
      if (femaleRole) {
        serverDoc.shipRoles.female = femaleRole.id;
      }

      // Save the updated server document
      await serverDoc.save();

      // Clear the cached server info from Redis if it exists
      try {
        const serverKey = `server:${serverId}`;
        const cachedServer = await redisClient.get(serverKey);
        if (cachedServer) {
          await redisClient.del(serverKey);
        }
      } catch (e) {
        // Log cache errors if necessary
        console.error('[setshiproles cache error]', e);
      }

      // Build confirmation message
      let replyContent = '✅ Ship roles updated:';
      if (maleRole) {
        replyContent += `\n- **Male Role:** **${maleRole.name}**`;
      }
      if (femaleRole) {
        replyContent += `\n- **Female Role:** **${femaleRole.name}**`;
      }

      return await interaction.editReply(replyContent);
    } catch (err) {
      console.error('[setshiproles command error]', err);
      return await interaction.editReply('❌ An error occurred while updating ship roles.');
    }
  }
};