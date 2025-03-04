import Company from '../../../../models/Company.js';
import {
  client
} from '../../../../bot.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

/**
* viewFundersCommand:
* This command allows the company owner to view a paginated list of funders (shareholders whose role is 'funder').
* It retrieves the owner's company (based on the owner's Discord ID), filters the shareholders by role, and displays them
* in an embed. Navigation buttons allow the owner to page through the list.
*
* Usage (for the company owner):
*    company viewfunders
*/
export async function viewFundersCommand(message, args) {
  try {
    const ownerId = message.author.id;
    const username = message.author.username;

    // Retrieve the company that belongs to the owner.
    const company = await Company.findOne({
      owner: ownerId
    });
    if (!company) {
      return message.channel.send(`ⓘ **${username}**, you do not have a registered company.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Filter the shareholders to only include those with role 'funder'
    const funders = company.shareholders.filter(sh => sh.role === 'investor');
    if (funders.length === 0) {
      return message.channel.send(`ⓘ **${username}**, no funders found for your company.`).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    // Pagination settings
    const itemsPerPage = 5;
    let currentPage = 0;
    const totalPages = Math.ceil(funders.length / itemsPerPage);

    // Function to build an embed for a given page.
    const generateEmbed = async (page) => {
      const startIndex = page * itemsPerPage;
      const currentFunders = funders.slice(startIndex, startIndex + itemsPerPage);
      let description = `**Funders for ${company.name}:**\nPage ${page + 1} of ${totalPages}\n\n`;

      for (let [index, funder] of currentFunders.entries()) {
        try {
          const userDetails = await client.users.fetch(funder.userId || funder.id);
          const dateStr = funder.lastInvestedAt ? new Date(funder.lastInvestedAt).toLocaleString(): 'N/A';
          description += `**${startIndex + index + 1}.** **${userDetails.username}** – Shares: \`${funder.shares}\` – Last Invested: \`${dateStr}\`\n`;
        } catch (error) {
          console.error(`Error fetching details for funder ${funder.id}:`, error);
        }
      }

      const embed = new EmbedBuilder()
      .setTitle(`💰 Funders for ${company.name}`)
      .setDescription(description)
      .setColor("#3498db")
      .setTimestamp();
      return embed;
    };

    // Build navigation buttons.
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId('prevPage')
      .setLabel('⟨ Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
      new ButtonBuilder()
      .setCustomId('nextPage')
      .setLabel('Next ⟩')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(totalPages <= 1),
      new ButtonBuilder()
      .setCustomId('close')
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
    );

    // Send the initial embed with buttons.
    const fundersMessage = await message.channel.send({
      embeds: [await generateEmbed(currentPage)],
      components: [row]
    });

    // Create a collector that listens for button interactions from the owner.
    const collector = fundersMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === ownerId,
      componentType: ComponentType.Button,
      time: 600000 // Collector runs for 10 minutes.
    });

    collector.on('collect', async interaction => {
      if (interaction.customId === 'prevPage') {
        currentPage--;
      } else if (interaction.customId === 'nextPage') {
        currentPage++;
      } else if (interaction.customId === 'close') {
        collector.stop();
        return interaction.update({
          components: []
        });
      }

      // Update disabled state of buttons.
      row.components[0].setDisabled(currentPage <= 0);
      row.components[1].setDisabled(currentPage >= totalPages - 1);

      // Update the embed.
      const newEmbed = await generateEmbed(currentPage);
      await interaction.update({
        embeds: [newEmbed], components: [row]
      });
    });

    collector.on('end',
      async () => {
        row.components.forEach(button => button.setDisabled(true));
        try {
          
           await fundersMessage.edit({
              components: [row]
            });

        } catch (err) {}
      });

  } catch (error) {
    console.error("Error in viewFundersCommand:",
      error);
    return message.channel.send(`⚠️ An error occurred while retrieving funders: ${error.message}`).catch(err => ![50001,
      50013,
      10008].includes(err.code) && console.error(err));
  }
}