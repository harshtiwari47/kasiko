import {
  SlashCommandBuilder
} from 'discord.js';
import Battle from '../../../models/Battle.js';
import SkyraidUsers from '../../../models/SkyraidUsers.js';
import SkyraidGuilds from '../../../models/SkyraidGuilds.js';

import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ComponentType
} from 'discord.js';
import {
  PermissionsBitField
} from 'discord.js';
import {
  client
} from "../../../bot.js";
import {
  userExists
} from '../../../database.js';

const dragons = [{
  name: "Infernal Ember",
  description: "A fiery dragon with molten scales and burning eyes.",
  emoji: "<:infernalember:1322129394176888862>",
  rarity: "Legendary",
  image: "https://harshtiwari47.github.io/kasiko-public/images/dragons/infernalember.png",
  location: "Volcanic caves and lava flows",
  abilities: ["Fire breath",
    "Heat resistance"],
  slogan: "Born of fire, forged in fury.",
  color: "#da3535"
},
  {
    name: "Shadow Spire",
    description: "A dark, menacing dragon with glowing crimson eyes.",
    emoji: "<:shadowspire:1322129373549297664>",
    rarity: "Epic",
    image: "https://harshtiwari47.github.io/kasiko-public/images/dragons/shadowspire.png",
    location: "Hidden in shadowy canyons and ancient ruins",
    abilities: ["Shadow manipulation",
      "Stealth"],
    slogan: "From the shadows, I strike.",
    color: "#4f6bcd"
  },
  {
    name: "Azure Fang",
    description: "A swift dragon with icy blue scales and sharp fangs.",
    emoji: "<:azurefang:1322129422903410749>",
    rarity: "Rare",
    image: "https://harshtiwari47.github.io/kasiko-public/images/dragons/azurefang.png",
    location: "Icy tundras and frozen lakes",
    abilities: ["Ice breath",
      "Flight agility"],
    slogan: "As cold as ice, as swift as the storm.",
    color: "#277961"
  },
  {
    name: "Dusk Talon",
    description: "A fierce dragon with midnight black wings and piercing red eyes.",
    emoji: "<:dusktalon:1322129383757971546>",
    rarity: "Legendary",
    image: "https://harshtiwari47.github.io/kasiko-public/images/dragons/dusktalon.png",
    location: "Mountain peaks during dusk",
    abilities: ["Night vision",
      "Wind slash"],
    slogan: "The twilight sky is my domain.",
    color: "#1a1c35"
  },
];

export default {
  execute: async (interaction) => {
    await interaction.deferReply();

    let userExistence = await userExists(interaction.user.id);
    if (!userExistence) {
      await interaction.followUp({
        content: `You haven't accepted our terms and conditions! Type \`kas terms\` in a server where the bot is available to create an account.`,
        ephemeral: true, // Only visible to the user
      });
      return;
    }

    const existingBattle = await Battle.findOne({
      guildId: interaction.guild.id, status: 'waiting'
    });

    if (existingBattle) {
      return interaction.followUp({
        content: 'A battle is already in progress. Please wait for it to start or cancel it before creating a new one.', ephemeral: true
      });
    }

    // Generate a random dragon boss
    let boss = dragons[Math.floor(Math.random() * dragons.length)];
    boss.health = 100 + Math.floor(Math.random() * 1000);
    boss.level = Math.ceil(Math.random() * 4);

    // Create a new battle
    const battle = new Battle( {
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      boss: {
        typeId: boss.name,
        health: boss.health,
        abilities: boss.abilities,
        image: boss.image,
        slogan: boss.slogan,
        emoji: boss.emoji,
        level: boss.level
      },
      status: 'waiting'
    });


    // guild
    try {
      const guildId = interaction.guild.id;
      let guild = await SkyraidGuilds.findOne({
        guildId
      });

      if (!guild) {
        // If guild doesn't exist, create a new record
        guild = new SkyraidGuilds( {
          guildId,
          totalMatches: 1,
          matchesWon: 0,
          matchesCancelled: 0,
          bossDefeated: {
            'Dusk Talon': 0,
            'Shadow Spire': 0,
            'Infernal Ember': 0,
            'Azure Fang': 0,
          },
          players: [],
          badges: [],
        });
      } else {
        // Update existing guild
        guild.totalMatches += 1;
      }

      // Check for Manage Server permission
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        if ((!guild.startRoleId) || (guild.startRoleId && !interaction.member.roles.cache.has(guild.startRoleId))) {
          return interaction.followUp({
            content: 'You do not have permission to use this command.', ephemeral: true
          });
        }
      }

      await guild.save();
    } catch (error) {
      console.error('Error updating guild stats:', error);
    }

    // Create embed message
    const embed = new EmbedBuilder()
    .setDescription(`# 🔥 New Battle Started!\n\nA ${boss.emoji} **${boss.name}** has appeared with **${boss.health} HP**! Register now to join the battle.\n\n**LEVEL**: **${boss.level}** **RARITY**: **${boss.rarity}**\n\n\`\`\`${boss.description}\`\`\`\n-# ${boss.slogan}`)
    .setImage(boss.image)
    .setColor(boss.color)
    .setFooter({
      text: `TOTAL PARTICIPANTS — 0`
    })

    // Create a registration button
    const registerButton = new ButtonBuilder()
    .setCustomId('register_battle')
    .setLabel('Register for Battle')
    .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(registerButton);

    const message = await interaction.followUp({
      embeds: [embed], components: [row], fetchReply: true
    });

    battle.messageId = message.id;

    await battle.save();

    // Set a timeout to automatically start or cancel the battle after 3 hours
    setTimeout(async () => {
      const currentBattle = await Battle.findById(battle._id);
      if (!currentBattle || currentBattle.status !== 'waiting') return;

      if (currentBattle.players.length >= 2) {
        currentBattle.status = 'active';
        currentBattle.battleStartedAt = new Date();
        await currentBattle.save();
        // Start the battle loop
        // You can emit an event or call a function here to handle the battle
      } else {
        currentBattle.status = 'cancelled';

        try {
          let guild = await SkyraidGuilds.findOne({
            guildId
          });

          if (!guild) {
            // If guild doesn't exist, create a new record
            guild = new SkyraidGuilds( {
              guildId,
              totalMatches: 1,
              matchesWon: 0,
              matchesCancelled: 1,
              bossDefeated: {
                'Dusk Talon': 0,
                'Shadow Spire': 0,
                'Infernal Ember': 0,
                'Azure Fang': 0,
              },
              players: [],
              badges: [],
            });
          } else {
            // Update existing guild
            guild.matchesCancelled += 1;
          }

          await guild.save();
        } catch (error) {
          console.error('Error updating guild stats:', error);
        }

        if (currentBattle.messageId) {
          try {
            const channel = await client.channels.fetch(currentBattle.channelId);
            if (channel && channel.isTextBased()) {
              const battleMessage = await channel.messages.fetch(currentBattle.messageId);
              if (battleMessage) {
                // Clone the existing action rows and disable all buttons
                const disabledComponents = battleMessage.components.map(actionRow => {
                  // Use ActionRowBuilder.from to properly clone the action row
                  const newActionRow = ActionRowBuilder.from(actionRow);
                  newActionRow.components = newActionRow.components.map(button => {
                    if (button.type === ComponentType.Button) {
                      button.setDisabled(true);
                    }
                    return button;
                  });
                  return newActionRow;
                });

                // Edit the message to disable the buttons
                await battleMessage.edit({
                  components: disabledComponents
                });
              }
            }
          } catch (error) {
            console.error('Failed to disable registration buttons:', error);
          }
        }

        await currentBattle.save();
        // Notify the channel
        const cancelEmbed = new EmbedBuilder()
        .setTitle('❌ Battle Cancelled ❌')
        .setDescription('The battle was cancelled due to insufficient participants.')
        .setColor('#FF0000')
        .setTimestamp();
        interaction.channel.send({
          embeds: [cancelEmbed]
        });

        await Battle.findByIdAndDelete(currentBattle._id);
      }
    },
      1 * 60 * 60 * 1000); // 1 hours in milliseconds
  }
};