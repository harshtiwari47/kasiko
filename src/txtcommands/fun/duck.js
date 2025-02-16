import {
  EmbedBuilder
} from "discord.js";

export default {
  name: "duck",
  description: "Quacks up your day with a random duck fact and image!",
  aliases: ["quack",
    "duckfact"],
  cooldown: 10000,
  category: "🧩 Fun",

  execute: async (args, message) => {
    try {
      const duckFacts = [
        "Ducks have waterproof feathers!",
        "A group of ducks is called a raft, team, or paddling.",
        "Ducks have been domesticated for over 4000 years.",
        "Baby ducks are called ducklings. Cute, right?",
        "Ducks can sleep with one eye open to stay alert for predators.",
        "Male ducks are called drakes, while females are called hens.",
        "Ducks can live in freshwater and saltwater environments.",
        "Ducklings imprint on the first moving object they see after hatching.",
        "Ducks communicate using a variety of quacks, whistles, and grunts.",
        "The mallard is the most common wild duck species in the world.",
        "Ducks have excellent vision and can see in full color.",
        "A duck’s bill is designed to filter food from water.",
        "Some duck species migrate thousands of miles every year.",
        "The fastest duck, the red-breasted merganser, can reach speeds of 100 mph.",
        "Ducks have three eyelids and can see in nearly all directions.",
        "Not all ducks quack—some whistle, grunt, or make other sounds.",
        "Ducks can dive underwater to catch food like fish and insects.",
        "The whistling duck gets its name from its distinctive whistling call.",
        "Duck eggs take about 28 days to hatch, depending on the species.",
        "Ducks can lose and regrow their flight feathers in a process called molting.",
        "The feathers of some male ducks change color depending on the season.",
        "Ducks have been featured in folklore, myths, and cultural stories worldwide.",
        "Some ducks, like the wood duck, nest in tree holes rather than on the ground.",
        "Ducks can recognize human faces and learn to trust their caretakers.",
        "Some duck species practice brood parasitism, laying eggs in other ducks' nests.",
        "Ducks are omnivores and eat plants, insects, and small fish.",
        "Ducks are social animals and prefer to live in groups.",
        "Ducks use their webbed feet to paddle efficiently in water.",
        "Ducklings can swim almost immediately after hatching.",
        "The oldest recorded duck lived to be over 20 years old!"
      ];

      const randomFact = duckFacts[Math.floor(Math.random() * duckFacts.length)];
      const randomImage = `https://random-d.uk/api/${Math.floor(Math.random() * 100) + 1}.jpg`;

      const embed = new EmbedBuilder()
      .setTitle("🦆 Quack! Here's a Duck Fact!")
      .setDescription(`**Fact:** ${randomFact}`)
      .setImage(randomImage)
      .setColor("#FFD700");

      await message.reply({
        embeds: [embed]
      })
      return;
    } catch (e) {
      console.error(e);
    }
  },
};