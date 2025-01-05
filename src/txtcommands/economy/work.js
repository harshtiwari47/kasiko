import {
  getUserData,
  updateUser
} from '../../../database.js';

import {
  AttachmentBuilder,
  EmbedBuilder
} from 'discord.js';

const careers = {
  CEO: {
    messages: [
      "📈 **{username}**, you sealed a billion-dollar deal! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Keep dominating the market!",
      "💼 **{username}**, your leadership inspired the team to exceed targets! <:kasiko_coin:1300141236841086977>**{cash}** cash flows in!",
      "🚀 **{username}**, your company launched a groundbreaking product! <:kasiko_coin:1300141236841086977>**{cash}** added to your empire.",
      "👔 **{username}**, you navigated a tough negotiation flawlessly! <:kasiko_coin:1300141236841086977>**{cash}** cash earned. True boss energy!",
      "🏢 **{username}**, the stock price soared under your watch! <:kasiko_coin:1300141236841086977>**{cash}** profit secured."
    ]
  },
  Developer: {
    messages: [
      "💻 **{username}**, you built a next-gen app! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Code like a pro!",
      "🖥️ **{username}**, you debugged a critical issue just in time! <:kasiko_coin:1300141236841086977>**{cash}** cash well-earned.",
      "⚙️ **{username}**, your software upgrade wowed everyone! <:kasiko_coin:1300141236841086977>**{cash}** added to your stack.",
      "☕ **{username}**, fueled by caffeine, you crushed the sprint! <:kasiko_coin:1300141236841086977>**{cash}** earned. A true code warrior!",
      "🌐 **{username}**, your open-source project went viral! <:kasiko_coin:1300141236841086977>**{cash}** cash. Internet genius!"
    ]
  },
  Scientist: {
    messages: [
      "🔬 **{username}**, you discovered a revolutionary formula! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Knowledge is power!",
      "🧪 **{username}**, your experiment succeeded beyond expectations! <:kasiko_coin:1300141236841086977>**{cash}** added to your research fund.",
      "🌟 **{username}**, your paper got published in a top journal! <:kasiko_coin:1300141236841086977>**{cash}** cash earned. Pure brilliance!",
      "📊 **{username}**, your data analysis revealed groundbreaking insights! <:kasiko_coin:1300141236841086977>**{cash}** awarded for innovation.",
      "🚀 **{username}**, you solved a critical problem for space exploration! <:kasiko_coin:1300141236841086977>**{cash}** cash earned. To infinity and beyond!"
    ]
  },
  Artist: {
    messages: [
      "🎨 **{username}**, your painting sold for a fortune! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. A true masterpiece!",
      "🖌️ **{username}**, your latest sculpture amazed critics! <:kasiko_coin:1300141236841086977>**{cash}** added to your collection.",
      "🎭 **{username}**, your performance left the audience in awe! <:kasiko_coin:1300141236841086977>**{cash}** cash earned. Bravo!",
      "📷 **{username}**, your photography exhibition was a huge success! <:kasiko_coin:1300141236841086977>**{cash}** added to your creative empire.",
      "🖼️ **{username}**, your art went viral on social media! <:kasiko_coin:1300141236841086977>**{cash}** cash. You're a cultural icon!"
    ]
  },
  Chef: {
    messages: [
      "🍳 **{username}**, your signature dish became a sensation! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. Culinary brilliance!",
      "🍝 **{username}**, your restaurant earned a 5-star review! <:kasiko_coin:1300141236841086977>**{cash}** cash flows in. Chef extraordinaire!",
      "🍰 **{username}**, your dessert captivated the critics! <:kasiko_coin:1300141236841086977>**{cash}** earned. Sweet success!",
      "🔥 **{username}**, you mastered the perfect flambé! <:kasiko_coin:1300141236841086977>**{cash}** added to your menu.",
      "🧑‍🍳 **{username}**, your cooking show gained massive popularity! <:kasiko_coin:1300141236841086977>**{cash}** cash. A star in the kitchen!"
    ]
  },
  Adventurer: {
    messages: [
      "🏔️ **{username}**, you discovered hidden treasure in the mountains! Earned <:kasiko_coin:1300141236841086977>**{cash}** cash. What a find!",
      "🗺️ **{username}**, your expedition uncovered ancient artifacts! <:kasiko_coin:1300141236841086977>**{cash}** cash added to your journey fund.",
      "🏝️ **{username}**, you survived a thrilling jungle adventure! <:kasiko_coin:1300141236841086977>**{cash}** cash. You're a true explorer!",
      "🚤 **{username}**, your deep-sea dive unearthed rare gems! <:kasiko_coin:1300141236841086977>**{cash}** cash. Dive deeper!",
      "⚔️ **{username}**, you braved the unknown and returned victorious! <:kasiko_coin:1300141236841086977>**{cash}** earned. Courage rewarded!"
    ]
  }
};

export async function work(id, channel) {
  let workMessage;
  try {
    const guild = await channel.guild.members.fetch(id);
    let userData = await getUserData(id);

    const earnedCash = Math.floor(Math.random() * 3000) + 500;

    userData.cash += earnedCash;

    await updateUser(id, userData);

    let randomCarreer = Object.keys(careers)[Math.floor(Math.random() * Object.keys(careers).length)];

    const randomMessage = careers[randomCarreer].messages[Math.floor(Math.random() * careers[randomCarreer].messages.length)];

    return workMessage = (randomMessage.replace("{username}", guild.user.username).replace("{cash}", earnedCash.toLocaleString()));
  } catch (e) {
    console.log(e);
    return workMessage = ("Oops! Something went wrong while working 💼!");
  }
}

export default {
  name: "work",
  description: "Earn a random amount of cash by working.",
  aliases: ["job",
    "earn", "w"],
  args: "",
  example: ["work",
    "job",
    "earn"],
  related: ["tosscoin",
    "cash",
    "slots",
    "dice"],
  cooldown: 10000,
  category: "🏦 Economy",
  execute: async (args, message) => {
    let workReply = await work(message.author.id, message.channel);

    const finalEmbed = new EmbedBuilder()
    .setDescription(`${workReply}`)
    .setAuthor({
      name: message.author.username, iconURL: message.author.displayAvatarURL({
        dynamic: true
      })
    })
    .setColor("#f8c6c6")

    await message.channel.send({
      embeds: [finalEmbed]
    });

    return;
  },

  // Interact function to handle Slash Command interaction
  interact: async (interaction) => {
    try {
      const userId = interaction.user.id;
      const channel = interaction.channel;

      // Call the work function
      let workReply = await work(userId, channel);

      const finalEmbed = new EmbedBuilder()
      .setDescription(`${workReply}`)
      .setAuthor({
        name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({
          dynamic: true
        })
      })
      .setColor("#f8c6c6")

      // Respond to the slash command interaction
      await interaction.editReply({
        embeds: [finalEmbed]
      });

      return;
    } catch (e) {
      console.log(e);
      // Handle any error and respond appropriately
      await interaction.editReply({
        content: "Oops! Something went wrong while working 💼. Please try again later!"
      });
      return;
    }
  }
};