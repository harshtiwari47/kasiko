export const Tasks = {
  "command": {
    "name": "😎 Command",
    "description": "Use the kas command 700 times.",
    "exp": 0,
    "required": 700,
    "reward": 250,
    "completed": false,
    "rarity": "epic"
  },
  "fun": {
    "name": "🧩 Fun Commands",
    "description": "Use any 🧩 Fun commands 300 times.",
    "exp": 0,
    "required": 300,
    "reward": 100,
    "completed": false,
    "rarity": "rare"
  },
  "catch": {
    "name": "🪝 Catch",
    "description": "Catch 30 🐟 fishes in the ocean.",
    "exp": 0,
    "required": 30,
    "reward": 75,
    "completed": false,
    "rarity": "common"
  },
  "feed": {
    "name": "😻 Feed Pet",
    "description": "Feed your pet 🐕 90 pieces of food 🍖.",
    "exp": 0,
    "required": 90,
    "reward": 150,
    "completed": false,
    "rarity": "common"
  },
  "serve": {
    "name": "🍨 Serve",
    "description": "Serve 80 🍧 ice creams to your customers.",
    "exp": 0,
    "required": 80,
    "reward": 110,
    "completed": false,
    "rarity": "rare"
  }
}

export const TASKEXP = Object.keys(Tasks).reduce((sum, keys) => {
  sum += Tasks[keys].reward
  return sum;
}, 0);