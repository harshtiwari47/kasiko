export default {
  command: "bank",
  subcommands: {
    default: [
      "## Bank Command Guide – Page 1\n\nWelcome to the **Bank Command Guide**!\n\nThis guide helps you manage your money with these commands:\n\n- **bank open**: Open a new bank account (Cost: <:kasiko_coin:1300141236841086977> 1000).\n- **deposit <amount>**: Put cash into your bank account. You can use `all` to deposit everything.\n- **withdraw <amount>**: Take cash out of your bank account. Use `all` to withdraw everything you have in the bank.\n- **bank status**: Check your bank details like deposit, level, and cash on hand.\n- **bank upgrade <times>**: Upgrade your bank to increase your storage capacity (each level costs <:kasiko_coin:1300141236841086977> 300k per level, with possible discounts for premium users).\n\nMake sure you have enough cash before using these commands.",
      "## Bank Command Guide – Page 2\n\n### Extra Tips\n\n- **Depositing Money:**\n  - Your bank has a storage limit that depends on your level. You cannot deposit more than this limit.\n\n- **Upgrading Your Bank:**\n  - Upgrading increases your bank’s storage by <:kasiko_coin:1300141236841086977> 500k per level.\n  - The upgrade cost may be reduced if you have premium benefits.\n\n- **Safety Measures:**\n  - All transactions have error checks. If something goes wrong, your money is restored.\n\nUse these commands to keep your cash safe and grow your bank account!"
    ],
    deposit: [
      "## Deposit Command Guide – Page 1\n\nThe **deposit** command lets you move cash from your wallet into your bank account.\n\n**Examples:**\n- `deposit 500` – Deposits 500 cash.\n- `deposit all` – Deposits all your available cash.\n\n**How It Works:**\n- The command checks that you have enough cash.\n- It makes sure you have an open bank account and that the deposit does not go over your bank’s storage limit.",
      "## Deposit Command Guide – Page 2\n\n### Key Points\n\n- **Enough Cash:**\n  - Check your wallet before you deposit.\n\n- **Storage Limit:**\n  - Your bank level sets a limit on how much you can deposit.\n\n- **Confirmation:**\n  - After depositing, you will see your new bank balance and remaining cash."
    ],
    withdraw: [
      "## Withdraw Command Guide – Page 1\n\nThe **withdraw** command lets you take money out of your bank account.\n\n**Examples:**\n- `withdraw 500` – Withdraws 500 cash from your bank.\n- `withdraw all` – Withdraws all the money in your bank account.\n\n**How It Works:**\n- The command checks that your bank has enough funds for the withdrawal.\n- The requested amount is removed from your bank and added to your cash on hand.",
      "## Withdraw Command Guide – Page 2\n\n### Key Points\n\n- **Enough Funds:**\n  - Make sure your bank balance covers the amount you want to withdraw.\n\n- **Simple Process:**\n  - There are no extra fees or interest; you get the exact amount you request.\n\n- **Confirmation:**\n  - After withdrawing, you will see your new bank balance and cash amount."
    ],
    open: [
      "## Open Account Command Guide – Page 1\n\nThe **open** command lets you create a new bank account if you don’t already have one.\n\n**Example:**\n- `bank open` – Opens a bank account for a cost of <:kasiko_coin:1300141236841086977> 1000 cash.\n\n**How It Works:**\n- The command checks if you have enough cash and that you don’t already have an open account.",
      "## Open Account Command Guide – Page 2\n\n### Key Points\n\n- **Opening Cost:**\n  - You need at least <:kasiko_coin:1300141236841086977> 1000 cash to open an account.\n\n- **Account Check:**\n  - If you already have an account, you cannot open another.\n\n- **Confirmation:**\n  - After opening, you can start depositing and withdrawing money."
    ],
    upgrade: [
      "## Upgrade Command Guide – Page 1\n\nThe **upgrade** command increases your bank’s level, which boosts your storage capacity.\n\n**Example:**\n- `bank upgrade` or `bank upgrade 2` – Upgrades your bank by one level (or more if you specify a number).\n\n**How It Works:**\n- Upgrading costs <:kasiko_coin:1300141236841086977> 300k per level (discounts may apply for premium users).\n- The cost is deducted from your bank deposit and your bank level increases.",
      "## Upgrade Command Guide – Page 2\n\n### Key Points\n\n- **Upgrade Cost:**\n  - Ensure your bank deposit can cover the upgrade cost.\n\n- **Multiple Upgrades:**\n  - You can upgrade more than one level at a time by specifying the number.\n\n- **New Capacity:**\n  - Each level gives you an extra <:kasiko_coin:1300141236841086977> 500k storage.\n\n- **Confirmation:**\n  - After upgrading, your new level and remaining bank balance will be shown."
    ],
    status: [
      "## Status Command Guide – Page 1\n\nThe **status** command shows you your bank account details, including your deposit, storage capacity, bank level, and cash on hand.\n\n**Example:**\n- `bank status` (or aliases like `bs` or `ba`) – Displays your bank status in a clear format.",
      "## Status Command Guide – Page 2\n\n### Key Points\n\n- **Overview:**\n  - View your bank deposit, storage capacity, and upgrade cost.\n\n- **Easy to Read:**\n  - The details are presented in an organized, user-friendly way.\n\n- **Planning:**\n  - Knowing your bank status helps you decide when to upgrade or deposit more cash."
    ]
  }
};