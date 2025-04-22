import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";
import UserPet from "../../../models/Pet.js";
import petImages from "./helpers/petImages.json" with {
  type: "json"
};
import {
  Helper
} from "../../../helper.js";

// Universal message handler for both slash and text commands
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand;

  if (isInteraction) {
    if (!context.deferred) {
      await context.deferReply()
      .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }

    return context
    .editReply(data)
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));

  } else {
    return context
    .channel
    .send(data)
    .catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

// Function to retrieve pet image based on type and level
function getPetImage(petType, petLevel) {
  if (petLevel > 10) {
    petLevel = 10;
  }

  if (petImages[petType] && petImages[petType][petLevel]) {
    return petImages[petType][petLevel];
  }

  return null;
}

// Handler: Display help embed with all pet commands
async function petHelp(context) {
  const embed = new EmbedBuilder()
  .setTitle("🐱 𝗣𝗘𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗛𝗘𝗟𝗣")
  .addFields(
    {
      name: "pet rename <old> <new>",
      value: "Rename your pet (max 14 characters)."
    },
    {
      name: "pet switch <name>",
      value: "Switch your active pet by name."
    },
    {
      name: "pet food",
      value: "Check how much food you have available."
    },
    {
      name: "pet list",
      value: "View a list of all your pets with details."
    },
    {
      name: "pet view",
      value: "View details and image of your active pet."
    }
  )
  .setFooter({
    text: "Use e.g. `pet rename Fluffy Spot`, or `pet help`."
  });

  await handleMessage(context, {
    embeds: [embed]
  });
}

// Handler: Feed the active pet if cooldown and resources allow
async function petFeed(userPetData, petId) {
  const now = Date.now();
  const pet = userPetData.pets[petId];

  if (pet.lastFeed && Helper.checkTimeGap(pet.lastFeed, now) < 3) {
    const remaining = (
      3 - Helper.checkTimeGap(pet.lastFeed, now, {
        format: 'hours'
      })
    ).toFixed(1);

    return {
      content: `⏳ Please wait ${remaining} hours before feeding again.`,
      data: userPetData
    }
  }

  if (userPetData.food <= 0) {
    return {
      content: "⚠️ You don't have enough food! Collect food via fishing or daily rewards.",
      data: userPetData
    };
  }

  pet.feed++;
  pet.exp += 20;
  userPetData.food--;
  pet.lastFeed = now;

  await userPetData.save();

  return {
    content: `**${pet.name}** has been fed and is happy! 🍖`,
    data: userPetData
  }
}

// Handler: Rename a pet by specifying old and new names
async function petRename(context, userPetData, args) {
  const oldName = args[2];
  const newName = args[3];

  if (!oldName || !newName) {
    return handleMessage(context, {
      content: "⚠️ Usage: pet rename <old_name> <new_name> (max 14 chars)."
    });
  }

  const pet = userPetData.pets.find(
    p => p.name.toLowerCase() === oldName.toLowerCase()
  );

  if (!pet) {
    return handleMessage(context, {
      content: "⚠️ No pet found with that name."
    });
  }

  pet.name = newName.substring(0, 14);
  await userPetData.save();

  await handleMessage(context, {
    content: `✏️ Pet **${oldName}** has been renamed to **${pet.name}**.`
  });
}

// List of cat-specific talk phrases
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

// Handler: Let the pet talk
function petTalk() {
  const talk = catTalks[Math.floor(Math.random() * catTalks.length)];
  return talk;
}

// Handler: Switch active pet by name
async function petSwitch(context, userPetData, args) {
  const name = args[2];

  if (!name) {
    return handleMessage(context, {
      content: "⚠️ Usage: pet switch <pet_name>."
    });
  }

  const pet = userPetData.pets.find(
    p => p.name.toLowerCase() === name.toLowerCase()
  );

  if (!pet) {
    return handleMessage(context, {
      content: "⚠️ No pet found with that name."
    });
  }

  userPetData.active = userPetData.pets.indexOf(pet);
  await userPetData.save();

  await handleMessage(context, {
    content: `✅ ${pet.name} is now your active pet.`
  });
}

// Handler: Common actions (exercise, pat, walk) with cooldowns and exp gains
async function petAction(userPetData, petId, action) {
  const now = Date.now();

  const cooldowns = {
    excercise: 6,
    walk: 6,
    pat: 3
  };

  const expValues = {
    excercise: 10,
    walk: 10,
    pat: 10
  };

  const fieldKeys = {
    excercise: 'lastExercise',
    walk: 'lastWalkTime',
    pat: 'lastPatTime'
  };

  const lastTime = userPetData.pets[petId][fieldKeys[action]];
  const limit = cooldowns[action];

  if (lastTime && Helper.checkTimeGap(lastTime, now) < limit) {
    const remaining = (
      limit - Helper.checkTimeGap(lastTime, now, {
        format: 'hours'
      })
    ).toFixed(1);

    return {
      content: `⏳ Please wait ${remaining} hours before ${action}.`,
      data: userPetData
    };
  }

  const pet = userPetData.pets[petId];

  pet[fieldKeys[action]] = now;
  pet.exp += expValues[action];

  await userPetData.save();

  const actionMsgs = {
    exercise: `Whoa, ***${pet.name}*** just crushed that workout and is zooming with joy! 🔥🐾`,
    walk: `Yippee! ***${pet.name}*** pranced along the path, sniffing every leaf and soaking up the sunshine! 🌿☀️`,
    pat: `Squee! ***${pet.name}*** is in full cuddle mode and purring for more pats! 💖🎶`
  };

  return {
    content: actionMsgs[action],
    data: userPetData
  }
}

// Handler: Display available pet food
async function petFood(context, userPetData) {
  await handleMessage(context, {
    content: `🍖 You have ${userPetData.food} food remaining.`
  });
}

// Handler: List all pets with their stats
async function petList(context, userPetData) {
  const list = userPetData.pets
  .map((pet, index) => `
    **${pet.name}** - 𝐿𝑒𝑣𝑒𝑙 ${pet.level} (*${pet.type}*)`
  )
  .join("\n- ");

  const profile = context.user
  ? context.user.displayAvatarURL({
    dynamic: true
  }): context.author.displayAvatarURL({
    dynamic: true
  });

  const embed = new EmbedBuilder()
  .setTitle("🐱 𝙔𝙊𝙐𝙍 𝙋𝙀𝙏𝙎")
  .setDescription("- " + list)
  .setColor("#630872")
  .setAuthor({
    name: `${context.user ? context.user.username : context.author.username}`,
    iconURL: profile
  });

  await handleMessage(context, {
    embeds: [embed]
  });
}

// Handler: View active pet with interactive buttons
async function petView(context, userPetData, petId) {
  let pet = userPetData.pets[petId];
  const imgUrls = getPetImage(pet.petId, pet.level);

  const profile = context.user
  ? context.user.displayAvatarURL({
    dynamic: true
  }): context.author.displayAvatarURL({
    dynamic: true
  });

  const buildMainEmbeds = (pet, updateMessage) => {

    const threshold = 100;
    const nextLevelExp = threshold * (pet.level + 1) * (pet.level + 1);

    const returnEmbed1 = new EmbedBuilder()
    .setTitle(`${pet.name} (Level ${pet.level})`)
    .setDescription(
      `-# **TYPE** ⨳ ${pet.type}\n` +
      `- ***FEED COUNT*** ${pet.feed}\n` +
      `- ***EXPERIENCE*** ${pet.exp} / ${nextLevelExp}`
    )
    .setThumbnail(imgUrls ? imgUrls[0]: null)
    .setColor("#FF00FF");

    const returnEmbed2 = new EmbedBuilder()
    .setDescription(!updateMessage ? petTalk(): updateMessage)
    .setAuthor({
      name: "`𝗉𝖾𝗍 𝗁𝖾𝗅𝗉` 𝘧𝘰𝘳 𝘤𝘮𝘥𝘴" + `  ⨳ 🍖 ${userPetData.food}`, iconURL: profile
    });

    return [returnEmbed1,
      returnEmbed2];
  }

  const embeds = buildMainEmbeds(pet, "");

  // Action row with buttons for interactive pet actions
  const actionRow = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId("pet_feed")
    .setLabel("🍖 𝗙𝗘𝗘𝗗")
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId("pet_pat")
    .setLabel("☺️ 𝗣𝗔𝗧")
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId("pet_walk")
    .setLabel("🚶🏻‍♂️ 𝗪𝗔𝗟𝗞")
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId("pet_exercise")
    .setLabel("🤸🏻‍♂️ 𝗘𝗫𝗘𝗥𝗖𝗜𝗦𝗘")
    .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
    .setCustomId("pet_play")
    .setLabel("⚾ 𝗣𝗟𝗔𝗬")
    .setStyle(ButtonStyle.Secondary)
  );

  let sentMessage;

  const response = await handleMessage(context, {
    embeds: embeds,
    components: [actionRow]
  });

  if (context.isCommand) {
    sentMessage = await context.fetchReply();
  } else {
    sentMessage = response;
  }

  // Collector filter: only allow original user to interact
  const filter = interaction =>
  interaction.user.id === (context.user?.id || context.author.id);

  // Create collector to handle button clicks for 60 seconds
  const collector = sentMessage.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: 60000
  });

  collector.on("collect", async interaction => {
    const id = interaction.customId;
    await interaction.deferUpdate();
    let response;

    switch (id) {
      case "pet_feed":
        response = await petFeed(userPetData, petId);
        break;
      case "pet_pat":
        response = await petAction(userPetData, petId, "pat");
        break;
      case "pet_walk":
        response = await petAction(userPetData, petId, "walk");
        break;
      case "pet_exercise":
        response = await petAction(userPetData, petId, "excercise");
        break;
      case "pet_play":
        response = {
          content: `Yay! ${pet.name} is chasing toys and tumbling around in pure playtime bliss! 🧸✨`,
          data: userPetData
        }
        break;
    }

    userPetData = response.data;
    pet = userPetData.pets[petId];

    const embeds = buildMainEmbeds(pet, response.content);
    await interaction.editReply({
      embeds: embeds
  });

    // Disable buttons after interaction
  });

collector.on("end", async collected => {
  try {
    // Disable all buttons when collector ends
    const disabledRow = new ActionRowBuilder().addComponents(
      actionRow.components.map(button => button.setDisabled(true))
    );

    await sentMessage.edit({
      components: [disabledRow]
  });
} catch (err) {}
});
}

// Main command export definition
export default {
name: "pet",
description: "Manage your virtual pets!",
aliases: ["pets",
"mypet"],
args: "<action> [parameters]",
example: ["pet help"],
cooldown: 10000,

async execute(args, context) {
const userId = context.user?.id || context.author.id;
let userPetData = await UserPet.findOne({
id: userId
});

if (!userPetData) {
userPetData = new UserPet( {
id: userId
});
}

const activeId = parseInt(userPetData.active) || 0;

// Auto-level-up logic
const threshold = 100;
const now = Date.now();
const calculatedLevel = Math.floor(
Math.sqrt(userPetData.pets[activeId].exp / threshold)
) || 0;

if (calculatedLevel !== userPetData.pets[activeId].level) {
userPetData.pets[activeId].level = calculatedLevel;
const reward = 10 + calculatedLevel;
userPetData.food += reward;
await userPetData.save();

await handleMessage(context, {
content: `🎉 Level up! ${
userPetData.pets[activeId].name
} is now level ${calculatedLevel}! You earned ${reward} food.`
});
}

switch (args[1]) {
case "help":
return petHelp(context);
case "rename":
return petRename(context, userPetData, args);
case "switch":
return petSwitch(context, userPetData, args);
case "food":
return petFood(context, userPetData);
case "list":
return petList(context, userPetData);
case undefined:
case "view":
return petView(context, userPetData, activeId);
default:
return handleMessage(context, {
content: "⚠️ Invalid command. Type `pet help` for a list of valid commands."
});
}
}
};