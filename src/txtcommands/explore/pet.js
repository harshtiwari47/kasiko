import {
  EmbedBuilder
} from "discord.js";
import UserPet from "../../../models/Pet.js";
import petImages from "./helpers/petImages.json" with {
  type: "json"
}; // Pet images JSON

import {
  Helper
} from '../../../helper.js';

import {
  incrementTaskExp
} from './pass.js';

// Function to get pet image based on type and level
function getPetImage(petType, petLevel) {

  if (petLevel > 10) petLevel = 10;

  if (petImages[petType] && petImages[petType][petLevel]) {
    return petImages[petType][petLevel];
  }
  return null; // Return null if no image found
}

const catTalks = [
  "I demand a snack every time I blink at you. It's a scientific fact.",
  "Why is the laser pointer always my greatest nemesis and most beloved toy at the same time?",
  "I don't need your attention, but I'll follow you everywhere just to make sure you know that.",
  "I just knocked something off the table, and it wasn’t an accident. You're welcome.",
  "Excuse me, but if you could stop working for a moment to pet me, I’d really appreciate it.",
  "I’m not being needy, I just think the space between you and your laptop should be occupied by my fluffy belly.",
  "You’re lucky I decided to nap on your lap today. It’s a special honor.",
  "The floor is lava, and I must find the highest spot in the house immediately.",
  "Did you know that when you leave, the world stops spinning? Please don’t leave.",
  "Oh, you thought you were going to the bathroom alone? Cute."
];

// Command handler for pet actions
export default {
  name: "pet",
  description: "Manage your pets! Feed them, exercise, walk, pat, rename, and more.",
  aliases: ["pets",
    "feed",
    "walk",
    "excercise",
    "mypet"],
  args: "<action> [parameters]",
  example: [
    "feed or pet feed",
    "pet rename Fluffy Spot",
    "pet switch Spot",
    "excercise or pet exercise",
    "walk or pet walk",
    "pat or pet pat",
    "pet list",
    "pet food",
    "pet view Fluffy",
    "pet talk"
  ],
  category: "🍬 Explore",
  cooldown: 10000,

  // Main function for executing pet commands
  execute: async (args, interaction) => {
    const userId = interaction.author.id; // Get the user's ID
    // Fetch the user data from the database
    let userPetData = await UserPet.findOne({
      id: userId
    });

    if (!userPetData) {
      userPetData = await new UserPet( {
        id: userId,
      })
    }

    // Command for viewing help
    if (args[1] === "help") {
      const embed = new EmbedBuilder()
      .setColor("#ff004b")
      .setTitle("Pet Commands Help")
      .addFields(
        {
          name: "**feed**",
          value: "Feed your active pet. Feeding requires food, which can be earned via fishing or daily rewards.",
        },
        {
          name: "**pet rename <pet_name> <new_name>**",
          value: "Rename your pet. For example, `pet rename Fluffy Spot` renames 'Fluffy' to 'Spot' (max: 14 characters).",
        },
        {
          name: "**pet switch <pet_name>**",
          value: "Switch your active pet to another pet by name.",
        },
        {
          name: "**exercise**",
          value: "Exercise a specific pet to gain experience points. Pets level up when they reach the required experience threshold.",
        },
        {
          name: "**walk**",
          value: "Take your pet for a walk. This boosts experience points and energizes your pet.",
        },
        {
          name: "**pat**",
          value: "Show affection to your pet by patting or loving them. Your pet gains experience and becomes happier.",
        },
        {
          name: "**pet food**",
          value: "Check how much food you have available to feed your pets.",
        },
        {
          name: "**pet talk**",
          value: "Listen what your pet saying!",
        },
        {
          name: "**pet list**",
          value: "View a list of all your pets, including their names, levels, and types.",
        },
        {
          name: "**pet view**",
          value: "View detailed information and an image of a current pet.",
        },
        {
          name: "**pet help**",
          value: "Display this help menu with all available commands.",
        }
      )
      .setFooter({
        text: "Use the respective command with the correct arguments to interact with your pets. For example: `pet feed Fluffy` or `pet rename Fluffy Spot`.",
      });

      return interaction.channel.send({
        embeds: [embed],
      });
    }

    const petId = parseInt(userPetData.active || 0); // Pet index (ID) based on arguments


    let threshold = 200;
    let lvlUpReward = 10; // foods
    let lvl = Math.floor(Math.sqrt(userPetData.pets[petId].exp / threshold)) || 0;
    let lvlUp = false;

    if (!(lvl === userPetData.pets[petId].level)) {
      userPetData.pets[petId].level = lvl;
      lvlUpReward = 10 + userPetData.pets[petId].level;
      userPetData.food += lvlUpReward;
      lvlUp = true;
      await userPetData.save()
    }

    if (lvlUp) {
      interaction.channel.send(`**<@${interaction.author.id}>**, your pet **${userPetData.pets[petId].name}** has reached level **${userPetData.pets[petId].level}**! 🎉 You received 🍖 **${lvlUpReward}** foods.`);
    }

    // Feed command
    if (args[1] === "feed" || args[0] === "feed") {

      if (userPetData.pets[petId].lastFeed && Helper.checkTimeGap(userPetData.pets[petId].lastFeed, Date.now()) < 3) {
        const remainingTime = 3 - Helper.checkTimeGap(userPetData.pets[petId].lastFeed, Date.now(), {
          format: 'hours'
        }).toFixed(1);
        return interaction.channel.send(`<@${userId}>, you cannot feed again for another ${remainingTime.toFixed(1)} hours.`);
      }

      if (userPetData.food > 0) {
        const pet = userPetData.pets[petId];
        pet.feed++;
        pet.exp += 20;
        userPetData.food--; // Reduce the available food
        pet.lastFeed = Date.now();

        await userPetData.save();
        const petImageUrls = getPetImage(pet.type, pet.level);

        const embed = new EmbedBuilder()
        .setColor('#ff69b4') // A cute pink color
        .setDescription(`**Yummy, yay!** 😻🎉\n**${interaction.author.username}**, **${pet.name}** has been fed and is purring with joy! 🐾💖\n\nYou can feed ${pet.name} again after 3 hour! 🍽️`)
        .setThumbnail(petImageUrls ? petImageUrls[0]: null);

        await incrementTaskExp(interaction.author.id, "feed", interaction);

        return interaction.channel.send({
          embeds: [embed]
        });

      } else {
        return interaction.channel.send("⚠️ You don't have enough food to feed your pet! Get some food while fishing or collect daily food from daily rewards.");
      }
    }

    // Rename command
    if (args[1] === "rename") {
      if (args[2] && args[2].toLowerCase() && args[3] && args[3].toLowerCase()) {
        const pet = userPetData.pets.find(pets => pets.name && pets.name.toLowerCase() === args[2].toLowerCase());
        if (pet) {
          pet.name = args[3].substring(0, 14); // Rename the pet
          await userPetData.save();
          return interaction.channel.send(`✏️🐹 **${interaction.author.username}**, **${args[2]}** has been renamed to **${args[3]}**!`);
        } else {
          return interaction.channel.send("⚠️ No pet found with this name. `kas pet rename <name> <new name (max: 14)>`");
        }
      } else {
        return interaction.channel.send("⚠️ Please provide a new name for your pet. `kas pet rename <name> <new name (max: 14)>`");
      }
    }

    if (args[1] === "talk") {
      const pet = userPetData.pets[petId];

      if (pet.type === "cat") {
        let talk = catTalks[Math.floor(Math.random() * catTalks.length)];
        const petImageUrls = getPetImage(pet.type, pet.level);

        const embed = new EmbedBuilder()
        .setColor('#f5b7c1') // A cute pink color
        .setDescription(`🗣️ ${talk}`)
        .setThumbnail(petImageUrls ? petImageUrls[0]: null);

        return interaction.reply({
          embeds: [embed]
        });
      } else {
        // other pet talk
      }
    }

    // Switch command
    if (args[1] === "switch") {
      if (args[2]) {
        let index = userPetData.pets.indexOf(pets => pets.name && pets.name.toLowerCase() === args[2].toLowerCase());
        if (index) {
          userPetData.active = index;
          const pet = userPetData.pets[userPetData.active];
          return interaction.channel.send(`✅ **${interaction.author.username}**, **${pet.name}** is now your active pet!`);
        } else {
          return interaction.channel.send(`⚠️ Please provide the correct pet name!`);
        }
      } else {
        return interaction.channel.send(`⚠️ Please provide the pet name!\n\`kas pet active <name>\``);
      }
    }

    // Exercise command
    if (args[0] === "excercise" || args[1] === "exercise") {

      if (userPetData.pets[petId].lastExercise && Helper.checkTimeGap(userPetData.pets[petId].lastExercise, Date.now()) < 6) {
        const remainingTime = 6 - Helper.checkTimeGap(userPetData.pets[petId].lastExercise, Date.now(), {
          format: 'hours'
        }).toFixed(1);
        return interaction.channel.send(`<@${userId}>, you cannot make pet excercise again for another ${remainingTime.toFixed(1)} hours.`);
      }

      const pet = userPetData.pets[petId];
      pet.lastExercise = Date.now();
      pet.exp += 10; // Adding experience points after exercise
      await userPetData.save();
      const petImageUrls = getPetImage(pet.type, pet.level);

      const embed = new EmbedBuilder()
      .setColor('#00BFFF') // A refreshing blue color
      .setDescription(`🐱🏋🏻 **Yippee!**\n**${interaction.author.username}**, **${pet.name}** just had a great workout and gained some energy!\nKeep it up! 🔥🐾`)
      .setThumbnail(petImageUrls ? petImageUrls[0]: null);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // Pat command
    if (args[0] === "pat" || args[1] === "pat" || args[1] === "love") {

      if (userPetData.pets[petId].lastPatTime && Helper.checkTimeGap(userPetData.pets[petId].lastPatTime, Date.now()) < 3) {
        const remainingTime = 3 - Helper.checkTimeGap(userPetData.pets[petId].lastPatTime, Date.now(), {
          format: 'hours'
        }).toFixed(1);
        return interaction.channel.send(`<@${userId}>, you cannot pat again for another ${remainingTime.toFixed(1)} hours.`);
      }

      const pet = userPetData.pets[petId];
      pet.lastPatTime = Date.now();
      pet.exp += 10; // Adding experience points after pat
      await userPetData.save();
      const petImageUrls = getPetImage(pet.type, pet.level);

      const embed = new EmbedBuilder()
      .setColor('#e22651')
      .setDescription(`**${interaction.author.username}**, 🐾 **${pet.name}** wiggled with joy after your gentle pats! 💕 You're making their day pawsitively amazing! 😄`)
      .setThumbnail(petImageUrls ? petImageUrls[0]: null);

      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // Walk command
    if (args[0] === "walk" || args[0] === "walk") {

      if (userPetData.pets[petId].lastWalkTime && Helper.checkTimeGap(userPetData.pets[petId].lastWalkTime, Date.now()) < 6) {
        const remainingTime = 6 - Helper.checkTimeGap(userPetData.pets[petId].lastExercise, Date.now(), {
          format: 'hours'
        }).toFixed(1);
        return interaction.channel.send(`<@${userId}>, you cannot take pet for walk again for another ${remainingTime.toFixed(1)} hours.`);
      }

      const pet = userPetData.pets[petId];
      pet.lastWalkTime = Date.now();
      pet.exp += 10; // Adding experience points after waking
      await userPetData.save();
      const petImageUrls = getPetImage(pet.type, pet.level);

      const embed = new EmbedBuilder()
      .setColor('#26e275')
      .setDescription(`**Woohoo! 🍃**\n**${interaction.author.username}**, **${pet.name}** enjoyed a refreshing walk and is feeling super energized! 🌟🐾\nWhat a pawsome adventure! 🌀`)
      .setThumbnail(petImageUrls ? petImageUrls[0]: null);
      return interaction.channel.send({
        embeds: [embed]
      });
    }

    // Check food command
    if (args[1] === "food") {
      return interaction.channel.send(`🍖 **${interaction.author.username}**, You have **${userPetData.food}** pet food available.`);
    }

    // List command
    if (args[1] === "list") {
      const petListEmbed = new EmbedBuilder()
      .setTitle(`${interaction.author.username}'s 𝐏𝐞𝐭𝐬`)
      .setColor("#c3126a")
      .setDescription(userPetData.pets.map((pet, index) => {
        return `${index}. ${pet.name} - 𝑳𝒆𝒗𝒆𝒍  ${pet.level} (${pet.type})`;
      }).join("\n"));

      return interaction.channel.send({
        embeds: [petListEmbed]
      });
    }

    // View command
    if (args.length === 1 || args[1] === "view") {
      const pet = userPetData.pets[petId];
      const petImageUrls = getPetImage(pet.type, pet.level);

      const petEmbed = new EmbedBuilder()
      .setTitle(`${pet.name} (𝑳𝒆𝒗𝒆𝒍  ${pet.level})`)
      .setColor("#FF00FF")
      .setDescription(`**𝐴𝑛𝑖𝑚𝑎𝑙 **: ${pet.type}\n**𝐹𝑒𝑒𝑑**: ${pet.feed}\n**𝐸𝑥𝑝**: ${pet.exp}`)
      .setThumbnail(petImageUrls ? petImageUrls[0]: null); // Add pet image if available

      return interaction.channel.send({
        embeds: [petEmbed]
      });
    }

    // If the command is unrecognized

    return interaction.channel.send("⚠️ Invalid command. Type `pet help` for a list of available commands.");
  }
};