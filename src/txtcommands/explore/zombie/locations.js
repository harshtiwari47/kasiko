import emojiList from "./emojiList.js";

const locations = [
  {
    name: "Ashgrove Divide",
    id: "l1",
    killRequired: 0,
    bonousSupplies: 0,
    description: "An abandoned suburban highway overrun by shambling infected walkers.",
    items: [{
      name: "Molotov cocktail",
      type: "damage",
      kills: 2,
      icon: emojiList.bottle || "🍾",
      message: `You hurled a ${emojiList.bottle || '🍾'} **Molotov cocktail**, setting the street ablaze and killing **2** zombies.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/ashgrovedivide.jpg",
    color: "#f77a24",
    maxZombies: 15,
    boss: {
      name: "Rotting Brute",
      title: "The Suburb Destroyer",
      emoji: "🧟‍♂️",
      hp: 75,
      attack: 14,
      skills: ["Heavy Slam", "Flesh Shield"],
      reward: { kills: 8, cash: 4000, metal: 15, wood: 25, medkit: 1 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg"
    }
  },
  {
    name: "Velora Rift",
    id: "l2",
    killRequired: 100,
    bonousSupplies: 15,
    description: "A deep geological fracture glowing with eerie radioactive energy.",
    items: [{
      name: "Bomb",
      type: "damage",
      kills: 5,
      icon: emojiList.bomb || "💣",
      message: `You detonated a ${emojiList.bomb || '💣'} **bomb**, wiping out **5** zombies in a fiery blast.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/velorarift.jpg",
    color: "#193621",
    maxZombies: 20,
    boss: {
      name: "Plague Goliath",
      title: "Titan of the Fissure",
      emoji: "🧌",
      hp: 140,
      attack: 20,
      skills: ["Earthquake Stomp", "Rock Barrage"],
      reward: { kills: 12, cash: 7500, metal: 30, wood: 40, medkit: 1 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb2.png"
    }
  },
  {
    name: "City Hospital",
    id: "l3",
    killRequired: 250,
    bonousSupplies: 35,
    description: "A blood-stained quarantine hospital full of mutated medical experiments.",
    items: [{
      name: "Medkit",
      type: "heal",
      value: 50,
      icon: emojiList.medkit || "💊",
      message: `You recovered an intact ${emojiList.medkit || '💊'} **Medkit** from the triage bay and healed **50** health points.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/cityhospital.jpg",
    color: "#a69c8a",
    maxZombies: 30,
    boss: {
      name: "The Mad Surgeon",
      title: "Butcher of Ward 9",
      emoji: "👨‍⚕️",
      hp: 210,
      attack: 26,
      skills: ["Bone Saw Frenzy", "Toxic Syringe"],
      reward: { kills: 18, cash: 12000, metal: 45, wood: 50, medkit: 2 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb3.jpg"
    }
  },
  {
    name: "Crimson Waste",
    id: "l4",
    killRequired: 500,
    bonousSupplies: 60,
    description: "A red-tinted desert wasteland scorched by chemical weapons and acid rain.",
    items: [{
      name: "Toxic Grenade",
      type: "damage",
      kills: 6,
      icon: emojiList.bomb || "🧪",
      message: `You launched a ${emojiList.bomb || '🧪'} **Toxic Grenade**, melting **6** armored zombies.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/crimsonwaste.jpg",
    color: "#9a4331",
    maxZombies: 40,
    boss: {
      name: "Toxic Abomination",
      title: "Mutated Acid Lord",
      emoji: "☣️",
      hp: 290,
      attack: 34,
      skills: ["Acid Spray", "Acidic Puddle"],
      reward: { kills: 24, cash: 18000, metal: 65, wood: 70, medkit: 2 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb4.jpg"
    }
  },
  {
    name: "Dead Sky Airport",
    id: "l5",
    killRequired: 1000,
    bonousSupplies: 90,
    description: "A devastated international airfield scattered with burning airplane carcasses.",
    items: [{
      name: "Flare Strike",
      type: "damage",
      kills: 8,
      icon: emojiList.bottle || "💥",
      message: `You fired an emergency **Flare Strike**, incinerating **8** fast crawlers.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/deadskyairport.jpg",
    color: "#d2dde6",
    maxZombies: 50,
    boss: {
      name: "Dread Banshee",
      title: "Screaming Phantom of the Skies",
      emoji: "🦅",
      hp: 380,
      attack: 42,
      skills: ["Supersonic Shriek", "Divebomb Talon"],
      reward: { kills: 30, cash: 25000, metal: 90, wood: 90, medkit: 3 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb5.jpg"
    }
  },
  {
    name: "Subway Necropolis",
    id: "l6",
    killRequired: 1750,
    bonousSupplies: 130,
    description: "Flooded subterranean railway tunnels where apex stalkers hunt in pitch black.",
    items: [{
      name: "Adrenaline Shot",
      type: "heal",
      value: 75,
      icon: emojiList.syringe || "💉",
      message: `You injected an ${emojiList.syringe || '💉'} **Adrenaline Shot**, boosting your stamina and healing **75 HP**!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/subwaynecropolis.jpg",
    color: "#3a2c52",
    maxZombies: 60,
    boss: {
      name: "Subway Stalker",
      title: "Shadow of the Deep Rails",
      emoji: "🕷️",
      hp: 490,
      attack: 52,
      skills: ["Cloak of Darkness", "Ambush Lunge"],
      reward: { kills: 38, cash: 35000, metal: 120, wood: 120, medkit: 3 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb6.jpg"
    }
  },
  {
    name: "Fortress Ironhold",
    id: "l7",
    killRequired: 2750,
    bonousSupplies: 180,
    description: "A heavily fortified military citadel overrun by reanimated cybernetic super-soldiers.",
    items: [{
      name: "Combat Armor Plate",
      type: "heal",
      value: 100,
      icon: emojiList.shield || "🛡️",
      message: `You equipped a pristine ${emojiList.shield || '🛡️'} **Combat Armor Plate**, restoring **100 HP**!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/fortressironhold.jpg",
    color: "#4f5b66",
    maxZombies: 70,
    boss: {
      name: "Cybernetic Juggernaut",
      title: "The Ironclad War Engine",
      emoji: "🤖",
      hp: 620,
      attack: 64,
      skills: ["Minigun Barrage", "Titanium Shield Bash"],
      reward: { kills: 45, cash: 50000, metal: 160, wood: 150, medkit: 4 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg"
    }
  },
  {
    name: "Sunken Bio-Dome",
    id: "l8",
    killRequired: 4000,
    bonousSupplies: 240,
    description: "An overgrown tropical conservatory infested with flesh-eating plant-zombie hybrids.",
    items: [{
      name: "Bio-Serum",
      type: "heal",
      value: 120,
      icon: emojiList.syringe || "🧪",
      message: `You extracted a potent **Bio-Serum**, neutralizing toxins and restoring **120 HP**.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/sunkenbiodome.jpg",
    color: "#285943",
    maxZombies: 80,
    boss: {
      name: "Spore Queen",
      title: "Matriarch of the Carnivorous Flora",
      emoji: "🥀",
      hp: 780,
      attack: 76,
      skills: ["Spore Cloud Suffocation", "Thorn Whip Swarm"],
      reward: { kills: 55, cash: 70000, metal: 200, wood: 200, medkit: 4 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb3.jpg"
    }
  },
  {
    name: "Obsidian Ridge",
    id: "l9",
    killRequired: 6000,
    bonousSupplies: 320,
    description: "A volcanic inferno of smoldering craters where flaming char-walkers emerge from lava.",
    items: [{
      name: "Magma Core",
      type: "damage",
      kills: 12,
      icon: emojiList.bomb || "🌋",
      message: `You triggered a volatile **Magma Core**, causing a lava geyser that eliminated **12** zombies!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/obsidianridge.jpg",
    color: "#802b1f",
    maxZombies: 95,
    boss: {
      name: "Infernal Behemoth",
      title: "Living Molten Disaster",
      emoji: "🔥",
      hp: 960,
      attack: 90,
      skills: ["Magma Eruption", "Volcanic Ash Storm"],
      reward: { kills: 70, cash: 100000, metal: 260, wood: 260, medkit: 5 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb4.jpg"
    }
  },
  {
    name: "Sanctum of the Undead God",
    id: "l10",
    killRequired: 10000,
    bonousSupplies: 500,
    description: "The epicenter of the apocalypse. A floating monolithic cathedral holding the master strain.",
    items: [{
      name: "Godslayer Shard",
      type: "damage",
      kills: 20,
      icon: emojiList.reward || "✨",
      message: `You unleashed the raw power of the **Godslayer Shard**, wiping out an entire horde of **20** undead!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/sanctumundeadgod.jpg",
    color: "#ffd700",
    maxZombies: 120,
    boss: {
      name: "Apex Overlord",
      title: "The Progenitor of the Plague",
      emoji: "👑",
      hp: 1300,
      attack: 110,
      skills: ["Void Cataclysm", "Soul Harvest", "Undead Summoning"],
      reward: { kills: 100, cash: 180000, metal: 400, wood: 400, medkit: 8 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb5.jpg"
    }
  }
];

export default locations;