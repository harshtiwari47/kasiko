import emojiList from "./emojiList.js";

const locations = [{
  name: "Ashgrove Divide",
  id: "l1",
  killRequired: 0,
  bonousSupplies: 0,
  items: [{
    name: "Molotov cocktail",
    type: "damage",
    kills: 2,
    icon: emojiList.bottle,
    message: `You hurled a ${emojiList.bottle} **Molotov cocktail**, setting the area ablaze and killing **2** zombies.`
  }],
  url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/ashgrovedivide.jpg",
  color: "#f77a24",
  maxZombies: 15
},
  {
    name: "Velora Rift",
    id: "l2",
    killRequired: 100,
    bonousSupplies: 10,
    items: [{
      name: "Bomb",
      type: "damage",
      kills: 5,
      icon: emojiList.bomb,
      message: `You found a ${emojiList.bottle} **bomb** and threw it, killing **5** zombies.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/velorarift.jpg",
    color: "#193621",
    maxZombies: 20
  },
  {
    name: "City Hospital",
    id: "l3",
    killRequired: 250,
    bonousSupplies: 30,
    items: [{
      name: "Medkit",
      type: "heal",
      value: 50,
      icon: emojiList.medkit,
      message: `You found a ${emojiList.medkit} **Medkit** in the abandoned hospital and healed **50** health points.`
    }],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/cityhospital.jpg",
    color: "#a69c8a",
    maxZombies: 30
  },
  {
    name: "Crimson Waste",
    id: "l4",
    killRequired: 500,
    bonousSupplies: 50,
    items: [],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/crimsonwaste.jpg",
    color: "#9a4331",
    maxZombies: 40
  },
  {
    name: "Dead Sky Airport",
    id: "l5",
    killRequired: 1000,
    bonousSupplies: 100,
    items: [],
    url: "https://harshtiwari47.github.io/kasiko-public/images/zombie/deadskyairport.jpg",
    color: "#d2dde6",
    maxZombies: 50
  }]

export default locations;