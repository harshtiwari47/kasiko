import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';

import {
  discordUser,
  handleMessage
} from '../../../helper.js';

function buildDadJokeContainer(joke) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent('### DAD JOKE 🧓🏻')
    )
    .addSeparatorComponents()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent(joke)
    )
    .addSeparatorComponents(separate => separate)
    .addSectionComponents(
      section => section
        .addTextDisplayComponents(
          textDisplay => textDisplay.setContent('-# Want another one?')
        )
        .setButtonAccessory(
          button => button
            .setCustomId('dadjoke-again')
            .setLabel('Another one!')
            .setStyle(ButtonStyle.Primary)
        )
    );
}

export default {
  name: "dadjoke",
  description: "Get a random dad joke!",
  aliases: ["dad"],
  cooldown: 10000,
  category: "🧩 Fun",
  async execute(args, context) {
    const joke = await getDadJoke();

    if (!joke) {
      return await handleMessage(context, {
        content: '❌ Failed to fetch a dad joke.',
        ephemeral: true
      });
    }

    const responseMessage = await handleMessage(context, {
      components: [buildDadJokeContainer(joke)],
      flags: MessageFlags.IsComponentsV2
    });

    const collector = responseMessage.createMessageComponentCollector({
      time: 120 * 1000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.replied || interaction.deferred) return; // Do not reply again
      try {
        await interaction.deferUpdate();

        const joke = await getDadJoke();

        await interaction.editReply({
          components: [buildDadJokeContainer(joke)],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (err) {}
    });
  }
}

  // Reusable joke fetcher
  async function getDadJoke() {
    try {
      const response = await fetch('https://icanhazdadjoke.com/',
        {
          headers: {
            Accept: 'application/json'
          }
        });
      const data = await response.json();
      return data.joke;
    } catch (err) {
      console.error('❌ Error fetching dad joke:',
        err);
      return null;
    }
  }