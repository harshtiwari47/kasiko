import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/**
* Sends a multi-page help guide explaining the game,
* its commands, and strategies for beginners and advanced players.
*
* @param {object} ctx - The command context (message or interaction).
*/
async function handleAlienHelp(ctx) {
  // Define the help pages (6 pages in this example)
  const pages = [];

  // Page 1: Introduction & Overview
  pages.push(
    new EmbedBuilder()
    .setTitle("👽 Welcome to Cosmic Infiltration!")
    .setDescription(
      `Greetings, cosmic wanderer!\n\n` +
      `In *Cosmic Infiltration*, you assume the role of an extraterrestrial being on a secret mission: to infiltrate humanity and reshape Earth from the shadows. ` +
      `Harness advanced alien technology, master unique abilities, and manipulate human systems to accumulate resources and influence. ` +
      `Every decision you make shapes your destiny in this interstellar adventure.`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 1/6 - Introduction"
    })
  );

  // Page 2: Getting Started
  pages.push(
    new EmbedBuilder()
    .setTitle("🚀 Getting Started")
    .setDescription(
      `**1. Join the Collective:**\n` +
      `Begin your journey with the \`alien join\` command. This registers you into the cosmic collective and provides you with a unique profile, basic resources, and a starter set of abilities.\n\n` +
      `**2. Craft Your Disguise:**\n` +
      `Blend in with humanity by using the \`alien disguise\` command. Your disguise is your secret identity that helps you operate undercover on Earth.`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 2/6 - Getting Started"
    })
  );

  // Page 3: Core Commands Overview
  pages.push(
    new EmbedBuilder()
    .setTitle("📜 Core Commands")
    .setDescription(
      `Here are the essential commands that power your cosmic operations:\n\n` +
      `• **\`alien profile\`**: View your status, resources, battle stats, and abilities.\n` +
      `• **\`alien harvest\`**: Harvest human resources and energy (note the cooldown period).\n` +
      `• **\`alien manipulate\`**: Influence the human economy to gain extra resources and increase your influence.\n` +
      `• **\`alien upgrade\`**: Spend your resources to unlock or enhance powerful alien abilities and boost your tech.\n` +
      `• **\`alien battle\`**: Engage in intergalactic duels—challenge other players or fight against random cosmic opponents.\n` +
      `• **\`alien exchange <amount>\`**: Convert your energy into cash using advanced alien technology. Use \`all\` to exchange everything.`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 3/6 - Core Commands"
    })
  );

  // Page 4: Resource Management & Abilities
  pages.push(
    new EmbedBuilder()
    .setTitle("💎 Resource Management & Abilities")
    .setDescription(
      `Your progress hinges on managing resources and developing abilities:\n\n` +
      `• **Resources & Energy:** Use \`alien harvest\` to collect resources and energy. These are vital for upgrades and abilities.\n` +
      `• **Upgrades:** The \`alien upgrade\` command lets you invest in new abilities that enhance your resource collection, battle prowess, and tech capabilities.\n` +
      `• **Inventory:** Keep track of special items and collectibles using \`alien inventory\`. They might give you an edge in battles and economic maneuvers.\n\n`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 4/6 - Resources & Abilities"
    })
  );

  // Page 5: Battle Mechanics
  pages.push(
    new EmbedBuilder()
    .setTitle("⚔️ Battle Mechanics")
    .setDescription(
      `Combat is a thrilling part of your cosmic journey:\n\n` +
      `• **Duels & Challenges:** Use \`alien battle\` to initiate a fight. You can challenge friends or face random opponents.\n` +
      `• **Battle Stats:** Your performance in battle depends on your health, attack, defense, agility, and critical chance. Upgrading these stats is crucial for survival.\n` +
      `• **Tactical Rounds:** Each battle consists of multiple rounds where timing, dodging, and critical strikes can turn the tide.\n\n` +
      `Winning battles rewards you with additional resources and influence, while losses serve as lessons to improve your strategy.`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 5/6 - Battle Mechanics"
    })
  );

  // Page 6: Advanced Tips & Mastery
  pages.push(
    new EmbedBuilder()
    .setTitle("🌌 Advanced Tips & Mastery")
    .setDescription(
      `Ready to ascend to cosmic mastery? Consider these advanced strategies:\n\n` +
      `• **Strategic Upgrades:** Plan your resource spending wisely. Focus on abilities that compliment your preferred style—be it direct confrontation or subtle manipulation.\n` +
      `• **Cooldown Management:** Timing is everything. Use your harvest and energy exchange commands optimally to maintain a steady flow of resources.\n` +
      `• **Battle Preparation:** Before engaging in a duel, ensure you have sufficient resources. Upgraded stats can make a significant difference in combat outcomes.\n` +
      `• **Experiment & Adapt:** The universe is vast and unpredictable. Try different command combinations and adapt your strategy based on your experiences.\n\n` +
      `Every action you take weaves your destiny among the stars. Embrace the unknown, learn from each encounter, and become the ultimate cosmic force!`
    )
    .setColor(0x2f3136)
    .setFooter({
      text: "Page 6/6 - Advanced Tips & Mastery"
    })
  );

  // Create pagination buttons (Previous and Next)
  const prevButton = new ButtonBuilder()
  .setCustomId("help_prev")
  .setLabel("◀ Previous")
  .setStyle(ButtonStyle.Primary);

  const nextButton = new ButtonBuilder()
  .setCustomId("help_next")
  .setLabel("Next ▶")
  .setStyle(ButtonStyle.Primary);

  let currentPage = 0;

  const actionRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

  // Send the initial embed with pagination buttons.
  const helpMessage = await ctx.reply({
    embeds: [pages[currentPage]],
    components: [actionRow]
  });

  // Create a collector to handle pagination button interactions.
  const collector = helpMessage.createMessageComponentCollector({
    time: 300000 // Active for 5 minutes
  });

  collector.on("collect", async (interaction) => {
    // Ensure that only the user who invoked the help command can interact with these buttons.
    const userId = ctx.author ? ctx.author.id: ctx.user.id;
    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: "These buttons aren't for you!",
        ephemeral: true
      });
    }

    // Update the current page based on which button was pressed.
    if (interaction.customId === "help_prev") {
      currentPage = currentPage > 0 ? currentPage - 1: pages.length - 1;
    } else if (interaction.customId === "help_next") {
      currentPage = currentPage < pages.length - 1 ? currentPage + 1: 0;
    }

    // Update the footer to show current page info.
    pages[currentPage].setFooter({
      text: `Page ${currentPage + 1}/${pages.length}`
    });
    await interaction.update({
      embeds: [pages[currentPage]],
      components: [actionRow]
    });
  });

  // When the collector expires, disable the buttons.
  collector.on("end",
    async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        prevButton.setDisabled(true),
        nextButton.setDisabled(true)
      );
      try {
        await helpMessage.edit({
          components: [disabledRow]
        });
      } catch (error) {
        console.error("Error disabling buttons:", error);
      }
    });
}

export default handleAlienHelp;