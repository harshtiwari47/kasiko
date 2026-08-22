import {
  getUserData,
  updateUser
} from "../../../database.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import {
  Helper,
  handleMessage,
  discordUser
} from "../../../helper.js";

export async function scavengerHunt(id, location, context) {
  try {
    const { name } = discordUser(context);
    const userId = id || discordUser(context).id;

    const userData = await getUserData(userId);
    if (!userData) {
      return await handleMessage(context, `<:warning:1366050875243757699> **${name}**, you need to register first to start a scavenger hunt!`);
    }

    const locations = {
      forest: { min: 100, max: 10000, trap: "poison ivy" },
      cave: { min: 300, max: 8000, trap: "bats" },
      beach: { min: 1000, max: 9000, trap: "quicksand" },
      ruins: { min: 500, max: 15000, trap: "falling rocks" },
      desert: { min: 700, max: 14000, trap: "sandstorm" }
    };

    if (!locations[location]) {
      return await handleMessage(context, `<:warning:1366050875243757699> Invalid location! Choose one of these: ${Object.keys(locations).join(", ")}.`);
    }

    const suspenseMessage = await handleMessage(context, {
      content: `🗺️ **${name}** sets off to explore the **${location}**... What mysteries lie ahead?`
    });

    // Simulate suspenseful events
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (suspenseMessage?.edit) {
      await suspenseMessage.edit({
        content: `🔦 You hear strange noises in the **${location}**... Something is nearby...`
      }).catch(() => {});
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    if (suspenseMessage?.edit) {
      await suspenseMessage.edit({
        content: `🔍 **${name}**, you're getting closer to something...`
      }).catch(() => {});
    }

    // Randomize outcome
    const isTreasure = Math.random() < 0.6; // 60% chance for treasure
    let reward = 0;
    let finalContent = "";

    if (isTreasure) {
      const min = locations[location].min;
      const max = locations[location].max;
      reward = Math.floor(Math.random() * (max - min + 1)) + min;

      // Rare treasure chance
      if (Math.random() < 0.1) {
        const rareBonus = Math.floor(reward * 2);
        reward += rareBonus;
        finalContent = `💎 𝗪𝗢𝗪! You found a rare treasure worth an extra <:kasiko_coin:1300141236841086977> **${rareBonus.toLocaleString()}**!\n`;
      }

      const freshUser = await getUserData(userId);
      const currentCash = Number(freshUser?.cash || 0);
      await updateUser(userId, {
        cash: currentCash + reward
      });

      finalContent += `<:celebration:1368113208023318558> 𝘾𝙤𝙣𝙜𝙧𝙖𝙩𝙪𝙡𝙖𝙩𝙞𝙤𝙣𝙨, **${name}**! 𝘠𝘰𝘶 𝘧𝘰𝘶𝘯𝘥 <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** 𝘪𝘯 𝘵𝘩𝘦 🗺️ **${location}**!`;
    } else {
      const trap = locations[location].trap;
      finalContent = `<:alert:1366050815089053808> Oh no, **${name}**! You stumbled upon ${trap} in the **${location}**.\n𝘠𝘰𝘶 𝘣𝘢𝘳𝘦𝘭𝘺 𝘦𝘴𝘤𝘢𝘱𝘦𝘥 𝘸𝘪𝘵𝘩 𝘺𝘰𝘶𝘳 𝘭𝘪𝘧𝘦! 𝘕𝘰 𝘳𝘦𝘸𝘢𝘳𝘥𝘴 𝘵𝘩𝘪𝘴 𝘵𝘪𝘮𝘦.`;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (suspenseMessage?.edit) {
      await suspenseMessage.edit({ content: finalContent }).catch(() => {});
    }

    // Add interactive Double or Nothing opportunity
    if (isTreasure && Math.random() < 0.35) {
      const doubleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('scav_double')
          .setLabel('Gamble (Double or Nothing)')
          .setEmoji('🎲')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('scav_keep')
          .setLabel('Keep Reward')
          .setStyle(ButtonStyle.Secondary)
      );

      const gambleMsg = await handleMessage(context, {
        content: `<:moneybag:1365976001179553792> **${name}**, you found a mysterious ancient chest! Would you like to risk your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** for a chance to double it?`,
        components: [doubleRow]
      });

      if (gambleMsg?.createMessageComponentCollector) {
        const collector = gambleMsg.createMessageComponentCollector({
          filter: i => i.user.id === userId,
          componentType: ComponentType.Button,
          time: 15000,
          max: 1
        });

        collector.on('collect', async i => {
          try {
            await i.deferUpdate().catch(() => {});
            if (i.customId === 'scav_double') {
              const won = Math.random() < 0.5;
              const freshUser = await getUserData(userId);
              const curCash = Number(freshUser?.cash || 0);

              if (won) {
                await updateUser(userId, { cash: curCash + reward });
                if (gambleMsg?.edit) {
                  await gambleMsg.edit({
                    content: `<:celebration:1368113208023318558> **Jackpot!** You doubled your treasure to <:kasiko_coin:1300141236841086977> **${(reward * 2).toLocaleString()}** cash!`,
                    components: []
                  }).catch(() => {});
                }
              } else {
                await updateUser(userId, { cash: Math.max(0, curCash - reward) });
                if (gambleMsg?.edit) {
                  await gambleMsg.edit({
                    content: `😢 Oh no! The chest was a mimic trap. You lost the <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}**!`,
                    components: []
                  }).catch(() => {});
                }
              }
            } else {
              if (gambleMsg?.edit) {
                await gambleMsg.edit({
                  content: `👍 **${name}**, you wisely secured your <:kasiko_coin:1300141236841086977> **${reward.toLocaleString()}** cash.`,
                  components: []
                }).catch(() => {});
              }
            }
          } catch (err) {
            console.error('Scavenger gamble error:', err);
          }
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            if (gambleMsg?.edit) {
              await gambleMsg.edit({ components: [] }).catch(() => {});
            }
          }
        });
      }
    }

  } catch (e) {
    console.error('Scavenger Hunt Error:', e);
    return await handleMessage(context, `ⓘ Oops! Something went wrong during your scavenger hunt.`);
  }
}

export default {
  name: "scavenger",
  description: "Go on a scavenger hunt to find treasures, rare items, or face traps!",
  aliases: ["treasure", "sc"],
  args: "<location>",
  example: ["scavenger forest", "scavenger cave", "treasure beach"],
  related: ["tosscoin", "mine"],
  emoji: "<:torch:1385131605235863672>",
  cooldown: 10000,
  category: "🎲 Games",

  execute: async (args, message) => {
    if (!args[1]) {
      return await handleMessage(message,
        "-# ❔ **Example:**\n" +
        "- **scavenger `<location>`**\n\n" +
        "🔍 **AVAILABLE LOCATIONS:**\n" +
        "◎ *forest, cave, beach, ruins, desert.*"
      );
    }

    const location = args[1].toLowerCase();
    return await scavengerHunt(message.author.id, location, message);
  }
};
