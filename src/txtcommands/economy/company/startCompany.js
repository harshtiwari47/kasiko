import Company from '../../../../models/Company.js';
import {
  getUserData,
  updateUser
} from '../../../../database.js';
import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';

// Universal function for sending responses
async function handleMessage(context, data) {
  const isInteraction = !!context.isCommand; // Distinguishes slash command from a normal message
  if (isInteraction) {
    // If not already deferred, defer it.
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    // For normal text-based usage
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function startCompanyCommand(message, args) {
  try {
    const userId = message.author.id;
    const companyName = args[1];
    const username = message.author.username;

    if (!companyName) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a company name.\n**Usage:** \`company start <companyName>\`\n**Tip**: Use a simple name without spaces for better searchability.`
      });
    }

    if (companyName.length > 30) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, the company name should not exceed 30 characters. Please provide a shorter name with no space.`
      });
    }

    // Check if user already has a company
    const existingCompany = await Company.findOne({
      owner: userId
    });
    if (existingCompany) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you already have a registered company!`
      });
    }

    // Retrieve user data (assumed to include networth and cash)
    const userData = await getUserData(userId);
    if (!userData) {
      return handleMessage(message, {
        content: "User data not found."
      });
    }

    // Requirements: net worth must be >1M and cash at least 3M for the registration fee.
    if (userData.networth < 1000000) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you need a net worth of at least <:kasiko_coin:1300141236841086977> **1M** to start a company.`
      });
    }
    if (userData.cash < 300000) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you need at least <:kasiko_coin:1300141236841086977> **3M** cash to pay the registration fee.`
      });
    }

    // Deduct registration fee of 3M cash.
    userData.cash -= 300000;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Define 15 sectors with at least 4 taglines each.
    const sectors = {
      "Technology": [
        "Innovating for a digital future.",
        "Tech solutions that empower.",
        "Where code meets creativity.",
        "Transforming ideas into technology."
      ],
      "Finance": [
        "Investing in your future.",
        "Where money meets strategy.",
        "Finance redefined for growth.",
        "Your wealth, our commitment."
      ],
      "Healthcare": [
        "Caring for life with innovation.",
        "Health meets technology.",
        "Empowering wellness worldwide.",
        "Pioneering healthcare solutions."
      ],
      "Retail": [
        "Revolutionizing shopping experiences.",
        "Your satisfaction is our priority.",
        "Retail reimagined for you.",
        "Where convenience meets style."
      ],
      "Energy": [
        "Powering a sustainable tomorrow.",
        "Energizing the future.",
        "Fueling innovation in energy.",
        "Green energy for a better world."
      ],
      "Entertainment": [
        "Bringing joy through creativity.",
        "Entertainment that inspires.",
        "Where fun meets innovation.",
        "Creating memorable experiences."
      ],
      "Real Estate": [
        "Building dreams one home at a time.",
        "Invest in your future, invest in property.",
        "Real estate redefined.",
        "Where space meets innovation."
      ],
      "Agriculture": [
        "Cultivating growth and sustainability.",
        "Feeding the future.",
        "Where nature meets innovation.",
        "Harvesting success for tomorrow."
      ],
      "Automotive": [
        "Driving innovation forward.",
        "Where performance meets design.",
        "Automotive excellence redefined.",
        "The road to the future."
      ],
      "Travel": [
        "Discover the world with us.",
        "Travel reimagined.",
        "Where adventure meets comfort.",
        "Your journey, our passion."
      ],
      "Education": [
        "Empowering minds, shaping futures.",
        "Where learning meets innovation.",
        "Educate, innovate, elevate.",
        "Your future starts here."
      ],
      "Food & Beverage": [
        "Savor the taste of innovation.",
        "Where flavor meets quality.",
        "Delicious experiences redefined.",
        "Feeding passions, one bite at a time."
      ],
      "Fashion": [
        "Setting trends, defining style.",
        "Where elegance meets innovation.",
        "Fashion that speaks volumes.",
        "Your style, our passion."
      ],
      "Logistics": [
        "Connecting the world seamlessly.",
        "Where efficiency meets reliability.",
        "Logistics redefined for the modern age.",
        "Delivering excellence every time."
      ],
      "Media": [
        "Broadcasting innovation daily.",
        "Where stories come to life.",
        "Media that matters.",
        "Your voice, our platform."
      ]
    };

    // Build a select menu for sector selection.
    const options = Object.keys(sectors).map(sector => ({
      label: sector,
      description: `Select ${sector} sector.`,
      value: sector
    }));

    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('selectSector')
    .setPlaceholder('Choose your sector')
    .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Send the select menu message.
    const menuMessage = await message.channel.send({
      content: `ⓘ **${username}**, please select a sector for your company **${companyName}**:`,
      components: [row]
    });

    // Create a collector to handle the menu selection.
    const filter = i => i.customId === 'selectSector' && i.user.id === userId;
    const collector = menuMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute to respond
      max: 1
    });

    collector.on('collect', async (interaction) => {
      try {
        // Defer the update to acknowledge the interaction.
        await interaction.deferUpdate();
        const selectedSector = interaction.values[0];
        // Randomly pick one tagline from the selected sector.
        const taglines = sectors[selectedSector];
        const description = taglines[Math.floor(Math.random() * taglines.length)];

        // Generate randomized starting stats.
        const initialPrice = Math.floor(Math.random() * 100) + 50; // between 50 and 150
        const marketCap = initialPrice * (Math.floor(Math.random() * 1000) + 1000);
        const volatility = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const PEratio = parseFloat((Math.random() * 20 + 10).toFixed(1)); // between 10 and 30
        const dividendYield = (Math.random() * 3).toFixed(1) + '%';
        const protection = 100;

        // Initialize last10Prices with the initial price.
        const last10Prices = Array(10).fill(initialPrice);

        // Create the new company.
        const newCompany = new Company( {
          owner: userId,
          name: companyName.toUpperCase(),
          sector: selectedSector,
          description,
          CEO: username,
          marketCap,
          currentPrice: initialPrice,
          last10Prices,
          maxPrice: Math.max(...last10Prices),
          minPrice: Math.min(...last10Prices),
          trend: 'stable',
          volatility,
          PEratio,
          dividendYield,
          protection,
        });

        await newCompany.save();

        // Remove the select menu by editing the original message.
        await menuMessage.edit({
          content: '🍾 Sector selected. Processing registration...',
          components: []
        });

        const embed = new EmbedBuilder()
        .setDescription(`## 🏢 Company Registered!\n\n**${username}**, your company **${companyName}** has been successfully registered in the **${selectedSector}** sector.`)
        .setColor("#bde2cd")
        .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/bosschair.jpg`);

        const embed2 = new EmbedBuilder()
        .setDescription(
          `➤ **Registration Cost**: <:kasiko_coin:1300141236841086977> 3M cash\n` +
          `➤ **Initial Stock Price**: <:kasiko_coin:1300141236841086977> ${initialPrice}\n` +
          `➤ **CEO**: ${username}`
        )
        .setTimestamp();

        return handleMessage(message, {
          embeds: [embed, embed2]
        });
      } catch (err) {
        console.error("Error during sector selection:", err);
        return handleMessage(message, {
          content: `⚠ An error occurred during sector selection: ${err.message}`
        });
      }
    });

    collector.on('end', async (collected, reason) => {
      if (collected.size === 0) {
        try {
          await menuMessage.edit({
            content: `ⓘ **${username}**, you did not select a sector in time. Please try again.`,
            components: []
          });
        } catch (err) {
          console.error("Error editing menu message after timeout:", err);
        }
      }
    });
  } catch (error) {
    console.error("Error in startCompanyCommand:",
      error);
    try {
      return handleMessage(message,
        {
          content: `⚠ An error occurred while registering your company.\n**Error**: ${error.message}`
        });
    } catch (err) {
      console.error("Error sending error message:",
        err);
    }
  }
}