import txtcommands from '../../textCommandHandler.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import {
  fileURLToPath
} from 'url';

import {
  categoriesArray
} from "../../categories.js";

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

async function handleCategoryContext(ctx, options) {
  try {
    if (ctx.author || typeof ctx.editReply !== 'function') {
      return ctx.channel.send(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    if (!ctx.deferred || !ctx.replied) {
      return ctx.update(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return ctx.reply(options).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } catch (e) {
    console.error(e);
  }
}

async function handleCategory(authorId, ctx, chosenCategory, commandsByCategory, helpMessage, selectRow) {
  try {
    const commandsList = commandsByCategory[chosenCategory];
    if (!commandsList || commandsList.length === 0) {
      await handleCategoryContext(ctx, {
        content: "❌ No commands found for this category.",
        ephemeral: true
      });
      return null;
    }

    // Paginate the commands: five per page.
    const pageSize = 5;
    const pages = [];
    for (let i = 0; i < commandsList.length; i += pageSize) {
      const chunk = commandsList.slice(i, i + pageSize);
      const pageContent = chunk
      .map(cmd => `${cmd.emoji ? cmd.emoji + " ⤿ ": "⌘ ⤿ "} **${cmd.name}**\n-# ${cmd.description}\n`)
      .join("\n");
      pages.push(pageContent);
    }

    let currentPage = 0;

    // Build the embed for the selected category.
    const categoryEmbed = new EmbedBuilder()
    .setTitle(`${chosenCategory} Commands`)
    .setDescription(
      `> Commands start with **\`kas\`**\n-# Example: kas profile\nUse **\`help <command>\`** for more details.\n\n` +
      pages[currentPage]
    )
    .setFooter({
      text: `Page ${currentPage + 1} of ${pages.length}`
    });

    // Create pagination buttons if needed.
    let buttonRow = null;
    const prevButton = new ButtonBuilder()
    .setCustomId("prev_page")
    .setLabel("Previous")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);
    const nextButton = new ButtonBuilder()
    .setCustomId("next_page")
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pages.length > 1 ? false: true);
    buttonRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

    // Update the message with the new embed and buttons.

    if (!helpMessage) {
      helpMessage = await handleCategoryContext(ctx, {
        embeds: [categoryEmbed],
        components: selectRow ? (buttonRow ? [selectRow, buttonRow]: [selectRow]): (buttonRow ? [buttonRow]: [])
      });
    } else {
      await handleCategoryContext(ctx, {
        embeds: [categoryEmbed],
        components: selectRow ? (buttonRow ? [selectRow, buttonRow]: [selectRow]): (buttonRow ? [buttonRow]: [])
      });
    }

    // Create a pagination collector for the buttons.
    const paginationCollector = helpMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
    });

    paginationCollector.on('collect', async btnInteraction => {
      if (btnInteraction.user.id !== authorId) {
        await replyOrSend(btnInteraction, {
          content: `You are not allowed to interact with someone else's help command!`
        });

        return;
      }

      if (btnInteraction.customId === "prev_page") {
        currentPage = Math.max(currentPage - 1, 0);
      } else if (btnInteraction.customId === "next_page") {
        currentPage = Math.min(currentPage + 1, pages.length - 1);
      }

      // Update the disabled state of the buttons.
      buttonRow.components[0].setDisabled(currentPage === 0);
      buttonRow.components[1].setDisabled(currentPage === pages.length - 1);

      // Update the embed content.
      categoryEmbed.setDescription(pages[currentPage])
      .setFooter({
        text: `Page ${currentPage + 1} of ${pages.length}`
      });

      try {
        if (!btnInteraction.replied || !btnInteraction.deferred) {
          await btnInteraction.update({
            embeds: [categoryEmbed],
            components: selectRow ? [selectRow, buttonRow]: [buttonRow]
          });
        }
      } catch (err) {
        console.error("Pagination update error:", err);
      }
    });
    // Return the new pagination collector so the caller can store it.
    return paginationCollector;
  } catch (err) {
    console.error("Error in handleCategory:",
      err);
    await handleCategoryContext(ctx,
      {
        content: "❌ An error occurred while processing your selection.",
        ephemeral: true
      });
    return null;
  }
}

export default {
  name: "help",
  description: "Provides an interactive help menu with command categories.",
  aliases: ["commands"],
  args: "[command name]",
  example: [
    "help",
    "help bank" // Shows detailed help for the “bank” command.
  ],
  category: "🔧 Utility",
  cooldown: 10000,
  execute: async (args,
    message) => {
    try {
      // ─── SHOW DETAILED COMMAND HELP ─────────────────────────────
      if (args[1] && (!categoriesArray.find(c => c.toLowerCase().includes(args[1].toLowerCase())) && !args[1].includes("shop") && !args[1].includes("ocean"))) {
        const commandName = args[1].toLowerCase();
        const command = txtcommands.get(commandName);
        if (!command) {
          await replyOrSend(message, {
            content: `❌ Command \`${commandName}\` not found.`
          });
          return;
        }

        let response = `${command.emoji ? command.emoji + " ⤿ ": "⌘ ⤿ "}**${command.name}**\n`;
        response += `-# ${command.description}\n`;
        if (command.aliases.length) response += `\n✦ **𝗔𝗟𝗜𝗔𝗦𝗘𝗦:**\`\`\`${command.aliases.join(', ')}\`\`\`\n`;
        if (command.args) response += `⚡︎ **𝗨𝗦𝗔𝗚𝗘:**\`\`\`${command.name} ${command.args}\`\`\`\n`;
        if (command.example && command.example.length > 0) {
          response += `⚘ **𝗘𝗫𝗔𝗠𝗣𝗟𝗘𝗦:**\n${command.example.map(ex => `- ${ex}`).join('\n')}\n`;
        }
        if (command.related && command.related.length > 0) {
          response += `⤿ **𝗥𝗘𝗟𝗔𝗧𝗘𝗗:** ${command.related.join(', ')}\n`;
        }
        response += `\`⏱ \`**\`𝗖𝗢𝗢𝗟𝗗𝗢𝗪𝗡:\`** \`${command.cooldown / 1000} seconds\`\n`;

        const embed = new EmbedBuilder()
        .setTitle(`𝘾𝙤𝙢𝙢𝙖𝙣𝙙 𝙃𝙚𝙡𝙥: ${command.name}`)
        .setDescription(response)
        .setFooter({
          text: `𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗬: ${command.category}`
        })
        .setColor("#192144");

        // Create the “View Guide” button.
        const guideButton = new ButtonBuilder()
        .setCustomId(`viewGuide_${command.name}`)
        .setLabel("🗒️ 𝙑𝙄𝙀𝙒 𝙂𝙐𝙄𝘿𝙀")
        .setStyle(ButtonStyle.Secondary);
        const guideRow = new ActionRowBuilder().addComponents(guideButton);

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const guideFilePath = path.join(__dirname, "../../help", `${command.name}.js`);

        const sentMsg = await replyOrSend(message, {
          embeds: [embed],
          components: fs.existsSync(guideFilePath) ? [guideRow]: []
        });

        // Listen for the guide button (active for 180 seconds)
        const collector = sentMsg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 180000
        });
        collector.on('collect', async interaction => {
          try {
            if (interaction.customId === `viewGuide_${command.name}`) {
              await interaction.deferUpdate(); // Acknowledge immediately.
              await handleGuideCommand(command.name, message);
            }
          } catch (err) {
            console.error("Guide button error:", err);
            if (!interaction.deferred && !interaction.replied) {
              await interaction.reply({
                content: "❌ An error occurred while processing your request.", ephemeral: true
              });
            }
          }
        });
        return;
      }

      // ─── NO ARGUMENT: SHOW INTERACTIVE CATEGORY MENU ─────────────
      // Group commands by category, filtering out duplicates and hidden commands.
      // Build the commands-by-category object.
      const commandsByCategory = {};
      const seenCommands = new Set();
      txtcommands.forEach(cmd => {
        if (seenCommands.has(cmd.name)) return;
        seenCommands.add(cmd.name);
        if (cmd.visible === false) return;
        if (!commandsByCategory[cmd.category]) commandsByCategory[cmd.category] = [];
        commandsByCategory[cmd.category].push(cmd);
      });

      const authorId = message.author ? message.author.id: message.user.id;

      if (args[1]) {
        const categoryName = Object.keys(commandsByCategory).find((cmds) => {
          if (cmds.toLowerCase().includes(args[1].toLowerCase())) {
            return true;
          }
        });

        await handleCategory(authorId,
          message,
          categoryName,
          commandsByCategory,
          null,
          null);

        return;
      }

      // Build a select menu for all categories.
      const selectOptions = Object.keys(commandsByCategory).map(category => ({
        label: category,
        value: category,
        description: `Show commands in ${category}`
      }));

      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_select_category")
      .setPlaceholder("Select a command category")
      .addOptions(selectOptions);

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
      .setTitle("<:help:1350379705689440358> Help Menu")
      .setDescription(
        `<a:glowing_sat_outside_emoji:1355140019337170954>𝘚𝘦𝘭𝘦𝘤𝘵 𝘢 𝘤𝘢𝘵𝘦𝘨𝘰𝘳𝘺 𝘧𝘳𝘰𝘮 𝘵𝘩𝘦 𝘥𝘳𝘰𝘱‐𝘥𝘰𝘸𝘯 𝘣𝘦𝘭𝘰𝘸 𝘵𝘰 𝘷𝘪𝘦𝘸 𝘪𝘵𝘴 𝘤𝘰𝘮𝘮𝘢𝘯𝘥𝘴.\n` +
        ` <:spark:1355139233559351326> Use **\`help <command>\`** for quick help on a command.\n` +
        ` <:spark:1355139233559351326> Use **\`guide <command>\`** to get a short guide on its subcommands, if available.\n` +
        ` <:spark:1355139233559351326> All commands must be triggered with a prefix, e.g., **kas**.\n` +
        `<:feather_outside_emoji:1355140550462017609> **[𝖲𝗎𝗉𝗉𝗈𝗋𝗍 𝖲𝖾𝗋𝗏𝖾𝗋](https://discord.gg/DVFwCqUZnc)**\n` +
        `<:emoji_35:1332676884093337603> **[𝖨𝗇𝗏𝗂𝗍𝖾 𝖬𝖾](https://discord.com/oauth2/authorize?client_id=1300081477358452756&permissions=139586816064&integration_type=0&scope=bot)**`
      );

      // Send the help menu.
      const helpMessage = await replyOrSend(message,
        {
          embeds: [embed],
          components: [selectRow]
        });

      // Global variable to keep track of the active pagination collector.
      let activePaginationCollector = null;

      // Listen for a category selection.
      const menuCollector = helpMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 180000
      });

      menuCollector.on('collect',
        async interaction => {

          if (interaction.user.id !== authorId) {
            await replyOrSend(interaction, {
              content: `You are not allowed to interact with someone else's help command!`
            });

            return;
          }

          // Stop any existing pagination collector before starting a new one.
          if (activePaginationCollector) {
            //   activePaginationCollector.removeAllListeners('end');
            activePaginationCollector.stop();
            activePaginationCollector = null;
          }

          const chosenCategory = interaction.values[0];
          // Call the new handler and update our active collector.
          activePaginationCollector = await handleCategory(authorId, interaction, chosenCategory, commandsByCategory, helpMessage, selectRow);
        });

      menuCollector.on('end',
        async () => {
          // Disable the select menu after timeout.
          try {
            selectMenu.setDisabled(true);
            await helpMessage.edit({
              components: [new ActionRowBuilder().addComponents(selectMenu)]
            });
          } catch (err) {}
        });
    } catch (error) {
      console.error(error);
      await replyOrSend(message,
        {
          content: "❌ An unexpected error occurred while executing the help command."
        });
      return;
    }
  }
};

  // ─── HELPER: SIMULATE CALLING THE GUIDE COMMAND ─────────────────────────────
  async function handleGuideCommand(commandName,
    message) {
    try {
      const guideCommand = (await import(`./guide.js`)).default;
      // Pass an array where the first element is the command name.
      guideCommand.execute(["guid",
        commandName],
        message);
    } catch (err) {
      console.error(err);
      await replyOrSend(message,
        {
          content: "❌ There was an error loading the guide."
        });
      return;
    }
  }