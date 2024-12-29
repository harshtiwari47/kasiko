import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import SkyraidUsers from '../../../models/SkyraidUsers.js';
import {
  client
} from "../../../bot.js";

export default {
  execute: async (interaction) => {
    try {
      await interaction.deferReply();

      const guildId = interaction.guild.id;
      const filter = interaction.options.getString('filter');

      let users;

      if (filter === 'star') {
        // Fetch users who are star performers, sorted by totalDamage descending
        users = await SkyraidUsers.find({
          guildId
        })
        .sort({
          starPerformer: -1
        });
      } else if (filter === 'damage') {
        // Fetch users sorted by totalDamage descending
        users = await SkyraidUsers.find({
          guildId
        })
        .sort({
          totalDamage: -1
        });
      }

      if (!users || users.length === 0) {
        return interaction.followUp({
          content: 'No data available for the selected leaderboard.', ephemeral: true
        });
      }

      const itemsPerPage = 10;
      const totalPages = Math.ceil(users.length / itemsPerPage);
      let currentPage = 1;

      const getEmbed = async (page) => {
        let titleEmbed = new EmbedBuilder()
        .setDescription(`### 🏆 ${filter === 'star' ? '💫 𝑆𝑇𝐴𝑅 𝑃𝐸𝑅𝐹𝑂𝑅𝑀𝐸𝑅𝑆': '💥 𝑇𝑂𝑃 𝐷𝐴𝑀𝐴𝐺𝐸 𝐷𝐸𝐴𝐿𝐸𝑅𝑆'}`)
        .setImage(`https://harshtiwari47.github.io/kasiko-public/images/skyraid.png`)
        .setColor(`#f5ef9e`)


        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedUsers = users.slice(start, end);

        const embed = new EmbedBuilder()
        .setColor('#FFD700') // Gold color
        .setFooter({
          text: `Page ${page} of ${totalPages}`
        })
        .setTimestamp();

        for (const [index, user] of paginatedUsers.entries()) {
          // Fetch member to get username
          const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
          const username = member ? member.user.username: 'Unknown User';

          // Display additional stats or badges if desired
          const badges = user.badges.length > 0 ? user.badges.join(', '): 'None';

          embed.addFields({
            name: `${start + index + 1}. ${username}`,
            value: `${filter === 'star' ? "💫 Total Stars: " + user.starPerformer.toLocaleString(): "💥 Total Damage : " + user.totalDamage.toLocaleString()}\n🏅 Badges: ${badges}`,
            inline: false,
          });
        }

        return [titleEmbed,
          embed];
      };

      const embed = await getEmbed(currentPage);

      // Create buttons
      const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId('leaderboard_prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true), // Initially disabled
        new ButtonBuilder()
        .setCustomId('leaderboard_next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(totalPages <= 1), // Disabled if only one page
      );

      const message = await interaction.followUp({
        embeds: embed, components: [row], fetchReply: true
      });

      // Create a collector for button interactions
      const filterButton = (i) => i.user.id === interaction.user.id;
      const collector = message.createMessageComponentCollector({
        filter: filterButton, time: 60000
      }); // 60 seconds

      collector.on('collect', async (i) => {
        if (i.customId === 'leaderboard_prev') {
          currentPage--;
        } else if (i.customId === 'leaderboard_next') {
          currentPage++;
        }

        // Update buttons' disabled state
        const newRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setCustomId('leaderboard_prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
          new ButtonBuilder()
          .setCustomId('leaderboard_next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages),
        );

        // Update the embed
        const newEmbed = await getEmbed(currentPage);

        await i.update({
          embeds: newEmbed, components: [newRow]
        });
      });

      collector.on('end',
        () => {
          // Disable buttons after the collector ends
          const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
            .setCustomId('leaderboard_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId('leaderboard_next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          );

          message.edit({
            components: [disabledRow]
          });
        });

    } catch (error) {
      console.error('Error executing leaderboard command:',
        error);
      return interaction.followUp({
        content: '❌ An error occurred while fetching the leaderboard.',
        ephemeral: true
      });
    }
  },
};