import {
  SlashCommandBuilder
} from '@discordjs/builders';
import {
  portfolioCommand
} from '../../txtcommands/stocks/req/portfolio.js';
import {
  buySharesCommand
} from '../../txtcommands/stocks/req/buy.js';
import {
  sellSharesCommand
} from '../../txtcommands/stocks/req/sell.js';
import stocksCommand from '../../txtcommands/stocks/stocks.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stocks')
    .setDescription('Access the real-time stock market, trade shares, and manage your portfolio.')
    .addSubcommand(sub =>
      sub
        .setName('all')
        .setDescription('View all active companies, stock prices, and market trends.')
    )
    .addSubcommand(sub =>
      sub
        .setName('portfolio')
        .setDescription('View your current stock holdings and investment performance.')
    )
    .addSubcommand(sub =>
      sub
        .setName('news')
        .setDescription('Read the latest financial newspaper and market catalyst events.')
    )
    .addSubcommand(sub =>
      sub
        .setName('price')
        .setDescription('Check the live price, chart, and metrics of a specific stock.')
        .addStringOption(opt =>
          opt
            .setName('symbol')
            .setDescription('Company symbol or name')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('buy')
        .setDescription('Purchase shares of a company.')
        .addStringOption(opt =>
          opt
            .setName('symbol')
            .setDescription('Company symbol or name')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of shares to purchase')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('sell')
        .setDescription('Sell shares of a company from your portfolio.')
        .addStringOption(opt =>
          opt
            .setName('symbol')
            .setDescription('Company symbol or name')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of shares to sell')
            .setRequired(true)
            .setMinValue(1)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand() || 'all';

    if (sub === 'portfolio') {
      return portfolioCommand(interaction);
    }

    if (sub === 'buy') {
      const symbol = interaction.options.getString('symbol');
      const amount = interaction.options.getInteger('amount');
      return buySharesCommand(interaction, [symbol, amount]);
    }

    if (sub === 'sell') {
      const symbol = interaction.options.getString('symbol');
      const amount = interaction.options.getInteger('amount');
      return sellSharesCommand(interaction, [symbol, amount]);
    }

    const symbol = interaction.options.getString('symbol');
    const args = ['stocks', sub];
    if (symbol) args.push(symbol);

    return stocksCommand.execute(args, interaction);
  }
};
