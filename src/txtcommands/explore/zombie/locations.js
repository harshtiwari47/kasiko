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
      hp: 260,
      attack: 18,
      skills: ["Heavy Slam", "Flesh Shield"],
      reward: { kills: 8, cash: 5000, metal: 20, wood: 30, medkit: 1 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg"
    }
  },
  {
    name: "Velora Rift",
    id: "l2",
    killRequired: 100,
    bonousSupplies: 15,
    description: "A deep industrial quarry fracture where infected miners roam amidst cracked concrete and rusted excavators.",
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
      title: "Titan of the Quarry",
      emoji: "🧌",
      hp: 480,
      attack: 25,
      skills: ["Earthquake Stomp", "Rock Barrage"],
      reward: { kills: 14, cash: 9000, metal: 35, wood: 45, medkit: 1 },
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
      hp: 750,
      attack: 32,
      skills: ["Bone Saw Frenzy", "Toxic Syringe"],
      reward: { kills: 20, cash: 15000, metal: 55, wood: 60, medkit: 2 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb3.jpg"
    }
  },
  {
    name: "Crimson Waste",
    id: "l4",
    killRequired: 500,
    bonousSupplies: 60,
    description: "A red-tinted desert wasteland scorched by chemical spills and toxic industrial runoff.",
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
      title: "Mutated Chemical Lord",
      emoji: "☣️",
      hp: 1100,
      attack: 40,
      skills: ["Acid Spray", "Acidic Puddle"],
      reward: { kills: 28, cash: 24000, metal: 75, wood: 80, medkit: 2 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb4.jpg"
    }
  },
  {
    name: "Dead Sky Airport",
    id: "l5",
    killRequired: 1000,
    bonousSupplies: 90,
    description: "A devastated international airfield scattered with burning airplane carcasses and broken hangars.",
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
      name: "Terminal Stalker",
      title: "Phantom of the Runways",
      emoji: "🦅",
      hp: 1550,
      attack: 48,
      skills: ["Supersonic Shriek", "Divebomb Talon"],
      reward: { kills: 36, cash: 35000, metal: 105, wood: 105, medkit: 3 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb5.jpg"
    }
  },
  {
    name: "Subway Necropolis",
    id: "l6",
    killRequired: 1750,
    bonousSupplies: 130,
    description: "Flooded subterranean railway tunnels where predatory infected hunt in pitch black.",
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
      hp: 2100,
      attack: 58,
      skills: ["Cloak of Darkness", "Ambush Lunge"],
      reward: { kills: 45, cash: 48000, metal: 140, wood: 140, medkit: 3 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb6.jpg"
    }
  },
  {
    name: "Fortress Ironhold",
    id: "l7",
    killRequired: 2750,
    bonousSupplies: 180,
    description: "A fortified National Guard military checkpoint and armory overrun by armored infected riot soldiers.",
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
      name: "Riot Juggernaut",
      title: "Commander of Outpost 9",
      emoji: "🛡️",
      hp: 2800,
      attack: 70,
      skills: ["Ballistic Shield Bash", "Heavy Sledgehammer"],
      reward: { kills: 55, cash: 65000, metal: 180, wood: 175, medkit: 4 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb1.jpg"
    }
  },
  {
    name: "Sunken Bio-Dome",
    id: "l8",
    killRequired: 4000,
    bonousSupplies: 240,
    description: "An overgrown city botanical conservatory where aggressive parasitic vines and fungal spores have infected the dead.",
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
      name: "Spore Matriarch",
      title: "Mother of the Overgrowth",
      emoji: "🥀",
      hp: 3650,
      attack: 82,
      skills: ["Spore Cloud Suffocation", "Thorn Whip Swarm"],
      reward: { kills: 70, cash: 90000, metal: 230, wood: 230, medkit: 4 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb3.jpg"
    }
  },
  {
    name: "Blackwood Refinery",
    id: "l9",
    killRequired: 6000,
    bonousSupplies: 320,
    description: "A massive, smoldering industrial oil refinery with towering rusted smokestacks, burnt pipelines, and charred infected.",
    items: [{
      name: "Incendiary Charge",
      type: "damage",
      kills: 12,
      icon: emojiList.bomb || "💥",
      message: `You detonated an **Incendiary Charge**, triggering an oil reservoir explosion that eliminated **12** zombies!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/blackwoodrefinery.jpg",
    color: "#4a3c31",
    maxZombies: 95,
    boss: {
      name: "Blast Furnace Colossus",
      title: "Smoldering Industrial Titan",
      emoji: "🔥",
      hp: 4800,
      attack: 95,
      skills: ["Furnace Backdraft", "Scorched Slam"],
      reward: { kills: 85, cash: 125000, metal: 300, wood: 300, medkit: 5 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb4.jpg"
    }
  },
  {
    name: "Apex Containment Labs",
    id: "l10",
    killRequired: 10000,
    bonousSupplies: 500,
    description: "The subterranean epicenter of the outbreak. A high-security government quarantine research facility where the master pathogen originated.",
    items: [{
      name: "Prototype Bio-Charge",
      type: "damage",
      kills: 20,
      icon: emojiList.reward || "🧬",
      message: `You detonated a **Prototype Bio-Charge**, neutralizing an entire horde of **20** infected with targeted enzymes!`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/apexcontainment.jpg",
    color: "#8a1c1c",
    maxZombies: 120,
    boss: {
      name: "Patient Zero",
      title: "The Primary Outbreak Origin",
      emoji: "☣️",
      hp: 6500,
      attack: 115,
      skills: ["Berserk Rampage", "Outbreak Infection", "Devastating Ground Slam"],
      reward: { kills: 120, cash: 200000, metal: 450, wood: 450, medkit: 8 },
      image: "https://harshtiwari47.github.io/kasiko-public/images/zmb5.jpg"
    }
  }
];

export default locations;