import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import {
  client
} from "../../../bot.js";

import fs from 'fs';
import path from 'path';
import {
  fileURLToPath
} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', '../../../../data/topics.json');
const raw = fs.readFileSync(filePath, 'utf8');
const topics = JSON.parse(raw);

// Function to pick a random topics
const getRandomTopic = () => topics[Math.floor(Math.random() * topics.length)];

export default {
  name: "topic",
  description: "Get a random discussion topic!",
  aliases: ["question",
    "prompt"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, context) => {
    try {
      if (!topics.length) {
        throw new Error("The topic list is empty. Please add topics to the list.");
      }

      const isInteraction = !!context.isInteraction; // Check if it's an interaction
      const user = isInteraction ? context.user: context.author;

      // Generate the first topic
      const {
        topic,
        category
      } = getRandomTopic();

      // Create the embed
      const embed = new EmbedBuilder()
      .setTitle("🗨️ 🅃🄾🄿🄸🄲")
      .setDescription(`### ${topic}\n-# ${category}`)
      .setFooter({
        text: `Requested by ${user.username}`, iconURL: user.displayAvatarURL()
      })
      .setColor("Random");

      // Create the button
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("new_topic")
        .setLabel("𝘙𝘈𝘕𝘋𝘖𝘔")
        .setStyle(ButtonStyle.Primary)
      );

      // Reply to the interaction or message
      const reply = await (isInteraction
        ? context.reply({
          embeds: [embed], components: [row], fetchReply: true
        }): context.reply({
          embeds: [embed], components: [row]
        })
      )

    } catch (error) {
      console.error("Error executing the topic command:",
        error);
      const errorMessage = "An error occurred while executing the command. Please try again later.";

      if (context.isInteraction) {
        try {
          await context.reply({
            content: errorMessage,
            ephemeral: true
          });
        } catch (error) {
          console.error("Failed to send reply:", error);
        }
      } else {
        try {
          await context.reply({
            content: errorMessage, ephemeral: true
          });
        } catch (error) {
          console.error("Failed to send reply:", error);
        }
      }
    }
  },
};

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.customId === "new_topic") {
        // Disable the previous button
        const oldMessage = interaction.message;
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId("new_topic")
          .setLabel("𝘙𝘈𝘕𝘋𝘖𝘔")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
        );

        try {
          await oldMessage.edit({
            components: [disabledRow],
          });
        } catch (error) {
          console.error("Failed to edit the message:", error);
        }

        // Generate new topic
        const {
          topic: newTopic,
          category: newCategory
        } = getRandomTopic();

        const newEmbed = new EmbedBuilder()
        .setTitle("🗨️ 🅃🄾🄿🄸🄲")
        .setDescription(`### ${newTopic}\n-# ${newCategory}`)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor("Random");

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
          .setCustomId("new_topic")
          .setLabel("𝘙𝘈𝘕𝘋𝘖𝘔")
          .setStyle(ButtonStyle.Primary)
        );

        // Send a reply with the new embed and button
        try {
          await interaction.reply({
            embeds: [newEmbed],
            components: [newRow],
          });
        } catch (error) {
          console.error("Failed to send the reply:", error);
        }
      }
    } catch (error) {
      console.error("Error handling button interaction:", error);
      if (!interaction.replied) {
        try {
          await interaction.reply({
            content: "An error occurred while fetching a new topic. Please try again later.",
            ephemeral: true,
          });
        } catch (error) {
          console.error("Failed to send an error response:", error);
        }
      }
    }
  });