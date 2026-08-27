import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType
} from "discord.js";
import { handleMessage } from "../../../../helper.js";
import emojiList from "./emojiList.js";

/**
 * Sends an interactive multi-page help guide for Zombie Apocalypse
 * with pagination buttons and category select dropdown.
 *
 * @param {object} ctx - The command context (message or interaction).
 */
export async function handleZombieHelp(ctx) {
  const pages = [];

  // ─── PAGE 1: Overview & Getting Started ──────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🧟 ZOMBIE APOCALYPSE · SURVIVAL GUIDE")
      .setDescription(
        `An apocalyptic plague has ravaged civilization! Scavenge resources, fend off infected hordes, reinforce your shelter, craft lethal weaponry, and survive the wasteland.\n\n` +
        `### ⚔️ **HOW TO SURVIVE**\n` +
        `• ${emojiList.zombie || '🧟'} **Scavenge & Slay:** Venture into the ruins with **\`kas zombie hunt\`** to eliminate zombies and gather crafting scrap.\n` +
        `• ${emojiList.shelter || '🏚️'} **Fortify Shelter:** Upgrade your shelter using ${emojiList.wood || '🪵'} **Wood** for improved safety and capacities.\n` +
        `• ${emojiList.tools || '🛠️'} **Upgrade Arsenal:** Use ${emojiList.metal || '🔩'} **Metal** to modify and level up your primary weapons.\n` +
        `• ${emojiList.medkit || '💊'} **Manage Health:** Monitor your survivor HP. Consume rations, medkits, or buy emergency medical care.\n\n` +
        `### ⌨️ **COMMAND SYNTAX**\n` +
        `\`\`\`\n` +
        `kas zombie [subcommand] [arguments]\n` +
        `kas z [subcommand] [arguments]\n` +
        `\`\`\``
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 1/5 · Overview & Getting Started"
      })
  );

  // ─── PAGE 2: Core Survival Commands ──────────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🎯 CORE SURVIVAL COMMANDS")
      .setDescription(
        `Master these fundamental commands to navigate and thrive in the apocalypse:\n\n` +
        `• **\`kas zombie\`** *(Alias: \`kas z\`)*\n` +
        `  View your survivor profile, current HP, kills, shelter tier, inventory resources, and active weapon.\n\n` +
        `• **\`kas zombie hunt\`** *(Alias: \`kas z h\`)*\n` +
        `  Embark on a real-time **2-minute** apocalyptic hunt. Choose tactical actions (\`fight\`, \`search\`, \`hide\`, \`craft\`, \`weapon\`) to defeat zombies and collect valuable loot.\n\n` +
        `• **\`kas zombie weapons\`** *(Alias: \`kas z weapon\`)*\n` +
        `  Open your armory to inspect owned weapons, levels, kill capacities, and upgrade costs.\n\n` +
        `• **\`kas zombie active <weaponName>\`**\n` +
        `  Equip a weapon as your primary weapon for hunting expeditions.\n` +
        `  *Example:* \`kas zombie active sword\`\n\n` +
        `• **\`kas zombie location\`** *(Alias: \`kas z l\`)*\n` +
        `  Inspect unlocked wastelands, kill requirements for new zones, and bonus supply multipliers.\n\n` +
        `• **\`kas zombie story <chapter>\`**\n` +
        `  Read apocalyptic journal entries and survivor lore (Chapters 1–15).\n` +
        `  *Example:* \`kas zombie story 1\``
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 2/5 · Core Survival Commands"
      })
  );

  // ─── PAGE 3: Crafting & Shelter Upgrades ──────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🛠️ CRAFTING & SHELTER UPGRADES")
      .setDescription(
        `Scrap resources are essential to surviving tougher infected waves:\n\n` +
        `### 📦 **SURVIVAL RESOURCES**\n` +
        `• ${emojiList.wood || '🪵'} **Wood:** Scavenged from forests and ruins; used to upgrade your survival shelter.\n` +
        `• ${emojiList.metal || '🔩'} **Metal:** Rare scrap recovered during expeditions; used to modify weapons.\n` +
        `• ${emojiList.supplies || '🎒'} **Supplies:** Essential apocalyptic materials gained from wasteland exploration.\n\n` +
        `### 🔨 **UPGRADE COMMANDS**\n` +
        `• **\`kas zombie modify <weaponName>\`**\n` +
        `  Spend ${emojiList.metal || '🔩'} **Metal** to upgrade a weapon's level, increasing its kill range and combat effectiveness.\n` +
        `  *Example:* \`kas zombie modify knife\`\n\n` +
        `• **\`kas zombie upgrade <amount>\`**\n` +
        `  Reinforce your survival shelter tier using ${emojiList.wood || '🪵'} **Wood**.\n` +
        `  *Example:* \`kas zombie upgrade 1\` or \`kas zombie upgrade 3\``
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 3/5 · Crafting & Shelter Upgrades"
      })
  );

  // ─── PAGE 4: Health Management & Field Medicine ──────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("❤️ HEALTH & MEDICAL CARE")
      .setDescription(
        `Zombies inflict damage when you fight without adequate preparation. Keep your survivor healthy:\n\n` +
        `### 💊 **HEALING OPTIONS**\n` +
        `• **\`kas zombie cure <amount>\`**\n` +
        `  Consume ${emojiList.medkit || '💊'} **Medkits** from your inventory.\n` +
        `  Each medkit instantly restores **+50 HP**.\n` +
        `  *Example:* \`kas zombie cure 2\`\n\n` +
        `• **\`kas zombie eat <amount>\`**\n` +
        `  Consume ${emojiList.carrot || '🥕'} **Food / Carrots** from your rations.\n` +
        `  Each food item restores **+10 HP**.\n` +
        `  *Example:* \`kas zombie eat 5\`\n\n` +
        `• **\`kas zombie heal\`**\n` +
        `  Receive emergency field medical treatment.\n` +
        `  Restores **+100 HP** for <:kasiko_coin:1300141236841086977> **3,000 Cash**.\n` +
        `  *Usage:* \`kas zombie heal\``
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 4/5 · Health & Medical Care"
      })
  );

  // ─── PAGE 5: Wastelands & Weapon Arsenal ──────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🗺️ WASTELAND ZONES & WEAPONS")
      .setDescription(
        `### 🏜️ **WASTELAND REGIONS**\n` +
        `• 🏙️ **Ashgrove Divide:** Starting zone (0 Kills) · Drops Molotovs ${emojiList.bottle || '🍾'}\n` +
        `• ⚡ **Velora Rift:** Unlocks at **100 Kills** (+10 Bonus Supplies) · Drops Bombs ${emojiList.bomb || '💣'}\n` +
        `• 🏥 **City Hospital:** Unlocks at **250 Kills** (+30 Bonus Supplies) · Drops Medkits ${emojiList.medkit || '💊'}\n` +
        `• 🌋 **Crimson Waste:** Unlocks at **500 Kills** (+50 Bonus Supplies) · High zombie density\n\n` +
        `### 🗡️ **WEAPON ARSENAL**\n` +
        `• 🥊 **Glove** *(Common · 1–2 Kills)*\n` +
        `• 🔪 **Knife** *(Uncommon · 1–3 Kills)*\n` +
        `• 🗡️ **Sword** *(Uncommon · 15–30 Kills)*\n` +
        `• 🛡️ **Shield** *(Rare · 8–15 Kills)*\n` +
        `• 🏒 **Stick** *(Epic · 18–35 Kills)*\n` +
        `• 💣 **Bomb** *(Epic · 20–40 Kills)*`
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 5/5 · Wastelands & Weapon Arsenal"
      })
  );

  let currentPage = 0;

  const getMenu = (selected) => {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("zombie_help_select")
        .setPlaceholder("📑 Select a Survival Help Category...")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Overview & Getting Started")
            .setDescription("Welcome guide, objective, and syntax")
            .setValue("0")
            .setEmoji("🧟")
            .setDefault(selected === 0),
          new StringSelectMenuOptionBuilder()
            .setLabel("Core Survival Commands")
            .setDescription("Hunt, weapons, active, and location")
            .setValue("1")
            .setEmoji("🎯")
            .setDefault(selected === 1),
          new StringSelectMenuOptionBuilder()
            .setLabel("Crafting & Shelter Upgrades")
            .setDescription("Weapon modification, wood, and metal")
            .setValue("2")
            .setEmoji("🛠️")
            .setDefault(selected === 2),
          new StringSelectMenuOptionBuilder()
            .setLabel("Health & Medical Care")
            .setDescription("Cure, eat, and cash healing")
            .setValue("3")
            .setEmoji("❤️")
            .setDefault(selected === 3),
          new StringSelectMenuOptionBuilder()
            .setLabel("Wastelands & Weapon Arsenal")
            .setDescription("Zones, kill milestones, and weapon stats")
            .setValue("4")
            .setEmoji("🗺️")
            .setDefault(selected === 4)
        )
    );
  };

  const getButtons = (page) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("zombie_help_prev")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("zombie_help_next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === pages.length - 1)
    );
  };

  const helpMessage = await handleMessage(ctx, {
    embeds: [pages[currentPage]],
    components: [getMenu(currentPage), getButtons(currentPage)]
  });

  const collector = helpMessage?.createMessageComponentCollector
    ? helpMessage.createMessageComponentCollector({
        time: 300000 // 5 minutes
      })
    : null;

  if (!collector) return;

  const targetUserId = ctx.author ? ctx.author.id : ctx.user?.id;

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== targetUserId) {
      return interaction.reply({
        content: "❌ These navigation controls are only for the command author.",
        ephemeral: true
      });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "zombie_help_select") {
      currentPage = parseInt(interaction.values[0], 10) || 0;
    } else if (interaction.isButton()) {
      if (interaction.customId === "zombie_help_prev") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (interaction.customId === "zombie_help_next") {
        currentPage = Math.min(pages.length - 1, currentPage + 1);
      }
    }

    await interaction.update({
      embeds: [pages[currentPage]],
      components: [getMenu(currentPage), getButtons(currentPage)]
    }).catch(() => {});
  });

  collector.on("end", async () => {
    const disabledButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("zombie_help_prev")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("zombie_help_next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

    const disabledMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("zombie_help_select")
        .setPlaceholder("📑 Guide Expired")
        .setDisabled(true)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Expired")
            .setValue("expired")
        )
    );

    try {
      if (helpMessage && typeof helpMessage.edit === 'function') {
        await helpMessage.edit({
          components: [disabledMenu, disabledButtons]
        }).catch(() => {});
      }
    } catch (_) {}
  });
}

export default handleZombieHelp;
