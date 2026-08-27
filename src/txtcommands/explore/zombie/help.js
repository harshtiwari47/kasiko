import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";

import emojiList from "./emojiList.js";
import { handleMessage } from "../../../helper.js";

/**
 * Renders an interactive, paginated, and category-selectable help guide for Zombie Apocalypse.
 * @param {object} ctx - Message or Slash interaction context
 */
export async function handleZombieHelp(ctx) {
  const pages = [];

  // ─── PAGE 1: Overview & Getting Started ──────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🧟 ZOMBIE APOCALYPSE: SURVIVAL MANUAL")
      .setDescription(
        `Welcome to the **Zombie Apocalypse**! You are a survivor fighting through infected ruins to gather scrap, upgrade weapons, conquer wastelands, and defeat terrifying territory bosses.\n\n` +
        `### 🧭 **QUICK START GUIDE**\n` +
        `1. **Equip a Weapon:** Check your arsenal with \`kas zombie weapons\` and choose one using \`kas zombie active <name>\`.\n` +
        `2. **Choose a Territory:** Browse wastelands using \`kas zombie location\` and travel using \`kas zombie travel <name>\`.\n` +
        `3. **Start Hunting:** Begin a 2-minute real-time battle with \`kas zombie hunt\`.\n` +
        `4. **Defeat the Boss:** Attack the territory's Final Boss with \`[ ⚔️ Strike Boss ]\` to reap huge bonus spoils!\n` +
        `5. **Upgrade & Fortify:** Level up weapons (\`kas zombie modify\`) and shelter (\`kas zombie upgrade\`).\n\n` +
        `> 💡 **Tip:** All commands support the **\`kas \`** prefix (or slash commands via **\`/explore zombie\`**).`
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
        `### ⚔️ **EXPEDITION & HUNTING**\n` +
        `• **\`kas zombie hunt\`** *(or \`kas z h\`)*\n` +
        `  Deploys your survivor into your active wasteland territory for a 2-minute survival battle.\n` +
        `  *In-battle actions:* **\`Search\`** (supplies), **\`Fight Horde\`** (kills), **\`Hide\`** (stamina), **\`Craft\`** (repairs), and **\`Strike Boss\`**.\n\n` +
        `• **\`kas zombie location\`** *(or \`kas z l\`)*\n` +
        `  Opens the interactive **Wasteland Territory Hub** to view regions, boss vitals, drops, and travel.\n\n` +
        `• **\`kas zombie travel <name>\`** *(or \`kas z travel <name>\`)*\n` +
        `  Instantly sets your expedition camp to an unlocked wasteland territory.\n` +
        `  *Example:* \`kas zombie travel velora rift\` or \`kas zombie travel l3\`\n\n` +
        `### 🗡️ **ARSENAL MANAGEMENT**\n` +
        `• **\`kas zombie weapons\`** *(or \`kas z w\`)*\n` +
        `  Displays all apocalyptic weapons you currently own with durability and kill power.\n\n` +
        `• **\`kas zombie active <weaponName>\`**\n` +
        `  Equips a weapon as your primary weapon for combat.\n` +
        `  *Example:* \`kas zombie active shotgun\``
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 2/5 · Core Survival Commands"
      })
  );

  // ─── PAGE 3: Wastelands & Territory Travel ───────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🗺️ WASTELAND TERRITORIES & TRAVEL")
      .setDescription(
        `Explore 10 unique apocalyptic zones. Each region offers higher bonus supplies, exclusive loot drops, and a distinct Final Boss:\n\n` +
        `• **Ashgrove Divide** *(0 Kills)*: Starting suburb · Boss: *Rotting Brute*\n` +
        `• **Velora Rift** *(100 Kills · +15 Supplies)*: Glowing radioactive fissure · Boss: *Plague Goliath*\n` +
        `• **City Hospital** *(250 Kills · +35 Supplies)*: Quarantine wards · Boss: *The Mad Surgeon*\n` +
        `• **Crimson Waste** *(500 Kills · +60 Supplies)*: Scorched chemical desert · Boss: *Toxic Abomination*\n` +
        `• **Dead Sky Airport** *(1,000 Kills · +90 Supplies)*: Devastated runway · Boss: *Dread Banshee*\n` +
        `• **Subway Necropolis** *(1,750 Kills · +130 Supplies)*: Subterranean tunnels · Boss: *Subway Stalker*\n` +
        `• **Fortress Ironhold** *(2,750 Kills · +180 Supplies)*: Armored citadel · Boss: *Cybernetic Juggernaut*\n` +
        `• **Sunken Bio-Dome** *(4,000 Kills · +240 Supplies)*: Overgrown jungle lab · Boss: *Spore Queen*\n` +
        `• **Obsidian Ridge** *(6,000 Kills · +320 Supplies)*: Volcanic crater · Boss: *Infernal Behemoth*\n` +
        `• **Sanctum of the Undead God** *(10,000 Kills · +500 Supplies)*: Master strain cathedral · Boss: *Apex Overlord*\n\n` +
        `> 🚀 **How to Travel:** Use \`kas zombie location\` buttons/dropdown or run \`kas zombie travel <name>\`.`
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 3/5 · Wastelands & Territory Travel"
      })
  );

  // ─── PAGE 4: Territory Final Bosses & Spoils ──────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("👑 TERRITORY FINAL BOSSES & COMBAT")
      .setDescription(
        `During your \`kas zombie hunt\` expeditions, the **Territory Final Boss** will descend into the wasteland after zombie waves are stirred up!\n\n` +
        `### ⚔️ **BOSS COMBAT MECHANICS**\n` +
        `• When the boss arrives, the **\`[ ⚔️ Strike Boss ]\`** action button activates.\n` +
        `• Striking the boss unleashes your active weapon's full force, dealing heavy damage.\n` +
        `• Bosses retaliate with unique deadly skills (e.g. *Acid Spray, Minigun Barrage, Soul Harvest*) dealing dangerous counter-damage.\n\n` +
        `### 🏆 **VICTORY SPOILS**\n` +
        `Defeating a Final Boss grants massive victory rewards upon finishing the hunt:\n` +
        `• **Bonus Zombie Kills:** **+8 to +100 Kills** towards your milestones!\n` +
        `• **Massive Cash:** Up to <:kasiko_coin:1300141236841086977> **180,000 Cash**!\n` +
        `• **Rare Resources:** Hundreds of ${emojiList.metal || '🔩'} **Metal**, ${emojiList.wood || '🪵'} **Wood**, and ${emojiList.medkit || '💊'} **Medkits**!\n` +
        `• **Boss Trophies:** Slayed bosses are permanently recorded in your profile.`
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 4/5 · Territory Final Bosses & Spoils"
      })
  );

  // ─── PAGE 5: Expanded Arsenal & Upgrades ──────────────────────────────────────────
  pages.push(
    new EmbedBuilder()
      .setTitle("🛠️ 22-WEAPON ARSENAL & UPGRADES")
      .setDescription(
        `### 🔨 **UPGRADE COMMANDS**\n` +
        `• **\`kas zombie modify <weaponName>\`**\n` +
        `  Spend ${emojiList.metal || '🔩'} **Metal** to upgrade weapon level and max kill power.\n` +
        `  *Example:* \`kas zombie modify shotgun\`\n\n` +
        `• **\`kas zombie upgrade <amount>\`**\n` +
        `  Spend ${emojiList.wood || '🪵'} **Wood** to level up your survival shelter and unlock higher weapon tiers.\n` +
        `  *Example:* \`kas zombie upgrade 1\`\n\n` +
        `### 🗡️ **WEAPON PROGRESSION TIERS**\n` +
        `• 🥊 **Common (Lv.1-2):** Glove, Bow\n` +
        `• 🔪 **Uncommon (Lv.3-6):** Knife, Pickaxe, Sword\n` +
        `• 🪚 **Rare (Lv.7-11):** Shield, Chainsaw, Crossbow, Axe, Shotgun\n` +
        `• 🎯 **Epic (Lv.13-17):** Sniper, Hammer, Bomb, Stick, Dynamite\n` +
        `• 🚀 **Legendary (Lv.18-22):** Crate, Flamethrower, Gun, Rocket, Cleaver\n` +
        `• ⚡ **Mythic & Exotic (Lv.23-25):** Tesla Cannon, Plasma Destroyer\n\n` +
        `### 💊 **FIELD MEDICINE**\n` +
        `• **\`kas zombie cure <amount>\`** — Consume Medkits (+50 HP each)\n` +
        `• **\`kas zombie eat <amount>\`** — Consume Food (+10 HP each)\n` +
        `• **\`kas zombie heal\`** — Field medical recovery for 3,000 Cash (+100 HP)`
      )
      .setColor("#2b1d1d")
      .setFooter({
        text: "Page 5/5 · 22-Weapon Arsenal & Upgrades"
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
            .setDescription("Hunt, weapons, active, and travel")
            .setValue("1")
            .setEmoji("🎯")
            .setDefault(selected === 1),
          new StringSelectMenuOptionBuilder()
            .setLabel("Wasteland Territories & Travel")
            .setDescription("10 regions, drop items, and camp travel")
            .setValue("2")
            .setEmoji("🗺️")
            .setDefault(selected === 2),
          new StringSelectMenuOptionBuilder()
            .setLabel("Territory Final Bosses & Spoils")
            .setDescription("Boss encounters, strikes, and victory payouts")
            .setValue("3")
            .setEmoji("👑")
            .setDefault(selected === 3),
          new StringSelectMenuOptionBuilder()
            .setLabel("22-Weapon Arsenal & Upgrades")
            .setDescription("Weapons, shelter levels, and field medicine")
            .setValue("4")
            .setEmoji("🛠️")
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
