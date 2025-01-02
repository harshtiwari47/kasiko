import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';


function capitalizeFirstLetter(word) {
  if (!word) return ""; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes between interaction and handleMessage
  if (isInteraction) {
    if (!context.deferred) await context.deferReply();
    return await context.editReply(data);
  } else {
    return context.send(data);
  }
}

function machineImage(level) {
  if (level > 3) level = 3;
  return `https://harshtiwari47.github.io/kasiko-public/images/ice-machine${level}.jpg`
}

export async function makeIceCream(playerShop, flavors, userId, username, context) {
  let selectedFlavor;
  let selectedAmount;
  let flavorDetails;

  const machineTitleEmbed = new EmbedBuilder()
  .setDescription(`🍧 𝑊𝑒𝑙𝑐𝑜𝑚𝑒 𝑡𝑜 𝑡ℎ𝑒 𝐼𝑐𝑒 𝐶𝑟𝑒𝑎𝑚 𝐹𝑙𝑎𝑣𝑜𝑟 𝑀𝑎𝑘𝑒𝑟!`)
  .setColor(`#e7d68d`);

  const optionEmbed = new EmbedBuilder()
  .setDescription(`ᴅɪꜱᴄᴏᴠᴇʀ ᴘᴜʀᴇ ᴊᴏʏ ɪɴ ᴇᴠᴇʀʏ ꜱᴄᴏᴏᴘ. ᴘɪᴄᴋ ʏᴏᴜʀ ꜰʟᴀᴠᴏʀ, ᴅᴇᴄɪᴅᴇ ʏᴏᴜʀ ᴘᴏʀᴛɪᴏɴ, ᴀɴᴅ ʟᴇᴛ ᴛʜᴇ ᴍᴀɢɪᴄ ᴜɴꜰᴏʟᴅ.\n<:creamcash:1309495440030302282> CASH **${playerShop.money}**`)
  .setColor(`#c7f1fe`)
  .setImage(machineImage(playerShop.shopLevel))

  const flavorSelectMenu = new StringSelectMenuBuilder()
  .setCustomId('flavor_select')
  .setPlaceholder('🍨 𝑪𝒉𝒐𝒐𝒔𝒆 𝒚𝒐𝒖𝒓 𝒇𝒍𝒂𝒗𝒐𝒓')
  .setMinValues(1)
  .setMaxValues(1)
  .addOptions(
    flavors.reduce((available, flavor) => {
      if (flavor.level <= playerShop.shopLevel && playerShop.money > flavor.cost) {
        available.push({
          label: `${flavor.name} ($${flavor.cost})`,
          value: flavor.name.toLowerCase()
        })
      }
      return available
    },
      [])
  );

  const selectRow = new ActionRowBuilder().addComponents(flavorSelectMenu);

  const selectMessage = await handleMessage(context, {
    embeds: [machineTitleEmbed, optionEmbed],
    components: [selectRow]
  });

  const collector = selectMessage.createMessageComponentCollector({
    filter: i => i.user.id === userId,
    time: 30000
  });

  collector.on('collect', async interaction => {
    try {
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: 'You are not allowed to interact!',
          ephemeral: true,
        });
      }
      if (!selectedFlavor) {
        selectedFlavor = interaction.values[0];
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate();
        }
        flavorDetails = flavors.find(flavor => flavor.name.toLowerCase() === selectedFlavor);

        if (!flavorDetails) collector.stop();

        let amountUserCanCreate = [1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10].reduce((newAmounts, num) => {
            if (num <= Math.floor(playerShop.money / flavorDetails.cost)) {
              newAmounts.push(num)
            }

            return newAmounts;
          },
          []);

        const flavorSelectMenu2 = new StringSelectMenuBuilder()
        .setCustomId('amount_select')
        .setPlaceholder('🛒 𝑪𝒉𝒐𝒐𝒔𝒆 𝒚𝒐𝒖𝒓 𝒂𝒎𝒐𝒖𝒏𝒕')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          amountUserCanCreate.map(amount => ({
            label: `${amount} ($${amount * flavorDetails.cost})`,
            value: `${amount}`
          }))
        );

        const selectRow2 = new ActionRowBuilder().addComponents(flavorSelectMenu2);

        await interaction.editReply(
          {
            embeds: [machineTitleEmbed,
              optionEmbed.setDescription(`✔️ You selected: **${flavorDetails.icecream}**`)],
            components: [selectRow2]
          });
        // Proceed to amount selection
      } else {
        selectedAmount = interaction.values[0];
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate();
        }

        await interaction.editReply(
          {
            embeds: [machineTitleEmbed, optionEmbed.setDescription(`✔️ You selected: **${flavorDetails.icecream}**\n🛒 Amount: ${selectedAmount}`)],
            components: []
          });

        // Proceed to amount selection
        collector.stop('completed');
      }
    } catch (err) {
      console.log(err)
    }
  });

  collector.on('end',
    async (collected, reason) => {
      if (!selectedFlavor) {
        await handleMessage(context, {
          content: "⚠️ You didn't select a flavor. Try again!"
        })
      }

      if (selectedFlavor && !selectedAmount) {
        await handleMessage(context, {
          content: "⚠️ You didn't select a amount. Try again!"
        })
      }

      try {
        selectMessage.edit({
          components: []
        })
      } catch (e) {
        console.error(e);
      }

      if (!selectedFlavor || !selectedAmount) return

      let iceIndex = playerShop.flavors.findIndex(flv => flv.name.toLowerCase() === selectedFlavor);

      if (iceIndex !== -1) {
        playerShop.flavors[iceIndex].items += Number(selectedAmount);
      } else {
        playerShop.flavors.push({
          name: flavorDetails.name,
          icecream: flavorDetails.icecream,
          items: Number(selectedAmount)
        });
      }

      playerShop.money -= flavorDetails.cost * Number(selectedAmount);
      await playerShop.save();

      const flavorEmbed = new EmbedBuilder()
      .setTitle("🍧 ᑎEᗯ ᖴᒪᗩᐯOᖇ ᑕᖇEᗩTEᗪ!")
      .setDescription(`**${username}**, you just created the flavor: **${flavorDetails.icecream}**!`)
      .addFields(
        {
          name: "💰 Cash Spent", value: `<:creamcash:1309495440030302282> ${flavorDetails.cost * Number(selectedAmount)} cash`
        }
      )
      .setColor(0xffa500)
      .setFooter({
        text: "Keep innovating with new flavors!"
      });

      return await handleMessage(context, {
        embeds: [flavorEmbed]
      })
    });
}