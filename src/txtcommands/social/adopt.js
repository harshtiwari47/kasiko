import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

import {
  discordUser,
  handleMessage
} from '../../../helper.js';

const DEFAULT_BOY_EMOJI = '<:boy_child:1335131474055139430>';
const DEFAULT_GIRL_EMOJI = '<:girl_child:1335131494070489118>';
const DEFAULT_OTHER_EMOJI = '<:girl_child:1335131494070489118>';

function getChildEmoji(gender, customEmojis = {}) {
  if (customEmojis[gender]) return customEmojis[gender];
  return gender === 'B' ? DEFAULT_BOY_EMOJI : gender === 'G' ? DEFAULT_GIRL_EMOJI : DEFAULT_OTHER_EMOJI;
}

async function adoptChild(context, args) {
  const {
    id: authorId,
    name
  } = discordUser(context);

  const target = context.mentions.users.first();

  if (!target) return await handleMessage(context, 'Please mention a valid user to adopt.');
  if (target.bot) return await handleMessage(context, 'You cannot adopt a bot!');
  if (target.id === authorId) return await handleMessage(context, 'You cannot adopt yourself.');

  const userData = await getUserData(authorId);
  const targetData = await getUserData(target.id);

  if (!userData) return await handleMessage(context, 'Could not retrieve your user data.');
  if (!targetData) return await handleMessage(context, `Could not retrieve data for **${target.username}**.`);

  userData.family = userData.family || {};
  userData.family.adopted = userData.family.adopted || [];
  targetData.family = targetData.family || {};
  targetData.family.adopted = targetData.family.adopted || [];

  // Check 1: Cannot adopt your spouse
  if (userData.family.spouse === target.id) {
    return await handleMessage(context, `❌ You cannot adopt your own spouse **${target.username}**!`);
  }

  // Check 2: Cannot adopt your own parents (adopter or their spouse)
  if (userData.family.parents?.adopter === target.id || userData.family.parents?.spouse === target.id) {
    return await handleMessage(context, `❌ You cannot adopt your own parent **${target.username}**!`);
  }

  // Check 3: Cannot adopt your siblings (shared adopter)
  if (
    userData.family.parents?.adopter &&
    targetData.family.parents?.adopter &&
    userData.family.parents.adopter === targetData.family.parents.adopter
  ) {
    return await handleMessage(context, `❌ You cannot adopt your sibling **${target.username}**!`);
  }

  // Check 4: Cannot adopt if already in your adopted list
  if (userData.family.adopted.some(c => c.userId === target.id)) {
    return await handleMessage(context, `**${name}**, you have already adopted **${target.username}**.`);
  }

  // Check 5: Target already has parents
  if (targetData.family.parents?.adopter) {
    return await handleMessage(context, `**${name}**, **${target.username}** already has a parent.`);
  }

  // Check 6: Cannot adopt someone who adopted you (cyclical)
  const mutual = targetData.family.adopted.find(a => a.userId === authorId);
  if (mutual) {
    return await handleMessage(context, `❌ You cannot adopt **${target.username}** because they have already adopted you!`);
  }

  // Check 7: Adoption limit (max 10 adopted children)
  if (userData.family.adopted.length >= 10) {
    return await handleMessage(context, `❌ You have reached the maximum limit of **10** adopted children.`);
  }

  // Send button prompt
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('adopt_boy')
      .setLabel('Boy')
      .setEmoji('🧒')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('adopt_girl')
      .setLabel('Girl')
      .setEmoji('👧')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('adopt_other')
      .setLabel('Other')
      .setEmoji(`🧑🏻‍🦱`)
      .setStyle(ButtonStyle.Secondary)
  );

  const Container = new ContainerBuilder()
    .addTextDisplayComponents(textDisplay =>
      textDisplay.setContent(
        `## <:document:1390544433778393198> Child Adoption Request\n` +
        `**<@${authorId}>**, choose the gender you want to adopt **${target.username}** as:`
      )
    );

  const prompt = await handleMessage(context, {
    components: [Container, row],
    flags: MessageFlags.IsComponentsV2
  });

  const collector = prompt?.createMessageComponentCollector ? prompt.createMessageComponentCollector({
    time: 60000
  }) : null;

  if (!collector) return;

  let chosen;

  collector.on('collect', async interaction => {
    try {
      if (interaction.customId.startsWith("adopt_") && interaction.user.id === authorId) {
        if (!interaction.deferred) await interaction.deferUpdate();

        chosen = interaction.customId === 'adopt_boy' ? 'B' : interaction.customId === 'adopt_girl' ? 'G' : 'O';
        
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('accept')
            .setLabel('Accept')
            .setEmoji('✔️')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('reject')
            .setLabel('Reject')
            .setEmoji('🚫')
            .setStyle(ButtonStyle.Danger)
        );

        const requestContainer = new ContainerBuilder()
          .addTextDisplayComponents(textDisplay =>
            textDisplay.setContent(
              `## <:document:1390544433778393198> Adoption Request\n` +
              `**<@${target.id}>**, do you accept the adoption request from **${name}** as a ${chosen === 'B' ? 'Boy' : chosen === 'G' ? 'Girl' : 'Child'}?`
            )
          );

        return await interaction.editReply({
          components: [requestContainer, confirmRow],
          flags: MessageFlags.IsComponentsV2
        });
      } else if (interaction.customId === "accept" && interaction.user.id === target.id) {
        if (!interaction.deferred) await interaction.deferUpdate();

        // Refresh fresh data before saving
        const freshUserData = await getUserData(authorId);
        freshUserData.family = freshUserData.family || {};
        freshUserData.family.adopted = freshUserData.family.adopted || [];

        freshUserData.family.adopted.push({
          userId: target.id,
          gender: chosen || 'O',
          date: Date.now(),
          avatar: null,
          xp: 0,
          adopted: true
        });

        const parents = {
          adopter: authorId,
          spouse: freshUserData.family.spouse || null
        };

        await updateUser(authorId, {
          "family.adopted": freshUserData.family.adopted
        });

        if (freshUserData.family.spouse) {
          const spouseData = await getUserData(freshUserData.family.spouse);
          if (spouseData) {
            spouseData.family = spouseData.family || {};
            spouseData.family.adopted = freshUserData.family.adopted;
            await updateUser(freshUserData.family.spouse, {
              "family.adopted": freshUserData.family.adopted
            });
          }
        }

        await updateUser(target.id, {
          "family.parents": parents
        });

        const successContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## <:document:1390544433778393198> Adoption Successful`)
          )
          .addSectionComponents(
            section => section
              .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`**${name}** adopted **${target.username}** as a ${chosen === 'B' ? 'Boy' : chosen === 'G' ? 'Girl' : 'Child'}.`),
                textDisplay => textDisplay.setContent(`-# **${target.username}**, welcome to the family! 🎉`)
              )
              .setThumbnailAccessory(
                thumbnail => thumbnail
                  .setDescription('User PFP')
                  .setURL(target.displayAvatarURL())
              )
          );

        collector.stop('accepted');

        return await interaction.editReply({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2
        });
      } else if (interaction.customId === "reject" && interaction.user.id === target.id) {
        if (!interaction.deferred) await interaction.deferUpdate();

        const failContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## <:document:1390544433778393198> Adoption Declined`),
            textDisplay => textDisplay.setContent(`**${target.username}** declined the adoption request from **${name}**.`)
          );

        collector.stop('rejected');

        return await interaction.editReply({
          components: [failContainer],
          flags: MessageFlags.IsComponentsV2
        });
      } else {
        if (interaction.user.id !== authorId && interaction.user.id !== target.id) {
          return await interaction.reply({
            content: '❌ You are not authorized to interact with this prompt.',
            ephemeral: true
          });
        }
      }
    } catch (err) {
      console.error('[Adopt] Error in collector:', err);
    }
  });

  collector.on('end', (collected, reason) => {
    try {
      if (reason === 'time') {
        const timeoutContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## ⏱️ Adoption Request Expired`),
            textDisplay => textDisplay.setContent(`The adoption request from **${name}** to **${target.username}** timed out.`)
          );
        prompt.edit({
          components: [timeoutContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    } catch (err) {}
  });
}

export default {
  name: 'adopt',
  aliases: [],
  description: 'Adopt a user into your family.',
  emoji: "👶🏻",
  category: '💍 Social',
  cooldown: 10000,
  async execute(args, message) {
    try {
      args.shift();
      return adoptChild(message, args);
    } catch (err) {
      console.error('[Adopt] Execution error:', err);
      return message.channel.send('❗ Something went wrong while processing the adoption.');
    }
  }
};