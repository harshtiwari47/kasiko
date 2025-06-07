const DIFFICULTY_LEVELS = ['Easy', 'Normal', 'Hard', 'Epic', 'Legendary'];

export function getPredefinedBosses() {
  return [
    // 🟢 Easy Bosses (5)
    {
      name: "Scaleling",
      difficulty: "Easy",
      image: "https://example.com/scaleling.png",
      health: 320,
      maxHealth: 320,
      damage: 25,
      specialCooldown: 3,
      specialPowers: [{
        name: "Scratch",
        type: "damage",
        value: 40
      }],
      description: "A weak but nimble dragon."
    },
    {
      name: "Pebbletail",
      difficulty: "Easy",
      image: "https://example.com/pebbletail.png",
      health: 330,
      maxHealth: 330,
      damage: 26,
      specialCooldown: 3,
      specialPowers: [{
        name: "Rock Throw",
        type: "damage",
        value: 38
      }],
      description: "Small but stubborn."
    },
    {
      name: "Fluffscorch",
      difficulty: "Easy",
      image: "https://example.com/fluffscorch.png",
      health: 325,
      maxHealth: 325,
      damage: 23,
      specialCooldown: 3,
      specialPowers: [{
        name: "Tiny Ember",
        type: "damage",
        value: 35
      }],
      description: "Looks cute, burns hard."
    },
    {
      name: "Bubblewing",
      difficulty: "Easy",
      image: "https://example.com/bubblewing.png",
      health: 310,
      maxHealth: 310,
      damage: 22,
      specialCooldown: 3,
      specialPowers: [{
        name: "Steam Shot",
        type: "heal",
        value: 40
      }],
      description: "Floats with boiling bubbles."
    },
    {
      name: "Snorefang",
      difficulty: "Easy",
      image: "https://example.com/snorefang.png",
      health: 315,
      maxHealth: 315,
      damage: 24,
      specialCooldown: 3,
      specialPowers: [{
        name: "Drowsy Bite",
        type: "damage",
        value: 36
      }],
      description: "Lethargic, but deadly when awake."
    },

    // 🟡 Normal Bosses (5)
    {
      name: "Emberclaw",
      difficulty: "Normal",
      image: "https://example.com/emberclaw.png",
      health: 900,
      maxHealth: 900,
      damage: 90,
      specialCooldown: 3,
      specialPowers: [{
        name: "Flame Burst",
        type: "damage",
        value: 120
      }],
      description: "A balanced fire dragon."
    },
    {
      name: "Frostwing",
      difficulty: "Normal",
      image: "https://example.com/frostwing.png",
      health: 880,
      maxHealth: 880,
      damage: 88,
      specialCooldown: 3,
      specialPowers: [{
        name: "Ice Shard",
        type: "damage",
        value: 100
      }],
      description: "Chills with a glance."
    },
    {
      name: "Stormmaw",
      difficulty: "Normal",
      image: "https://example.com/stormmaw.png",
      health: 870,
      maxHealth: 870,
      damage: 89,
      specialCooldown: 3,
      specialPowers: [{
        name: "Lightning Snap",
        type: "damage",
        value: 115
      }],
      description: "Crackling with thunder energy."
    },
    {
      name: "Cinderhorn",
      difficulty: "Normal",
      image: "https://example.com/cinderhorn.png",
      health: 890,
      maxHealth: 890,
      damage: 87,
      specialCooldown: 3,
      specialPowers: [{
        name: "Heat Pulse",
        type: "damage",
        value: 105
      }],
      description: "Blasts hot pulses of pain."
    },
    {
      name: "Thornfang",
      difficulty: "Normal",
      image: "https://example.com/thornfang.png",
      health: 860,
      maxHealth: 860,
      damage: 85,
      specialCooldown: 3,
      specialPowers: [{
        name: "Vine Whip",
        type: "damage",
        value: 110
      }],
      description: "Nature’s green revenge."
    },

    // 🔺 Hard Bosses (5)
    {
      name: "Doomflame",
      difficulty: "Hard",
      image: "https://example.com/doomflame.png",
      health: 1600,
      maxHealth: 1600,
      damage: 140,
      specialCooldown: 3,
      specialPowers: [{
        name: "Inferno Wave",
        type: "damage",
        value: 200
      },
        {
          name: "Hellburst Heal",
          type: "heal",
          value: 100
        }],
      description: "Ruthless and blazing hot."
    },
    {
      name: "Abyssfang",
      difficulty: "Hard",
      image: "https://example.com/abyssfang.png",
      health: 1550,
      maxHealth: 1550,
      damage: 135,
      specialCooldown: 3,
      specialPowers: [{
        name: "Dark Tide",
        type: "damage",
        value: 180
      }],
      description: "Emerges from endless depth."
    },
    {
      name: "Skyrend",
      difficulty: "Hard",
      image: "https://example.com/skyrend.png",
      health: 1580,
      maxHealth: 1580,
      damage: 138,
      specialCooldown: 3,
      specialPowers: [{
        name: "Skyfall",
        type: "damage",
        value: 190
      }],
      description: "Shatters the skies."
    },
    {
      name: "Blightstorm",
      difficulty: "Hard",
      image: "https://example.com/blightstorm.png",
      health: 1570,
      maxHealth: 1570,
      damage: 137,
      specialCooldown: 3,
      specialPowers: [{
        name: "Plague Wind",
        type: "damage",
        value: 175
      }],
      description: "Toxic wind bringer."
    },
    {
      name: "Gravewing",
      difficulty: "Hard",
      image: "https://example.com/gravewing.png",
      health: 1620,
      maxHealth: 1620,
      damage: 145,
      specialCooldown: 3,
      specialPowers: [{
        name: "Soul Siphon",
        type: "heal",
        value: 120
      }],
      description: "Feeds on lost souls."
    },

    // 🟣 Epic Bosses (5) 
    {
      name: "Oblivionshade",
      difficulty: "Epic",
      image: "https://example.com/oblivionshade.png",
      health: 2500,
      maxHealth: 2500,
      damage: 230,
      specialCooldown: 3,
      specialPowers: [{
        name: "Shadowflame",
        type: "damage",
        value: 300
      }],
      description: "Shadow incarnate."
    },
    {
      name: "Eclipsefang",
      difficulty: "Epic",
      image: "https://example.com/eclipsefang.png",
      health: 2480,
      maxHealth: 2480,
      damage: 225,
      specialCooldown: 3,
      specialPowers: [{
        name: "Solar Eclipse",
        type: "heal",
        value: 250
      }],
      description: "Balanced darkness and light."
    },
    {
      name: "Bloodhowl",
      difficulty: "Epic",
      image: "https://example.com/bloodhowl.png",
      health: 2470,
      maxHealth: 2470,
      damage: 240,
      specialCooldown: 3,
      specialPowers: [{
        name: "Bloodrage",
        type: "damage",
        value: 320
      }],
      description: "Rages until blood spills."
    },
    {
      name: "Shatterfang",
      difficulty: "Epic",
      image: "https://example.com/shatterfang.png",
      health: 2460,
      maxHealth: 2460,
      damage: 228,
      specialCooldown: 3,
      specialPowers: [{
        name: "Crystal Crash",
        type: "damage",
        value: 290
      }],
      description: "Deadly crystalline roars."
    },
    {
      name: "Skydoom",
      difficulty: "Epic",
      image: "https://example.com/skydoom.png",
      health: 2490,
      maxHealth: 2490,
      damage: 235,
      specialCooldown: 3,
      specialPowers: [{
        name: "Heaven Break",
        type: "damage",
        value: 310
      }],
      description: "Breaks the firmament."
    },

    // 🔴 Legendary Bosses (5) 
    {
      name: "Vortexion",
      difficulty: "Legendary",
      image: "https://example.com/vortexion.png",
      health: 4600,
      maxHealth: 4600,
      damage: 400,
      specialCooldown: 3,
      specialPowers: [{
        name: "Temporal Rift",
        type: "damage",
        value: 550
      },
        {
          name: "Time Heal",
          type: "heal",
          value: 400
        }],
      description: "Rips time and space."
    },
    {
      name: "Drakorion",
      difficulty: "Legendary",
      image: "https://example.com/drakorion.png",
      health: 4550,
      maxHealth: 4550,
      damage: 390,
      specialCooldown: 3,
      specialPowers: [{
        name: "Dragon's Wrath",
        type: "damage",
        value: 520
      }],
      description: "True king of dragons."
    },
    {
      name: "Voidscale",
      difficulty: "Legendary",
      image: "https://example.com/voidscale.png",
      health: 4400,
      maxHealth: 4400,
      damage: 395,
      specialCooldown: 3,
      specialPowers: [{
        name: "Oblivion Crush",
        type: "damage",
        value: 530
      }],
      description: "Crushes with null power."
    },
    {
      name: "Eternalblaze",
      difficulty: "Legendary",
      image: "https://example.com/eternalblaze.png",
      health: 4700,
      maxHealth: 4700,
      damage: 405,
      specialCooldown: 3,
      specialPowers: [{
        name: "Infinity Burn",
        type: "damage",
        value: 540
      }],
      description: "Never-ending firestorm."
    },
    {
      name: "Astralcore",
      difficulty: "Legendary",
      image: "https://example.com/astralcore.png",
      health: 4800,
      maxHealth: 4800,
      damage: 410,
      specialCooldown: 3,
      specialPowers: [{
        name: "Star Collapse",
        type: "damage",
        value: 560
      }],
      description: "Born of collapsed stars."
    }];
}

export function selectBossTemplates() {
  const all = getPredefinedBosses();
  const selected = [];

  for (const difficulty of DIFFICULTY_LEVELS) {
    const filtered = all.filter(b => b.difficulty === difficulty);
    if (!filtered.length) continue;

    const boss = filtered[Math.floor(Math.random() * filtered.length)];
    selected.push(boss);
  }

  return selected;
}