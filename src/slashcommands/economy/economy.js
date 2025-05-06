import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  Api
} from '@top-gg/sdk';
import {
  VoteModel
} from '../../../models/voteModel.js';
import {
  getUserData,
  updateUser,
  userExists
} from '../../../database.js';
import {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import dotenv from 'dotenv';
import txtcommands from '../../textCommandHandler.js';

dotenv.config();

const dbl = new Api(process.env.TG_TOKEN);
const BOT_ID = process.env.APP_ID;

export default {
  data: new SlashCommandBuilder()
  .setName('economy')
  .setDescription('Economy commands')
  .addSubcommand(sub => sub .setName('vote')
    .setDescription('Claim your vote reward or toggle reminders')
    .addStringOption(opt => opt .setName('reminder')
      .setDescription('Enable or disable vote reminders')
      .addChoices(
        {
          name: 'yes', value: 'yes'
        },
        {
          name: 'no', value: 'no'
        }
      )
    ))
  .addSubcommand(sub =>
    sub .setName('crime')
    .setDescription('Earn a random amount of cash by doing fake crime.')
  )
  .addSubcommand(sub =>
    sub .setName('work')
    .setDescription('Earn a random amount of cash by working.')
  )
  .addSubcommand(sub =>
    sub .setName('spy')
    .setDescription('Embark on a covert spy mission—risk it all to score top-secret rewards or face hefty penalties!')
  ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();
    if (interaction.replied || interaction.deferred) return; // Do not reply again

    // Ensure user account exists
    const exists = await userExists(userId);
    if (!exists) {
      await interaction.deferReply({
        ephemeral: false
      });

      return interaction.editReply({
        content: `You haven't accepted our terms and conditions! Type \`kas help\` to create an account in server.`,
        ephemeral: true
      });
    }

    switch (subcommand) {
    case "vote":
      if (txtcommands.get("vote")) {
        return await txtcommands.get("vote").execute([], interaction);
      } else {
        return await interaction.reply(`Failed to execute crime command!`);
      }
      break;

    case "crime":
      if (txtcommands.get("crime")) {
        return await txtcommands.get("crime").interact(interaction);
      } else {
        return await interaction.reply(`Failed to execute crime command!`);
      }
      break;

    case "work":
      if (txtcommands.get("work")) {
        return await txtcommands.get("work").interact(interaction);
      } else {
        return await interaction.editReply(`Failed to execute work command!`);
      }
      break;

    case "spy":
      if (txtcommands.get("spymission")) {
        return await txtcommands.get("spy").interact(interaction);
      } else {
        return await interaction.editReply(`Failed to execute work command!`);
      }
      break;
    }
  }
};