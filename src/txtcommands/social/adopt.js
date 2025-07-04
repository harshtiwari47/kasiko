import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Message,
  EmbedBuilder,
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

import {
  client
} from "../../../bot.js";
import {
  getAllJewelry
} from '../shop/shopDataHelper.js';

const DEFAULT_BOY_EMOJI = '<:boy_child:1335131474055139430>';
const DEFAULT_GIRL_EMOJI = '<:girl_child:1335131494070489118>';
const DEFAULT_OTHER_EMOJI = '<:girl_child:1335131494070489118>';
const COIN_EMOJI = '<:kasiko_coin:1300141236841086977>';

function getChildEmoji(gender, customEmojis = {}) {
  if (customEmojis[gender]) return customEmojis[gender];
  return gender === 'B' ? DEFAULT_BOY_EMOJI: gender === 'G' ? DEFAULT_GIRL_EMOJI: DEFAULT_OTHER_EMOJI;
}

async function adoptChild(context, args) {
  const {
    id: authorId,
    name
  } = discordUser(context);

  if (!args[1]) return await handleMessage(context, 'Usage: `child adopt @user`');

  const target = context.mentions.users.first();

  if (!target) return await handleMessage(context, 'Please mention a valid user to adopt.');
  if (target.id === authorId) return await handleMessage(context, 'You cannot adopt yourself.');

  if (userData?.family?.adopted?.some(c => c.userId === target.id)) {
    return await handleMessage(context, `**${name}**, you have already adopted **${target.username}**.`);
  }

  const userData = await getUserData(authorId);
  const targetData = await getUserData(target.id);
  userData.family = userData.family || {};
  userData.family.adopted = userData.family.adopted || [];
  targetData.family = targetData.family || {};
  targetData.family.adopted = targetData.family.adopted || [];

  // Prevent mutual adoption
  const mutual = targetData.family.adopted.find(a => a.userId === authorId);
  if (mutual) await handleMessage(context, 'You cannot adopt someone who has already adopted you.');

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
      `## <:document:1390544433778393198> Child Adopt Request\n` +
      `**<@${authorId}>**, choose the gender you want to adopt **${target.username}** as:`
    )
  );

  const prompt = await handleMessage(context, {
    components: [Container, row],
    flags: MessageFlags.IsComponentsV2
  });

  const collector = prompt.createMessageComponentCollector({
    time: 60000
  });

  let chosen;

  collector.on('collect', async interaction => {
    if (interaction.customId.includes("adopt") && interaction.user.id === authorId) {
      if (!interaction.deferred) await interaction.deferUpdate();

      chosen = interaction.customId === 'adopt_boy' ? 'B': interaction.customId === 'adopt_girl' ? 'G': 'O';
      // Send button prompt
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Accept')
        .setEmoji('✔️')
        .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Reject')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Secondary)
      );

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(textDisplay =>
        textDisplay.setContent(
          `## <:document:1390544433778393198> Adoption Request\n` +
          `**<@${target.id}>**, do you accept the adoption request from **${name}** as a ${chosen === 'B' ? 'Boy': 'Girl'}?`
        )
      );

      return await interaction.editReply({
        components: [Container, row],
        flags: MessageFlags.IsComponentsV2
      });
    } else if (interaction.customId === "accept" && interaction.user.id === target.id) {
      if (!interaction.deferred) await interaction.deferUpdate();

      userData.family.adopted.push({
        userId: target.id,
        gender: chosen,
        date: Date.now(),
        avatar: null,
        xp: 0,
        adopted: true
      });

      await updateUser(authorId, {
        "family.adopted": userData.family.adopted
      });

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`## <:document:1390544433778393198> Adoption Successful`)
      )
      .addSectionComponents(
        section => section
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`**${name}** adopted **${target.username}** as a ${chosen === 'B' ? 'Boy': chosen === 'G' ? 'Girl': 'Other'}.`),
          textDisplay => textDisplay.setContent(`-# **${target.username}**, welcome to family!`)
        )
        .setThumbnailAccessory(
          thumbnail => thumbnail
          .setDescription('User PFP')
          .setURL(target.displayAvatarURL())
        )
      )

      return await interaction.editReply({
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });
    } else if (interaction.customId === "reject" && interaction.user.id === target.id) {
      if (!interaction.deferred) await interaction.deferUpdate();

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`## <:document:1390544433778393198> Adoption Failed`),
        textDisplay => textDisplay.setContent(`**${name}**'s adoption failed because **${target.username}** rejected the request to join your family.`),
      );

      return await interaction.editReply({
        components: [Container],
        flags: MessageFlags.IsComponentsV2
      });
    } else {
      if (!interaction.deferred) await interaction.deferReply({
        ephemeral: true
      });

      await interaction.editReply({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
            text => text.setContent('You are not allowed to interact with this button.')
          )
        ],
        flags: MessageFlags.IsComponentsV2
      });
    }
  });

  collector.on('end',
    collected => {
      try {
        prompt.edit({
          components: [new ContainerBuilder().addTextDisplayComponents(text => text.setContent('No selection made. Adoption canceled.'))],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (err) {}
    });
}

export default {
  name: 'adopt',
  aliases: [],
  description: 'Adopt an user',
  emoji: "👶🏻",
  category: '👤 User',
  cooldown: 10000,
  async execute(args,
    message) {
    try {
      args.shift();
      const sub = args[0].toLowerCase();
      return adoptChild(message,
        args);
    } catch (err) {
      console.error(err);
      return message.channel.send('❗ Something went wrong.');
    }
  }
};