import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';
import profileSubcommand from './profile.js';
import startSubcommand from './start.js';
import cancelSubcommand from './cancel.js';
import newSubcommand from './new.js';
import useSubcommand from './use.js';
import serverSubcommand from './server.js';
import leaderboardSubcommand from './leaderboard.js';
import setRoleSubcommand from './setRole.js';
import getRoleSubcommand from './getRole.js';

export default {
  data: new SlashCommandBuilder()
  .setName('skyraid')
  .setDescription('Manage and view skyraid battle-related functionalities.')
  // Add subcommands
  .addSubcommand(subcommand =>
    subcommand
    .setName('profile')
    .setDescription('View your Skyraid battle profile.')
  )
  .addSubcommand(subcommand =>
    subcommand
    .setName('start')
    .setDescription('Start the current Skyraid battle if enough players have registered.')
  )
  .addSubcommand(subcommand =>
    subcommand
    .setName('use')
    .setDescription('Use a dragon ability during the Skyraid battle.')
    .addStringOption((option) =>
      option
      .setName('power')
      .setDescription('The power to use (p1 or p2)')
      .setRequired(true)
      .addChoices(
        {
          name: 'p1', value: 'p1'
        },
        {
          name: 'p2', value: 'p2'
        }
      )
    )
  )
  .addSubcommand(subcommand =>
    subcommand
    .setName('cancel')
    .setDescription('Cancel the ongoing skyraid battle that is in a waiting state.')
  )
  .addSubcommand(subcommand =>
    subcommand
    .setName('new')
    .setDescription('Start a new Skyraid server battle with a dragon boss.')
  )
  .addSubcommand(subcommand =>
    subcommand
    .setName('server')
    .setDescription('View the overall Skyraid battle statistics for this guild.')
  )
  /*.addSubcommand(subcommand =>
    subcommand
    .setName('leaderboard')
    .setDescription('View the top players based on selected criteria.')
    .addStringOption(option =>
      option.setName('filter')
      .setDescription('Select the leaderboard filter.')
      .setRequired(true)
      .addChoices(
        {
          name: 'Star Performer', value: 'star'
        },
        {
          name: 'Total Damage', value: 'damage'
        },
      )
    )
  )*/
  .addSubcommand(subcommand =>
    subcommand
    .setName('setrole')
    .setDescription('Set a custom role that can start or cancel the game.')
    .addRoleOption(option =>
      option.setName('role')
      .setDescription('Select the role to authorize for starting or cancelling the game.')
      .setRequired(true)
    ))
  // Restrict to admins
  .addSubcommand(subcommand =>
    subcommand
    .setName('getrole')
    .setDescription('View the currently authorized role to start the game.')
  ),
  // Add more subcommands as needed

  /**
  * Executes the 'battle' command with its subcommands.
  * @param {Interaction} interaction - The command interaction.
  * @param {Client} client - The Discord client instance.
  */
  execute: async (interaction, client) => {
    const subcommand = interaction.options.getSubcommand();
    if (interaction.replied || interaction.deferred) return; // Do not reply again

    if (!interaction.guild) {
      return interaction.reply({
        content: "❗Skyraid game is available on servers where the bot is a member!",
      });
    }

    switch (subcommand) {
    case 'profile':
      // Handle 'profile' subcommand
      await profileSubcommand.execute(interaction);
      break;

    case 'start':
      // Handle 'start' subcommand
      await startSubcommand.execute(interaction);
      break;

    case 'cancel':
      // Handle 'cancel' subcommand
      await cancelSubcommand.execute(interaction);
      break;

    case 'new':
      // Handle 'cancel' subcommand
      await newSubcommand.execute(interaction);
      break;

    case 'use':
      // Handle 'cancel' subcommand
      await useSubcommand.execute(interaction);
      break;

    case 'server':
      await serverSubcommand.execute(interaction);
      break;

    case 'leaderboard':
      await leaderboardSubcommand.execute(interaction);
      break;

    case 'setrole':
      await setRoleSubcommand.execute(interaction);
      break;

    case 'getrole':
      await getRoleSubcommand.execute(interaction);
      break;

    default:
      await interaction.reply({
        content: '❌ Unknown  Skyraid subcommand.', ephemeral: true
      });
    }
  },
};