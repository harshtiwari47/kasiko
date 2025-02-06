import mongoose from "mongoose";

const abilitySchema = new mongoose.Schema( {
  name: {
    type: String, required: true
  },
  level: {
    type: Number, default: 1
    },
    resourcesCollection: {
      type: Number, default: 0
    },
    successRate: {
      type: Number, default: 0
    },
    energyCollection: {
      type: Number, default: 0
    },
    techIncrement: {
      type: Number, default: 0
    },
    upgradeRequirements: {
      type: [{
        itemName: {
          type: String, required: true
        },
        quantity: {
          type: Number, required: true
        }
      }],
    default: [{
        itemName: "Cosmic Reactor",
        quantity: 1
      }]
    }
  });

  const alienSchema = new mongoose.Schema({
    userId: {
      type: String, required: true, unique: true
    },
    name: {
      type: String, default: "Unknown Alien"
    },
    disguise: {
      type: String, default: "Businessman"
    }, // Human cover
    influence: {
      type: Number, default: 1
    }, // Power in human society
    resources: {
      type: Number, default: 100
    }, // Economic & human assets
    tech: {
      type: Number, default: 50
    }, // Technological prowess
    energy: {
      type: Number, default: 50
    }, // Cosmic energy reserves
    abilities: {
      type: [abilitySchema],
    default: [{
        name: "Mind Influence",
        level: 1,
        resourcesCollection: 3,
        manipulationRate: 0.2,
        energyCollection: 1,
        techIncrement: 5,
        upgradeRequirements: [{
          itemName: "Snacks", quantity: 2
        }]
      }]
    },
    manipulations: {
      type: Number, default: 0
    },
    inventory: {
      type: [{
        itemName: {
          type: String, required: true
        },
        quantity: {
          type: Number, required: true
        }
      }],
    default: []
    },
    battleStats: {
      health: {
        type: Number, default: 100
      },
      attack: {
        type: Number, default: 15
      },
      defense: {
        type: Number, default: 10
      },
      agility: {
        type: Number, default: 10
      },
      critChance: {
        type: Number, default: 0.1
      } // 10% chance for a critical hit
    },
    lastHarvest: {
      type: Date, default: null
    }
  });

  export default mongoose.model("Alien", alienSchema);