export default {
  command: "company",
  subcommands: {
    start: [
      `**Command:** \`company start <name>\`\n**Purpose:** Create your company and become its CEO.\n**Requirements:**\n- **Company Name:** A single, **respectful word** (max 30 characters).\n- **Financials:** At least 10M net worth and 3M cash (for the registration fee).\n**Process:**\n- Validates the company name and ensures you don’t already own one.\n- Deducts a 3M fee from your cash.\n- Lets you choose a sector (e.g., Technology, Finance) with randomly generated initial stats (like stock price and market cap).\n- Sends a confirmation message with your new company details.`
    ],
    fund: [
      `**Command:** \`company fund <companyName> <amount>\`\n**Purpose:** Invest in an existing company (other than your own) to receive shares.\n**Process:**\n- Checks that the target company exists and verifies you have enough cash.\n- Calculates the number of shares you receive by dividing your investment by the current stock price.\n- Updates your investor profile or adds you as a new investor.\n- Refreshes the company’s share data.`
    ],
    funders: [
      `**Command:** \`company funders\`\n**Purpose:** View a list of all investors (funders) in your company.\n**Note:** This command is available only if you are the company owner.\n**Output Includes:**\n- Your company’s name.\n- Each funder’s Discord mention.\n- The number of shares held.\n- The time of their last investment.\n- Pagination if there are more than 5 funders.`
    ],
    ipo: [
      `**Command:** \`company ipo\`\n**Purpose:** Launch an Initial Public Offering (IPO) to take your company public and raise funds.\n**Requirements:**\n- You must own a registered company.\n- The company name must be clean (free of banned words).\n- The company must have a sufficient market cap (e.g., at least 1,000,000) and not already be public.\n**Process:**\n- Performs various checks on your company’s details.\n- Submits your IPO request for admin review.\n- Sends a confirmation message indicating your IPO is pending approval.`
    ],
    withdraw: [
      `**Command:** \`company withdraw\`\n**Purpose:** Withdraw your salary as the company owner.\n**Note:**\n- Available only to company owners.\n- Subject to a 3-day cooldown period.\n**Salary Calculation:**\n- Base salary amount.\n- A bonus equal to 100x of your company’s current stock price.\n- A small random additional bonus.\n**Process:**\n- Increases your cash balance by the calculated salary.\n- Updates your withdrawal cooldown timer.\n- Provides a confirmation message with the withdrawn amount and your company’s name.`
    ],
    work: [
      `**Command:** \`company work\`**Purpose:** Work to earn cash rewards and boost your company’s growth.\n**Note:**\n- Limited to one work action per hour.\n**Reward Calculation:**\n- A fixed base reward.\n- A bonus equal to 5% of your company’s current stock price.\n- A small random bonus scaled by the company’s volatility.\n**Process:**\n- Increases your personal cash.\n- Slightly boosts your company’s stock price and market cap.\n- Tracks your work actions for performance history.`
    ]
  }
};