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
    if (!context.deferred) {
      await context.deferReply().catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
    }
    return context.editReply(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  } else {
    return context.channel.send(data).catch(err => ![50001, 50013, 10008].includes(err.code) && console.error(err));
  }
}

export async function startCompanyCommand(message, args) {
  try {
    const userId = message.user ? message.user.id: message.author.id;
    const username = message.user ? message.user.username: message.author.username;

    const companyName = args[1];

    if (!companyName) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, please provide a company name.\n**Usage:** \`company start <companyName>\`\n**Tip:** Use a simple name without spaces for better searchability.`
      });
    }
    if (companyName.length > 30) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, the company name should not exceed 30 characters. Please provide a shorter name with no spaces.`
      });
    }

    // Check if the user already has a registered company.
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
    // Requirements: net worth must be >10M and cash at least 300K for the registration fee.
    if (userData.networth < 10000000) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you need a net worth of at least <:kasiko_coin:1300141236841086977> **10M** to start a company.`
      });
    }
    if (userData.cash < 3000000) {
      return handleMessage(message, {
        content: `ⓘ **${username}**, you need at least <:kasiko_coin:1300141236841086977> **3M** cash to pay the registration fee.`
      });
    }

    // Deduct the registration fee.
    userData.cash -= 3000000;
    await updateUser(userId, {
      cash: userData.cash
    });

    // Define sectors and taglines.
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

    const filter = i => i.customId === 'selectSector' && i.user.id === userId;
    const collector = menuMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute to respond
      max: 1
    });

    collector.on('collect', async (interaction) => {
      try {
        await interaction.deferUpdate();
        const selectedSector = interaction.values[0];
        // Randomly choose one tagline for the selected sector.
        const taglines = sectors[selectedSector];
        const tagline = taglines[Math.floor(Math.random() * taglines.length)];

        // Generate randomized starting stats.
        const initialPrice = Math.floor(Math.random() * 100) + 50; // Price between 50 and 150.
        const marketCap = initialPrice * (Math.floor(Math.random() * 1000) + 1000); // Random cap.
        const volatility = Math.floor(Math.random() * 5) + 1; // 1 to 5.
        const PEratio = parseFloat((Math.random() * 20 + 10).toFixed(1)); // between 10 and 30.
        const dividendYield = parseFloat((Math.random() * 3).toFixed(1)); // as a number (0 to 3).
        const protection = 100;
        // Initialize last10Prices with the initial price.
        const last10Prices = Array(10).fill(initialPrice);

        // Create the new company using the updated model.
        const newCompany = new Company( {
          owner: userId,
          name: companyName.toUpperCase(),
          sector: selectedSector,
          description: tagline,
          ceo: username,
          marketCap,
          currentPrice: initialPrice,
          last10Prices,
          maxPrice: Math.max(...last10Prices),
          minPrice: Math.min(...last10Prices),
          trend: 'stable',
          volatility,
          peRatio: PEratio,
          dividendYield,
          protection,
          // New fields for equity simulation:
          totalSharesOutstanding: 1000, // Starting with 1,000 shares.
          authorizedShares: 10000, // Maximum allowed shares.
          shareholders: [{
            userId,
            shares: 1000,
            role: 'founder',
            lastInvestedAt: new Date(),
            cost: 1000 * initialPrice
          }],
          fundingRounds: [],
          priceHistory: [{
            price: initialPrice,
            date: Date.now()
          }],
          isPublic: false,
          ipoDate: null
        });

        await newCompany.save();

        // Remove the select menu.
        await menuMessage.edit({
          content: '🍾 Sector selected. Processing registration...',
          components: []
        });

        const embed = new EmbedBuilder()
        .setDescription(`## 🏢 Company Registered!\n\n**${username}**, your company **${companyName.toUpperCase()}** has been successfully registered in the **${selectedSector}** sector.`)
        .setColor("#bde2cd")
        .setThumbnail(`https://harshtiwari47.github.io/kasiko-public/images/bosschair.jpg`)
        .setTimestamp();

        const embed2 = new EmbedBuilder()
        .setDescription(
          `➤ **Registration Fee**: <:kasiko_coin:1300141236841086977> 300K cash\n` +
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
    return handleMessage(message,
      {
        content: `⚠ An error occurred while registering your company.\n**Error**: ${error.message}`
      });
  }
}