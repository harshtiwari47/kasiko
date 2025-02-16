import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import {
  fileURLToPath
} from 'url';

async function replyOrSend(ctx, options) {
  try {
    if (ctx.author || typeof ctx.editReply !== 'function') {
      return ctx.channel.send(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    if (ctx.deferred || ctx.replied) {
      return ctx.editReply(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return ctx.reply(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (e) {}
}

export default {
  name: "guide",
  description: "Provides a detailed guide for a specific command with pagination.",
  args: "<command name>",
  example: ["guide bank"],
  category: "🔧 Utility",
  cooldown: 10000,
  async execute(args, message) {
    try {
      args.shift();
      // Validate that a command name was provided.
      if (!args[0]) {
        await replyOrSend(message, {
          content: "❌ Please specify a command name to view its guide."
        });
        return;
      }
      const commandName = args[0].toLowerCase();

      // Resolve the absolute path to the guide file (assumed to be in a subfolder "help")
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const guideFilePath = path.join(__dirname, "../../help", `${commandName}.js`);

      if (!fs.existsSync(guideFilePath)) {
        await replyOrSend(message, {
          content: `❌ No guide found for command \`${commandName}\`.`
        });
        return;
      }

      // Dynamically import the guide file.
      let guideData;
      try {
        guideData = (await import(guideFilePath)).default;
      } catch (err) {
        console.error(err);
        await replyOrSend(message, {
          content: `❌ Failed to load guide for command \`${commandName}\`.`
        });
        return;
      }

      // Expecting guideData.subcommands to be an object.
      const subcommands = guideData.subcommands;
      const subcommandKeys = Object.keys(subcommands);
      if (subcommandKeys.length === 0) {
        await replyOrSend(message, {
          content: `❌ No guide content available for \`${commandName}\`.`
        });
        return;
      }

      // Choose a default section; if "default" is missing, pick the first available section.
      let selectedSubcommand = "default";
      if (!subcommands[selectedSubcommand]) {
        selectedSubcommand = subcommandKeys[0];
      }

      let currentPages = subcommands[selectedSubcommand]; // Array of markdown pages
      let currentPageIndex = 0;

      // Helper function to build the guide embed for the current page.
      const createGuideEmbed = (pageIndex) => {
        return new EmbedBuilder()
        .setTitle(`𝙂𝙪𝙞𝙙𝙚 𝙛𝙤𝙧 ${commandName} – ${selectedSubcommand}`)
        .setDescription(currentPages[pageIndex])
        .setFooter({
          text: `𝖯𝖺𝗀𝖾 ${pageIndex + 1} of ${currentPages.length}`
        })
        .setColor(0x3498db);
      };

      // Create pagination buttons.
      const prevButton = new ButtonBuilder()
      .setCustomId("guide_prev")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

      const nextButton = new ButtonBuilder()
      .setCustomId("guide_next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPages.length <= 1);

      const buttonRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

      // If there are multiple guide sections, add a select menu for choosing the section.
      let selectRow = null;
      if (subcommandKeys.length > 1) {
        const options = subcommandKeys.map(key => ({
          label: key,
          value: key,
          description: `Show guide for ${key}`
        }));

        const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("guide_select_section")
        .setPlaceholder("Select a guide section")
        .addOptions(options);

        selectRow = new ActionRowBuilder().addComponents(selectMenu);
      }

      // Build the initial components array.
      const components = selectRow ? [selectRow,
        buttonRow]: [buttonRow];
      const guideEmbed = createGuideEmbed(currentPageIndex);

      // Send the initial guide message.
      let guideMessage;
      try {
        guideMessage = await replyOrSend(message, {
          embeds: [guideEmbed],
          components: components
        });
      } catch (err) {
        console.error("Failed to send guide message:", err);
        return;
      }

      const authorId = message.author ? message.author.id: message.user.id;

      // Create a collector for both button and select menu interactions.
      const collector = guideMessage.createMessageComponentCollector({
        time: 300000 // Collector active for 5 minutes.
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== authorId) {
          await replyOrSend(interaction, {
            content: `You are not allowed to interact with someone else's help command!`
          });

          return;
        }

        try {
          // Handle button interactions.
          if (interaction.isButton()) {
            if (interaction.customId === "guide_prev") {
              currentPageIndex = Math.max(currentPageIndex - 1, 0);
            } else if (interaction.customId === "guide_next") {
              currentPageIndex = Math.min(currentPageIndex + 1, currentPages.length - 1);
            }
          }
          // Handle select menu interactions.
          else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "guide_select_section") {
              selectedSubcommand = interaction.values[0];
              currentPages = subcommands[selectedSubcommand];
              currentPageIndex = 0;
            }
          }

          // Update the disabled state of pagination buttons.
          buttonRow.components[0].setDisabled(currentPageIndex === 0);
          buttonRow.components[1].setDisabled(currentPageIndex === currentPages.length - 1);

          // Rebuild the embed with the updated page content.
          const updatedEmbed = createGuideEmbed(currentPageIndex);
          const updatedComponents = selectRow ? [selectRow,
            buttonRow]: [buttonRow];

          await interaction.update({
            embeds: [updatedEmbed],
            components: updatedComponents
          });
        } catch (error) {
          console.error("Error updating guide interaction:", error);
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: "An error occurred processing your request.",
                ephemeral: true
              });
            }
          } catch (err) {
            console.error("Failed to send error message:", err);
          }
        }
      });

      collector.on('end',
        async () => {
          try {
            // Check if the message still exists
            if (!guideMessage) {
              return;
            }

            // Check if the message has components
            if (!guideMessage.components || guideMessage.components.length === 0) {
              return;
            }

            // Attempt to disable all components
            const disabledComponents = guideMessage.components.map(row => {
              try {
                return new ActionRowBuilder().addComponents(
                  row.components.map(component => {
                    try {
                      if (component.data.custom_id) {
                        // If it's a button
                        if (component.data.style !== undefined) {
                          return new ButtonBuilder(component.data).setDisabled(true);
                        }
                        // If it's a select menu
                        return new StringSelectMenuBuilder(component.data).setDisabled(true);
                      }
                      return component;
                    } catch (innerError) {
                      console.error("Error processing component:", component, innerError);
                      return component;
                    }
                  })
                );
              } catch (rowError) {
                console.error("Error processing row:", row, rowError);
                return row;
              }
            });

            // Check if the disabled components are valid
            if (!disabledComponents || disabledComponents.length === 0) {
              console.error("Error: No valid components found to disable.");
              return;
            }

            // Edit the message to disable components

            if (guideMessage && guideMessage.edit) {
              try {
                await guideMessage.edit({
                  components: disabledComponents
                });
              } catch (e) {}
            }
            return;
          } catch (error) {
            console.error("Unexpected error disabling components after collector end:", error);
          }
        });
    } catch (e) {
      if (e.message !== "Unknown Message" && e.message !== "Missing Permissions") {
        console.error(e);
      }
    }
  }
};