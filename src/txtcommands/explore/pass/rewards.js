/*
@Reward type: pet | cash | creamcash | ship | car | structure | petfood
*/

const Rewards = {
  2: {
    id: "cash01",
    type: "cash",
    amount: 5000,
    name: "Cash",
    details: [{
      value: 5000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
    isPremium: false,
  },
  3: {
    id: "premium_cash01",
    type: "cash",
    name: "Cash",
    amount: 20000,
    details: [{
      value: 20000
    }],
    emoji: "<:kasiko_coin:1300141236841086977>",
    isPremium: true,
  },
  4: {
    id: "creamcash100",
    type: "creamcash",
    name: "Creamcash",
    amount: 150,
    details: [{
      value: 150
    }],
    emoji: "<:creamcash:1309495440030302282>",
    isPremium: false,
  },
  5: {
    id: "premium_creamcash100",
    type: "creamcash",
    name: "Creamcash",
    amount: 150,
    details: [{
      value: 150
    }],
    emoji: "<:creamcash:1309495440030302282>",
    isPremium: true,
  },
  6: {
    id: "food100",
    type: "petfood",
    name: "Pet Food",
    amount: 20,
    details: [{
      value: 20
    }],
    emoji: "🍖",
    isPremium: false,
  },
  7: {
    id: "premium_food100",
    type: "petfood",
    name: "Pet Food",
    amount: 20,
    details: [{
      value: 20
    }],
    emoji: "🍖",
    isPremium: true,
  },
  8: {
    id: "ship99",
    type: "ship",
    name: "Drago",
    amount: 1,
    special: true,
    details: [{
      level: 1,
      id: "ship8",
      name: "Drago",
      durability: 400,
      active: false
    }],
    emoji: "<:ship8:1316615694996996096>",
    isPremium: true
  }
};

export default Rewards;