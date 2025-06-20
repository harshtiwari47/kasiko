import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
  ContainerBuilder,
  MessageFlags
} from 'discord.js';
import {
  getUserData,
  updateUser
} from '../../../database.js';
import {
  Helper,
  discordUser,
  handleMessage
} from '../../../helper.js';

import {
  ITEM_DEFINITIONS
} from '../../inventory.js';

export default {
  name: 'loot',
  description: 'Use a ticket to embark on a risky mission: choose a vehicle (aeroplane, ship, train, bus).',
  aliases: [],
  cooldown: 10000,
  emoji: '<:secret_mask:1385216013615763598>',
  category: '🏦 Economy',
  async execute(args, context) {
    const user = context.user || context.author;

    const {
      id: userId,
      name
    } = discordUser(context);

    let userData;
    try {
      userData = await getUserData(userId);
    } catch (err) {
      return handleMessage(context, {
        content: '<:alert:1366050815089053808> An error occurred fetching your data. Please try again later.'
      });
    }
    if (!userData.inventory) {
      userData.inventory = {};
    }

    let tickets = userData.inventory.ticket ?? 1;
    if (tickets < 1) {
      return handleMessage(context, {
        components: [new ContainerBuilder().addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`<:ticket:1385194090982801480> **${name}**, you need at least **1 ticket** to start a mission. Get more tickets and try again!\n\` info ticket \``)
        )],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const customId = `select_vehicle_${userId}_${Date.now()}`;
    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Choose your target vehicle for the mission')
    .addOptions([{
      label: 'Aeroplane', description: 'Attempt a mid-air heist on an aeroplane', value: 'aeroplane'
    },
      {
        label: 'Ship', description: 'Sneak aboard a cargo or cruise ship', value: 'ship'
      },
      {
        label: 'Train', description: 'Hop onto a train for a risky robbery', value: 'train'
      },
      {
        label: 'Bus', description: 'Target a long-haul or luxury bus', value: 'bus'
      },
    ]);
    const row = new ActionRowBuilder().addComponents(selectMenu);

    const initialContainer = new ContainerBuilder()
    .addTextDisplayComponents(
      textDisplay => textDisplay.setContent('📠 **MISSION BRIEFING:** 𝘊𝘩𝘰𝘰𝘴𝘦 𝘺𝘰𝘶𝘳 𝘮𝘰𝘥𝘦 𝘰𝘧 𝘵𝘳𝘢𝘯𝘴𝘱𝘰𝘳𝘵 𝘵𝘰 𝘣𝘦𝘨𝘪𝘯 𝘵𝘩𝘦 𝘮𝘪𝘴𝘴𝘪𝘰𝘯.\nSelecting consumes 1 ticket. You have '
        + `<:ticket:1385194090982801480> ${tickets} ticket${tickets !== 1 ? 's': ''}.`),
      textDisplay => textDisplay.setContent(`-# ${name}`)
    )

    let promptMsg;
    try {
      promptMsg = await handleMessage(context, {
        components: [initialContainer, row],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (err) {
      console.error('Error sending select menu in loot command:', err);
      return handleMessage(context, {
        content: '<:alert:1366050815089053808> Failed to send selection menu. Please try again.'
      });
    }

    const collector = promptMsg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000, // 30 seconds to choose
      filter: (interaction) => {
        return interaction.user.id === userId && interaction.customId === customId;
      }
    });

    let handled = false;
    collector.on('collect', async (selectInteraction) => {
      handled = true;
      await selectInteraction.deferUpdate();

      const vehicle = selectInteraction.values[0]; // 'aeroplane' | 'ship' | 'train' | 'bus'

      const newTickets = (userData.inventory.ticket ?? 0) - 1;
      userData.inventory.ticket = newTickets;
      try {
        await updateUser(userId, {
          'inventory.ticket': userData.inventory.ticket
        });
      } catch (err) {
        console.error('Error updating user ticket in loot command:', err);
        return selectInteraction.followUp('<:alert:1366050815089053808> Failed to deduct a ticket. Please try again later.');
      }

      const userName = name;
      const scenarios = {
        aeroplane: [{
          intro: `<:aeroplane:1385131687020855367> **${userName} is attempting to rob a high-altitude cargo aeroplane mid-flight…**`,
          action: `You quietly slip a sedative into the crew’s coffee flask.`,
          result: `The crew dozes off; you access the cargo hold undetected. 🧳 Mission Successful!`,
          success: true,
        },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} boards an unmarked private jet under cover of darkness…**`,
            action: `You try to hotwire the cockpit door mechanism.`,
            result: `An alarm triggers and the plane diverts back to base. 🚔 Mission Failed.`,
            success: false,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} parachutes onto the wing of a military transport plane…**`,
            action: `You use an unconscious spray to subdue the lone guard inside.`,
            result: `The spray works perfectly, you move through cabins. 🧳 Mission Successful!`,
            success: true,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} sneaks in via the landing gear compartment…**`,
            action: `You accidentally kick a loose panel, making noise.`,
            result: `The pilot notices unusual readings and inspects—you're discovered! Mission Failed.`,
            success: false,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} boards under a fake identity as a flight attendant…**`,
            action: `You carry a concealed hacking device to override locks.`,
            result: `The device malfunctions; the pilot locks down the cargo. Mission Failed.`,
            success: false,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} infiltrates as a maintenance engineer…**`,
            action: `You distract the engineer by faking a hydraulic leak alarm.`,
            result: `While others investigate, you slip into the hold. Mission Successful!`,
            success: true,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} is lowered onto the plane by a drone at night…**`,
            action: `You use night-vision goggles to find the valuables.`,
            result: `Everything goes smoothly until sensors pick you up. Mission Failed.`,
            success: false,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} bribes a crew member to ignore your presence…**`,
            action: `You plant a fake bomb scare to clear the area.`,
            result: `Chaos ensues; you grab some cargo and parachute out. Mission Successful!`,
            success: true,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} hacks into the flight manifest to reroute cargo…**`,
            action: `You disguise as a security inspector to access the terminal.`,
            result: `Your hack is traced. Security boards mid-air. Mission Failed.`,
            success: false,
          },
          {
            intro: `<:aeroplane:1385131687020855367> **${userName} intends to swap crates mid-flight…**`,
            action: `You use a magnetic device to open sealed containers quietly.`,
            result: `You retrieve the target package but trigger a silent alarm—escape barely succeeds. Mission Successful!`,
            success: true,
          },
          // ...add more if desired
        ],
        ship: [{
          intro: `🚢 **${userName} sneaks aboard a massive cargo ship under a moonless sky…**`,
          action: `You swim beneath the hull to enter the lower decks unnoticed.`,
          result: `A loose barnacle scrapes your leg, but you slip in and find treasure. Mission Successful!`,
          success: true,
        },
          {
            intro: `🚢 **${userName} boards a luxury cruise ship during a masquerade party…**`,
            action: `You mingle with guests, looking for the vault key.`,
            result: `A suspicious security guard recognizes you from a wanted poster. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚢 **${userName} approaches an old pirate ghost ship rumored to hold cursed loot…**`,
            action: `You open a glowing chest despite ominous warnings.`,
            result: `A curse befalls you; you flee empty-handed. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚢 **${userName} infiltrates via a lifeboat during a storm…**`,
            action: `You climb aboard stealthily and head to the captain’s quarters.`,
            result: `You find a secret map leading to hidden vault. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚢 **${userName} disguises as a crew member to roam the decks…**`,
            action: `You slip a tracking device into the captain’s logbook.`,
            result: `Before you escape, crew does routine checks and spots the device. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚢 **${userName} boards via helicopter extraction onto the deck…**`,
            action: `You rappel down to the cargo hold with special cutting tools.`,
            result: `You cut through quietly and haul out valuables. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚢 **${userName} plans a nighttime raid with local smugglers…**`,
            action: `You coordinate via radio but get double-crossed.`,
            result: `Smugglers steal your share; you barely escape. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚢 **${userName} hides in a crate loaded onto the ship…**`,
            action: `Once inside, you pick the lock to the captain’s cabin.`,
            result: `You find the manifest and reroute valuable cargo. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚢 **${userName} uses a drone to scout for weak points…**`,
            action: `You pilot the drone to disable surveillance cameras.`,
            result: `Drone is detected and shot down; alarms ring. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚢 **${userName} boards disguised as a merchant trader…**`,
            action: `You offer rare goods to distract the crew captain.`,
            result: `The captain takes the bait; while distracted you access the vault. Mission Successful!`,
            success: true,
          },
          // ...add more if desired
        ],
        train: [{
          intro: `🚂 **${userName} hops onto the Midnight Express in a thunderstorm…**`,
          action: `You crawl across the roof to the secure wagon.`,
          result: `Lightning illuminates you; guards spot you and chase you off. Mission Failed.`,
          success: false,
        },
          {
            intro: `🚂 **${userName} boards disguised as a ticket inspector…**`,
            action: `You check passenger IDs to find high-value targets.`,
            result: `Passengers comply; you pick pockets and find valuables. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚂 **${userName} hides in a luggage car under crates…**`,
            action: `You pick the lock of a locked trunk containing confidential docs.`,
            result: `Docs give clues to a bigger heist; mission counts as success. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚂 **${userName} sneaks in through a broken side door…**`,
            action: `You accidentally wake a sleeping guard.`,
            result: `Guard raises alarm; you flee empty-handed. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚂 **${userName} tries to bribe the conductor…**`,
            action: `You offer gold coins for access to the secure car.`,
            result: `Conductor agrees; you enter and grab loot. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚂 **${userName} uses the storm noise to cover footsteps…**`,
            action: `You slip into a cabin with a mysterious locked box.`,
            result: `Box is empty except a note warning you to leave. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚂 **${userName} disguises as a musician in the dining car…**`,
            action: `During performance, you pick locks in the luggage racks.`,
            result: `You find rare jewels in a passenger’s bag. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚂 **${userName} boards via coupling between cars…**`,
            action: `You traverse the gap during a tunnel passage.`,
            result: `You slip and fall but manage to grab a small artifact. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚂 **${userName} tunnels under tracks to access cargo car…**`,
            action: `You emerge under the car and pick the lock quietly.`,
            result: `Lock is booby-trapped; smoke fills car. You escape but fail. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚂 **${userName} deceives the staff by forging orders…**`,
            action: `You present fake documents to access secure storage.`,
            result: `Documents pass inspection; you retrieve valuables. Mission Successful!`,
            success: true,
          },
          // ...add more if desired
        ],
        bus: [{
          intro: `🚌 **${userName} targets a luxury sleeper bus on a long-haul route…**`,
          action: `You board at a remote stop disguised as a passenger.`,
          result: `You find a locked safe under a seat and pick it open. Mission Successful!`,
          success: true,
        },
          {
            intro: `🚌 **${userName} sneaks in through the luggage compartment at night…**`,
            action: `You rummage for valuable packages.`,
            result: `A guard dog wakes and barks; you flee. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚌 **${userName} bribes the driver to make a secret stop…**`,
            action: `You slip off at the stop to access the bus later.`,
            result: `Driver double-crosses you and alerts authorities. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚌 **${userName} pretends to be a courier delivering a package…**`,
            action: `You hide inside the bus until it’s en route.`,
            result: `Inside, you locate a passenger’s hidden wallet and take some cash. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚌 **${userName} times the bus schedule to board when few passengers remain…**`,
            action: `You search unattended belongings for valuables.`,
            result: `You find an envelope with cash; no one notices. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚌 **${userName} uses a smoke bomb to cause panic…**`,
            action: `In the confusion, you search compartments.`,
            result: `The smoke flood triggers alarms; guards rush in. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚌 **${userName} hacks the ticket machine to print fake passes…**`,
            action: `You board with ease but get spotted by CCTV.`,
            result: `CCTV operator recognizes you and notifies driver. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚌 **${userName} hides undercover among luggage in the hold…**`,
            action: `You slip out when the bus stops at a remote station.`,
            result: `You snatch a briefcase left behind. Mission Successful!`,
            success: true,
          },
          {
            intro: `🚌 **${userName} befriends a passenger who claims insider knowledge…**`,
            action: `They lead you to a locked compartment under the seat.`,
            result: `It contains fake documents only. Mission Failed.`,
            success: false,
          },
          {
            intro: `🚌 **${userName} times a transfer between buses to slip items between vehicles…**`,
            action: `You plan to intercept a high-value package.`,
            result: `You retrieve the package successfully. Mission Successful!`,
            success: true,
          }],
      };

      const list = scenarios[vehicle];
      if (!Array.isArray(list) || list.length === 0) {
        return selectInteraction.followUp('<:alert:1366050815089053808> No scenarios found for that vehicle. Please contact an admin.');
      }


      const chosen = list[Math.floor(Math.random() * list.length)];
      const {
        intro,
        action,
        result,
        success: missionSuccess
      } = chosen;

      let item,
      amount = 1;
      if (missionSuccess) {
        const itemRewardNames = Object.keys(ITEM_DEFINITIONS).filter(i => ITEM_DEFINITIONS[i]?.source && ITEM_DEFINITIONS[i]?.source.includes("loot")) || [];
        const randomName = itemRewardNames.length ? itemRewardNames[Math.floor(Math.random() * itemRewardNames.length)]: null;

        item = randomName ? ITEM_DEFINITIONS[randomName]: null;
        amount = 1 + Math.floor(Math.random() * 3);

        await updateUser(userId, {
          [`inventory.${item.id}`]: (userData?.inventory?.[item.id] || 0) + amount
        });
      }

      const Container = new ContainerBuilder()
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`<:secret_mask:1385216013615763598> 𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗥𝗘𝗦𝗨𝗟𝗧: ${vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}`)
      )
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# ${intro}`)
      )
      .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`**<:follow_reply:1368224897003946004>** ${action}\n**<:reply:1368224908307468408>** ${result}`)
      )
      .addSeparatorComponents(separate => separate)

      if (item) {
        Container.addTextDisplayComponents(
          textDisplay => textDisplay.setContent(`**You looted** — ${item.emoji} **${item.name}** x${amount}`)
        )
      }

      Container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# <:ticket:1385194090982801480> Tickets remaining: ***${newTickets}***`)
      )

      try {
        await selectInteraction.followUp({
          components: [Container],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (err) {
        console.error('Error sending mission result embed in loot command:', err);
        await selectInteraction.followUp('<:alert:1366050815089053808> Failed to send mission result. Please try again.');
      }

      collector.stop();
    });

    collector.on('end',
      async (_, reason) => {
        if (!handled) {
          try {
            await handleMessage(context, {
              components: [new ContainerBuilder().addTextDisplayComponents(
                textDisplay => textDisplay.setContent('⌛ Time expired: you did not select a vehicle in time. Ticket was not used.'))],
              flags: MessageFlags.IsComponentsV2
            });
          } catch (err) {
            console.error('Error sending timeout message in loot command:', err);
          }
        }
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            selectMenu.setDisabled(true)
          );
          await promptMsg.edit({
            components: [new ContainerBuilder().addTextDisplayComponents(
              textDisplay => textDisplay.setContent(`The mission begins now, **${name}**. No turning back.`)), disabledRow]
          });
        } catch (err) {}
      });
  },
};