import mongoose from "mongoose";

const DungeonSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  rank: {
    type: String,
    enum: [
      "Bronze Explorer",
      "Silver Seeker",
      "Gold Raider",
      "Platinum Champion",
      "Diamond Conqueror",
      "Mythic Warlord",
      "Abyss Overlord",
    ],
    default: "Bronze Explorer",
    },
    bossDefeatedCount: {
      type: Number,
    default: 0,
    },
    inventory: {
      type: [{
        itemName: String, // Example: "Healing Potion", "Trap Breaker"
        quantity: {
          type: Number, default: 0
        },
      },
      ],
    default: [],
    },
    stats: {
      health: {
        type: Number, default: 100
      }, // Default starting health
      maxHealth: {
        type: Number, default: 100
      }, // Max possible health
      exp: {
        type: Number, default: 0
      },
      expToNextLevel: {
        type: Number, default: 100
      }, // Helps track level progression
      level: {
        type: Number, default: 1
      },
    },
    army: {
      type: [{
        unitType: String, // Example: "Knight", "Archer", "Mage"
        quantity: {
          type: Number, default: 0
        },
        status: {
          type: String, enum: ["Active", "Injured", "Lost"], default: "Active"
        },
      },
      ],
    default: [],
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Legendary", "Nightmare"],
    default: "Easy",
    },
    createdAt: {
      type: Date,
    default: Date.now,
    },
  });

  // Exporting the schema using ES Module syntax
  const Dungeon = mongoose.model("Dungeon", DungeonSchema);
  export default Dungeon;