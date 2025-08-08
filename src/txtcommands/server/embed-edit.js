import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  InteractionCollector,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType
} from 'discord.js';

import {
  client
} from "../../../bot.js";

import ContainerMessage from '../../../models/Containers.js';
import {
  discordUser,
  handleMessage
} from '../../../helper.js';

import TestCmd, {
  buildContainerFromData
} from "./embed-test.js";

const generateButtons = (container) => {
  const buttons = [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId(`container_add_components:${container.id}`)
    .setLabel('Component')
    .setEmoji({
      id: "1403061213360951386"
    })
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId(`container_edit_color:${container.id}`)
    .setLabel('Color')
    .setEmoji({
      id: "1403061265894736073"
    })
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId(`container_delete_components:${container.id}`)
    .setLabel('Delete Component')
    .setEmoji({
      id: "1403061192431370302"
    })
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId(`container_set_channel:${container.id}`)
    .setLabel('Channel')
    .setEmoji({
      id: "1403289887364616274"
    })
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId(`container_refresh:${container.id}`)
    .setLabel('Refresh')
    .setEmoji({
      id: "1403061240397566064"
    })
    .setStyle(ButtonStyle.Secondary)
  ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId(`container_edit_components:${container.id}`)
      .setLabel('Edit Components')
      .setEmoji({
        id: "1403061170033660034"
      })
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId(`container_test:${container.id}`)
      .setLabel('🎚️ Test')
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId(`container_send:${container.id}`)
      .setLabel('Send')
      .setEmoji({
        id: "1403061150999904336"
      })
      .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
      .setCustomId(`container_variables:${container.id}`)
      .setLabel('Variables')
      .setEmoji({
        id: "1403061104279818350"
      })
      .setStyle(ButtonStyle.Secondary)
    )
  ]

  return buttons
}

async function handleChoice(choice, id, i, prevMsg) {
  if (choice === "text") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_txt:${id}`)
    .setTitle('Add Your Text');

    const input = new TextInputBuilder()
    .setCustomId('txt_comp')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your content here...')
    .setMaxLength(4000)
    .setValue('');

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return i.showModal(modal);
  }

  if (choice === "section") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_section:${id}`)
    .setTitle('Section Component');

    const text = new TextInputBuilder()
    .setCustomId('txt_comp')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your content here...')
    .setMaxLength(4000)
    .setValue('');

    const thumb = new TextInputBuilder()
    .setCustomId('thumbnail_comp')
    .setLabel('URL')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your media URL here...')
    .setMaxLength(1000)
    .setValue('');

    modal.addComponents(
      new ActionRowBuilder().addComponents(text),
      new ActionRowBuilder().addComponents(thumb)
    );

    return i.showModal(modal);
  }

  if (choice === "media") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_media:${id}`)
    .setTitle('Media Component');

    const url1 = new TextInputBuilder()
    .setCustomId('media_url_comp_1')
    .setLabel('URL 1')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your URL here...')
    .setMaxLength(1000)
    .setValue('');

    const url2 = new TextInputBuilder()
    .setCustomId('media_url_comp_2')
    .setLabel('URL 2')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue('');

    const url3 = new TextInputBuilder()
    .setCustomId('media_url_comp_3')
    .setLabel('URL 3')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue('');

    const url4 = new TextInputBuilder()
    .setCustomId('media_url_comp_4')
    .setLabel('URL 4')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue('');

    const url5 = new TextInputBuilder()
    .setCustomId('media_url_comp_5')
    .setLabel('URL 5')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue('');

    modal.addComponents(
      new ActionRowBuilder().addComponents(url1),
      new ActionRowBuilder().addComponents(url2),
      new ActionRowBuilder().addComponents(url3),
      new ActionRowBuilder().addComponents(url4),
      new ActionRowBuilder().addComponents(url5)
    );

    return i.showModal(modal);
  }

  if (choice === "separator") {

    if (!i?.deferred && !i?.replied) {
      await i.deferUpdate().catch(e => {})
    }

    let container = await ContainerMessage.findOne(
      {
        id
      });

    let compList = container.components ?? [];
    compList.push({
      type: "separator"
    });

    container = await ContainerMessage.findOneAndUpdate(
      {
        id
      },
      {
        $set: {
          components: compList
        }
      },
      {
        new: true
      }
    );

    const preview = await buildContainerFromData(container, i);
    const buttons = generateButtons(container);

    try {
      const containerReply = new ContainerBuilder()
      .addTextDisplayComponents(txt => txt.setContent(`✅ **Separator** has been updated and saved.`));

      prevMsg?.edit({
        components: [preview, ...buttons],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      })

      await i.editReply({
        components: [containerReply],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });

    } catch (e) {}
  }
}

async function handleEditChoice(choice, pos, id, i, prevMsg, containerInfo) {
  const compInfo = containerInfo.components[pos];

  if (choice === "text") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_txt_edit:${id}`)
    .setTitle('Add Your Text');

    const input = new TextInputBuilder()
    .setCustomId('txt_comp')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your content here...')
    .setMaxLength(4000)
    .setValue(compInfo?.text?.content || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return i.showModal(modal);
  }

  if (choice === "section") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_section_edit:${id}`)
    .setTitle('Section Component');

    const text = new TextInputBuilder()
    .setCustomId('txt_comp')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your content here...')
    .setMaxLength(4000)
    .setValue(compInfo?.section?.textDisplays?.[0]?.content || '');

    const thumb = new TextInputBuilder()
    .setCustomId('thumbnail_comp')
    .setLabel('URL')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your media URL here...')
    .setMaxLength(1000)
    .setValue(compInfo?.section?.media?.url || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(text),
      new ActionRowBuilder().addComponents(thumb)
    );

    return i.showModal(modal);
  }

  if (choice === "media") {
    const modal = new ModalBuilder()
    .setCustomId(`modal_container_comp_media_edit:${id}`)
    .setTitle('Media Component');

    const url1 = new TextInputBuilder()
    .setCustomId('media_url_comp_1')
    .setLabel('URL 1')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Your URL here...')
    .setMaxLength(1000)
    .setValue(compInf?.media?.urls?.[0] || '');

    const url2 = new TextInputBuilder()
    .setCustomId('media_url_comp_2')
    .setLabel('URL 2')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue(compInf?.media?.urls?.[1] || '');

    const url3 = new TextInputBuilder()
    .setCustomId('media_url_comp_3')
    .setLabel('URL 3')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue(compInf?.media?.urls?.[2] || '');

    const url4 = new TextInputBuilder()
    .setCustomId('media_url_comp_4')
    .setLabel('URL 4')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue(compInf?.media?.urls?.[4] || '');

    const url5 = new TextInputBuilder()
    .setCustomId('media_url_comp_5')
    .setLabel('URL 5')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Your URL here...(optional)')
    .setMaxLength(1000)
    .setValue(compInf?.media?.urls?.[4] || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(url1),
      new ActionRowBuilder().addComponents(url2),
      new ActionRowBuilder().addComponents(url3),
      new ActionRowBuilder().addComponents(url4),
      new ActionRowBuilder().addComponents(url5)
    );

    return i.showModal(modal);
  }
}

async function handleDeleteChoice(choice, pos, id, i, prevMsg, containerInfo) {
  if (!i?.deferred && !i?.replied) {
    await i.deferUpdate().catch(e => {})
  }

  let container = await ContainerMessage.findOne(
    {
      id
    });

  let compList = container.components ?? [];
  compList.splice(pos, 1);

  container = await ContainerMessage.findOneAndUpdate(
    {
      id
    },
    {
      $set: {
        components: compList
      }
    },
    {
      new: true
    }
  );

  const preview = await buildContainerFromData(container, i);
  const buttons = generateButtons(container);

  try {
    const containerReply = new ContainerBuilder()
    .addTextDisplayComponents(txt => txt.setContent(`✅ **${choice}** has been deleted and saved.`));

    prevMsg?.edit({
      components: [preview, ...buttons],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    })

    await i.editReply({
      components: [containerReply],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });

  } catch (e) {}
}

export default {
  name: 'embed-edit',
  description: 'Interactive editor for existing embed containers.',
  args: false,
  aliases: ['ce-edit',
    'editembed',
    'embedmodify'],
  category: 'server',
  emoji: "📦",
  visible: false,
  cooldown: 10000,

  async execute(args, context) {
    try {
      const {
        member,
        guild,
        channel
      } = context;
      const {
        name: userName,
        id: userId
      } = discordUser(context);

      if (!member.permissions.has('ManageGuild')) {
        return handleMessage(context, {
          content: `🚫 **${userName}**, you need **Manage Server** permission to edit embeds.`
        });
      }

      args.shift();
      const embedName = args.join(' ').trim();
      if (!embedName) {
        return handleMessage(context, {
          content: '❌ Please specify the name of the embed to edit. Example: `embed-edit welcome-message`'
        });
      }

      let container = await ContainerMessage.findOne({
        server: guild.id, name: embedName
      });

      if (!container) {
        return handleMessage(context, {
          content: `⚠️ No embed container named **${embedName}** found in this server.`
        });
      }

      let preview = await buildContainerFromData(container, context);
      const buttons = generateButtons(container);

      const prevMsg = await handleMessage(context, {
        components: [preview, ...buttons],
        flags: MessageFlags.IsComponentsV2
      });

      // Collector for next 6 minutes
      const collector = prevMsg.createMessageComponentCollector({
        time: 360000
      });

      collector.on('collect', async interaction => {
        const [action,
          id] = interaction.customId.split(':');

        if (id !== container.id) return;

        container = await ContainerMessage.findOne(
          {
            id
          });

        switch (action) {
        case 'container_refresh': {
            let preview = await buildContainerFromData(container, context);
            const buttons = generateButtons(container);

            await interaction.update({
              components: [preview, ...buttons],
              flags: MessageFlags.IsComponentsV2
            });

            break;
          }

        case 'container_send': {

            if (!interaction?.deferred && !interaction?.replied) {
              await
              interaction.deferReply({
                ephemeral: true
              }).catch(e => {})
            }

            if (!container?.channelId) {
              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt =>
                txt.setContent(`⚠️ No channel has been set for **${container.name}** in this server.`)
              );

              await interaction.editReply({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });
            }

            const channel = client.channels?.cache?.get(container?.channelId);

            const containerPrev = await buildContainerFromData(container, context);

            if (!channel) {
              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt =>
                txt.setContent(`⚠️ The designated channel for **${embedName}** could not be found in this server.`)
              );

              await interaction.editReply({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });
            }

            try {
              await channel.send({
                components: [containerPrev],
                flags: MessageFlags.IsComponentsV2
              });

              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt =>
                txt.setContent(
                  `✅ The embed has been sent successfully!`
                )
              );

              await interaction.editReply({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });

            } catch (err) {
              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt =>
                txt.setContent(
                  `⚠️ The bot is missing some permissions. An error occurred — please ensure it has the following: **Send Messages**, **Embed Links**, **Attach Files**, **Use External Emojis**, and **Use External Stickers**.`
                )
              );

              await interaction.editReply({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });
            }

            break;
          }

        case 'container_edit_color': {
            const modal = new ModalBuilder()
            .setCustomId(`modal_container_color:${id}`)
            .setTitle('Edit Accent Color (HEX)');

            const input = new TextInputBuilder()
            .setCustomId('hexcode')
            .setLabel('Container Accent Color')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setPlaceholder('Enter hex code...')
            .setMaxLength(7)
            .setValue(`${container?.accentColor?.toString(16) || ''}` || '');

            modal.addComponents(
              new ActionRowBuilder().addComponents(input)
            );

            return interaction.showModal(modal);
          }

        case 'container_add_components': {
            const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_add_components:${container.id}`)
            .setPlaceholder('Choose a component...')
            .setMinValues(1) // Must select at least 1
            .setMaxValues(1) // Can only select 1
            .addOptions(
              new StringSelectMenuOptionBuilder()
              .setLabel('Text')
              .setValue('text'),

              new StringSelectMenuOptionBuilder()
              .setLabel('Separator')
              .setValue('separator'),

              new StringSelectMenuOptionBuilder()
              .setLabel('Section')
              .setValue('section'),

              new StringSelectMenuOptionBuilder()
              .setLabel('Media')
              .setValue('media')
            );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
              components: [new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`Choose a component from the list:`)),
                row],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });

            break;
          }

        case 'container_edit_components': {
            const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_edit_components:${container.id}`)
            .setPlaceholder('Choose a component to edit...')
            .setMinValues(1) // Must select at least 1
            .setMaxValues(1) // Can only select 1
            const options = [];

            for (let i = 0; i < container.components.length; i++) {
              const cmp = container.components[i];

              if (i > 16) continue;

              if (cmp?.type !== "separator") {
                options.push(new StringSelectMenuOptionBuilder()
                  .setLabel(`ID: ${i+1} — ${cmp?.type}`)
                  .setValue(`${cmp?.type}:${i}`)
                )
              }
            }

            selectMenu.addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
              components: [new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`Choose a component from the list to edit:`)),
                row],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });

            break;
          }

        case 'container_delete_components': {
            const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_delete_components:${container.id}`)
            .setPlaceholder('Choose a component to delete...')
            .setMinValues(1) // Must select at least 1
            .setMaxValues(1) // Can only select 1
            const options = [];

            for (let i = 0; i < container.components.length; i++) {
              const cmp = container.components[i];

              if (i > 16) continue;

              options.push(new StringSelectMenuOptionBuilder()
                .setLabel(`ID: ${i+1} — ${cmp?.type}`)
                .setValue(`${cmp?.type}:${i}`)
              )
            }

            selectMenu.addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
              components: [new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`Choose a component from the list to delete:`)),
                row],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });

            break;
          }

        case 'container_set_channel': {
            const channelMenu = new ChannelSelectMenuBuilder()
            .setCustomId('select_container_channel')
            .setPlaceholder('Choose a channel...')
            .setMinValues(1)
            .setMaxValues(1)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement); // Optional: limit to specific types

            const row = new ActionRowBuilder().addComponents(channelMenu);

            await interaction.reply({
              components: [new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`Choose a channel from the list for the embed:`)),
                row],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });

            break;
          }

        case 'container_test': {
            await TestCmd.execute(["test-container", container.name], interaction);
            break;
          }

        case 'container_variables': {
            const containerReply = new ContainerBuilder().addTextDisplayComponents(txt =>
              txt.setContent(
                `📘 **Variable Help Guide** — Use these placeholders in your templates. They get replaced dynamically.\n\n` +
                `**User Variables**\n` +
                `• \`{user}\` — Username (no tag)\n` +
                `• \`{user_tag}\` — Username#1234\n` +
                `• \`{user_nick}\` — Nickname (or username)\n` +
                `• \`{user_id}\` — User ID\n` +
                `• \`{user_discrim}\` — Discriminator\n` +
                `• \`{user_avatar}\` — Avatar URL\n` +
                `• \`{user_banner}\` — Banner URL\n` +
                `• \`{user_createdate}\` — Account created date\n` +
                `• \`{user_joindate}\` — Server join date\n` +
                `• \`{user_displaycolor}\` — Role color\n` +
                `• \`{user_boostsince}\` — Boosting since\n\n` +

                `**Server Variables**\n` +
                `• \`{server_name}\` — Server name\n` +
                `• \`{server_id}\` — Server ID\n` +
                `• \`{server_owner_id}\` — Owner ID\n` +
                `• \`{server_owner_tag}\` — Owner tag\n` +
                `• \`{server_boostlevel}\` — Boost level\n` +
                `• \`{server_boostcount}\` — Boost count\n` +
                `• \`{server_nextboostlevel}\` — Next boost level\n` +
                `• \`{server_nextboostlevel_required}\` — Boosts required\n` +
                `• \`{server_nextboostlevel_until_required}\` — Boosts needed\n` +
                `• \`{server_verification_level}\` — Verification level\n` +
                `• \`{server_createdate}\` — Server created date\n` +
                `• \`{server_description}\` — Description\n` +
                `• \`{server_locale}\` — Locale\n` +
                `• \`{server_afk_timeout}\` — AFK timeout\n` +
                `• \`{server_afk_channel}\` — AFK channel\n` +
                `• \`{server_nsfw_level}\` — NSFW level\n` +
                `• \`{server_premium_progress_bar}\` — Premium bar\n` +
                `• \`{server_membercount_nobots}\` — Human count\n` +
                `• \`{server_botcount}\` — Bot count\n` +
                `• \`{server_rolecount}\` — Role count\n` +
                `• \`{server_channelcount}\` — Channel count\n` +
                `• \`{server_randommember}\` — Random member\n` +
                `• \`{server_randommember_tag}\` — Random member tag\n` +
                `• \`{server_randommember_nobots}\` — Random human\n\n` +

                `**Channel Variables**\n` +
                `• \`{channel}\` — Channel ID\n` +
                `• \`{channel_name}\` — Channel name\n` +
                `• \`{channel_createdate}\` — Created date\n\n` +

                `**Message Variables**\n` +
                `• \`{message_link}\` — Message URL\n` +
                `• \`{message_id}\` — Message ID\n` +
                `• \`{message_content}\` — Message text\n\n` +

                `**Misc**\n` +
                `• \`{date}\` — Current date & time`
              )
            );

            await interaction.reply({
              components: [containerReply],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
            break;
          }

        case 'container_delete': {
            await container.save();
            await interaction.followUp({
              content: `✅ **${embedName}** has been updated and saved.`, ephemeral: true
            });
            break;
          }

        default:
          break;
        }
      });

      let currentEditPos = 0;

      // Handle modal submissions
      client.on('interactionCreate',
        async i => {

          if (i.isChannelSelectMenu()) {
            if (i.customId === 'select_container_channel') {
              const selectedChannelId = i.values[0];

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id: container.id
                },
                {
                  $set: {
                    channelId: selectedChannelId
                  }
                },
                {
                  new: true
                }
              );

              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt =>
                txt.setContent(`✅ Channel <#${selectedChannelId}> has been chosen and saved.`)
              );

              await i.update({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });
            }
          }


          if (i.isStringSelectMenu()) {
            const [action,
              id] = i.customId.split(':');

            if (id !== container.id) return;

            if (action === "select_add_components") {
              const choice = i.values[0];

              return await handleChoice(choice, id, i, prevMsg);
            }

            if (action === "select_edit_components") {
              const choice = i.values[0];
              const [type,
                pos] = choice.split(':');

              currentEditPos = Number(pos);
              return await handleEditChoice(type, currentEditPos, id, i, prevMsg, container);
            }

            if (action === "select_delete_components") {
              const choice = i.values[0];
              const [type,
                pos] = choice.split(':');

              currentEditPos = Number(pos);
              return await handleDeleteChoice(type, currentEditPos, id, i, prevMsg, container);
            }

            return;
          }


          if (!i.isModalSubmit()) return;
          const [modalType,
            id] = i.customId.split(':');
          if (id !== container.id) return;

          switch (modalType) {
          case 'modal_content': {
              const newText = i.fields.getTextInputValue('newContent');
              container.content = newText;
              await i.update({
                content: 'Content updated!', components: []
              });
              break;
            }

          case 'modal_container_color': {
              const hex = i.fields.getTextInputValue('hexcode').replace('#', '').trim();
              let intColor;

              if (hex !== "") {
                // Validate hex: 3 or 6 characters, only 0-9 or a-f
                const isValidHex = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex);

                if (!isValidHex) {
                  const containerReply = new ContainerBuilder()
                  .addTextDisplayComponents(txt =>
                    txt.setContent(`⚠️ Invalid Hex Code.`)
                  );

                  return await i.reply({
                    components: [containerReply],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                  });
                }

                // If 3-digit hex, expand to 6-digit
                const fullHex = hex.length === 3
                ? hex.split('').map(c => c + c).join(''): hex;

                intColor = parseInt(fullHex, 16);
              } else {
                intColor = null;
              }

              const container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    accentColor: intColor
                  }
                },
                {
                  new: true
                }
              );

              const containerReply = new ContainerBuilder()
              .addTextDisplayComponents(txt => txt.setContent(`✅ **${embedName}** accent color has been updated and saved.`));

              const preview = await buildContainerFromData(container, i);

              const buttons = generateButtons(container);

              await i.update({
                components: [preview, ...buttons],
                flags: MessageFlags.IsComponentsV2
              });

              await i.followUp({
                components: [containerReply],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
              });

              break;
            }

          case 'modal_container_comp_txt': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              let compList = container.components ?? [];
              compList.push({
                type: "text",
                text: {
                  content: i.fields.getTextInputValue('txt_comp')
                }
              });

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Text** has been updated and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          case 'modal_container_comp_txt_edit': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              let compList = container.components ?? [];
              compList[currentEditPos] = {
                type: "text",
                text: {
                  content: i.fields.getTextInputValue('txt_comp')
                }
              };

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Text** has been updated and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          case 'modal_container_comp_section': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              let compList = container.components ?? [];
              compList.push({
                type: "section",
                section: {
                  textDisplays: [{
                    content: i.fields.getTextInputValue('txt_comp')
                  }],
                  media: {
                    url: i.fields.getTextInputValue('thumbnail_comp'),
                    description: "Thumbnail"
                  }
                }
              });

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Section** has been added and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          case 'modal_container_comp_section_edit': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              let compList = container.components ?? [];
              compList[currentEditPos] = {
                type: "section",
                section: {
                  textDisplays: [{
                    content: i.fields.getTextInputValue('txt_comp')
                  }],
                  media: {
                    url: i.fields.getTextInputValue('thumbnail_comp'),
                    description: "Thumbnail"
                  }
                }
              };

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Section** has been added and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          case 'modal_container_comp_media': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              const givenUrls = [];

              for (const [key, {
                value, type, customId
              }] of i.fields.fields.entries()) {
                if (value && value !== null && value !== "") {
                  givenUrls.push(value);
                }
              }

              let compList = container.components ?? [];
              compList.push({
                type: "media",
                media: {
                  urls: givenUrls
                }
              });

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Media** has been added and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          case 'modal_container_comp_media_edit': {

              if (!i?.deferred && !i?.replied) {
                await i.deferUpdate().catch(e => {})
              }

              let container = await ContainerMessage.findOne(
                {
                  id
                });

              const givenUrls = [];

              for (const [key, {
                value, type, customId
              }] of i.fields.fields.entries()) {
                if (value && value !== null && value !== "") {
                  givenUrls.push(value);
                }
              }

              let compList = container.components ?? [];
              compList[currentEditPos] = {
                type: "media",
                media: {
                  urls: givenUrls
                }
              };

              container = await ContainerMessage.findOneAndUpdate(
                {
                  id
                },
                {
                  $set: {
                    components: compList
                  }
                },
                {
                  new: true
                }
              );

              const preview = await buildContainerFromData(container, i);
              const buttons = generateButtons(container);

              try {
                const containerReply = new ContainerBuilder()
                .addTextDisplayComponents(txt => txt.setContent(`✅ **Media** has been added and saved.`));

                prevMsg?.edit({
                  components: [preview, ...buttons],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                })

                await i.editReply({
                  components: [containerReply],
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                });

              } catch (e) {}

              break;
            }

          default:
            break;
          }
        });

    } catch (error) {
      console.error('Error in embed-edit command:',
        error);
      return handleMessage(context,
        {
          content: `❌ Failed to launch editor: ${error.message}`
        });
    }
  },
};