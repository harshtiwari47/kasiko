import redisClient from '../../../redis.js';
import { buildNews } from './stockNews.js';

// Sector profiles with baseline volatility and cyclical characteristics
const SECTOR_PROFILES = {
  TECH: { volatility: 1.4, beta: 1.2, name: 'Technology' },
  FINANCE: { volatility: 0.9, beta: 0.9, name: 'Finance' },
  ENERGY: { volatility: 1.2, beta: 1.1, name: 'Energy' },
  HEALTHCARE: { volatility: 1.3, beta: 1.0, name: 'Healthcare & Biotech' },
  RETAIL: { volatility: 0.8, beta: 0.8, name: 'Consumer & Retail' },
  AEROSPACE: { volatility: 1.1, beta: 1.0, name: 'Aerospace' },
  MEDIA: { volatility: 1.0, beta: 1.0, name: 'Media & Entertainment' },
  TRAVEL: { volatility: 1.3, beta: 1.2, name: 'Travel & Hospitality' },
  DEFAULT: { volatility: 1.0, beta: 1.0, name: 'General Market' }
};

/**
 * Normalizes sector string to matching profile
 */
function getSectorProfile(sectorStr = '') {
  const upper = String(sectorStr).toUpperCase();
  for (const [key, profile] of Object.entries(SECTOR_PROFILES)) {
    if (upper.includes(key) || upper.includes(profile.name.toUpperCase())) {
      return profile;
    }
  }
  return SECTOR_PROFILES.DEFAULT;
}

/**
 * Calculates dynamic price change for a company
 * @param {Object} company - Mongoose Company document
 * @param {Object} marketContext - Global macro market state
 * @returns {Object} { newPrice, percentChange, trend, isCatalyst }
 */
export async function calculateCompanyPriceUpdate(company, marketContext = {}) {
  const currentPrice = Math.max(0.1, Number(company.currentPrice || 100));
  const sharesOutstanding = Math.max(100, Number(company.totalSharesOutstanding || 1000));
  const sector = getSectorProfile(company.sector);

  // 1. Order Book & Player Trading Pressure (Read from Redis)
  let buyVolume = 0;
  let sellVolume = 0;
  try {
    const buyVal = await redisClient.get(`stock:vol:buy:${company.name}`);
    const sellVal = await redisClient.get(`stock:vol:sell:${company.name}`);
    buyVolume = buyVal ? parseFloat(buyVal) : 0;
    sellVolume = sellVal ? parseFloat(sellVal) : 0;
  } catch (e) {
    // Redis fallback
  }

  const netTradeVolume = buyVolume - sellVolume;
  // Volume impact proportional to shares outstanding (clamped between -15% and +15%)
  let orderFlowImpact = 0;
  if (sharesOutstanding > 0) {
    const volumeRatio = netTradeVolume / sharesOutstanding;
    orderFlowImpact = Math.max(-0.15, Math.min(0.15, volumeRatio * 0.10));
  }

  // 2. Company Fundamentals & Work Activity Drift
  let fundamentalDrift = 0;
  const now = Date.now();
  if (company.lastWorkAt) {
    const hoursSinceWork = (now - new Date(company.lastWorkAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceWork <= 24) {
      // Actively worked on in last 24h: positive fundamental boost (+0.5% to +2.5%)
      const workBoost = Math.min(0.025, 0.005 + (company.workCount % 10) * 0.002);
      fundamentalDrift += workBoost;
    } else if (hoursSinceWork > 72) {
      // Inactive/abandoned (>3 days): operational drag (-0.5% to -1.5%)
      fundamentalDrift -= 0.01;
    }
  }

  // Stability boost for well-funded companies
  if (company.fundingRounds && company.fundingRounds.length > 0) {
    fundamentalDrift += 0.003;
  }

  // 3. Sector Macro Cycle & Market Sentiment
  const sectorSentiment = marketContext[company.sector] || (Math.sin((now / 86400000) + company.name.length) * 0.02);
  const macroDrift = sectorSentiment * sector.beta;

  // 4. Mean Reversion & Historical Baseline
  let meanReversionDrift = 0;
  if (company.last10Prices && company.last10Prices.length >= 5) {
    const avgPrice = company.last10Prices.reduce((a, b) => a + b, 0) / company.last10Prices.length;
    const deviationRatio = (currentPrice - avgPrice) / avgPrice;
    // Pull back towards mean if extended by more than 20%
    if (deviationRatio > 0.20) {
      meanReversionDrift = -0.02 * deviationRatio;
    } else if (deviationRatio < -0.20) {
      meanReversionDrift = -0.02 * deviationRatio; // Negative deviation produces positive bounce
    }
  }

  // 5. Stochastic Random Walk (Brownian Motion)
  const volatility = Math.max(0.5, (company.volatility || 1) * sector.volatility);
  // Gaussian-distributed random fluctuation
  const u1 = Math.random() || 0.001;
  const u2 = Math.random() || 0.001;
  const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const randomDrift = gaussian * (volatility * 0.02); // ~2% std dev scaled by volatility

  // 6. Aggregate Net Percentage Change
  let totalPercentChange = orderFlowImpact + fundamentalDrift + macroDrift + meanReversionDrift + randomDrift;

  // 7. Zero-Change Prevention (Guaranteed Active Market Movement)
  // Ensure minimum tick of at least ±0.6% so prices never freeze
  if (Math.abs(totalPercentChange) < 0.006) {
    const sign = totalPercentChange >= 0 ? 1 : -1;
    totalPercentChange = sign * (0.008 + Math.random() * 0.008);
  }

  // Cap max single-update move between -25% and +30%
  totalPercentChange = Math.max(-0.25, Math.min(0.30, totalPercentChange));

  // Compute final price
  let newPrice = currentPrice * (1 + totalPercentChange);
  newPrice = Math.max(0.5, Math.round(newPrice * 10) / 10);

  // If price after rounding equals old price, force at least 0.1 coin movement
  if (newPrice === currentPrice) {
    newPrice = totalPercentChange > 0 ? currentPrice + 0.1 : Math.max(0.5, currentPrice - 0.1);
    newPrice = Math.round(newPrice * 10) / 10;
  }

  const actualPercentChange = ((newPrice - currentPrice) / currentPrice) * 100;
  const trend = newPrice > currentPrice ? 'up' : (newPrice < currentPrice ? 'down' : 'stable');
  const isCatalyst = Math.abs(actualPercentChange) >= 6.0;

  return {
    oldPrice: currentPrice,
    newPrice,
    percentChange: actualPercentChange,
    trend,
    isCatalyst
  };
}

/**
 * Updates all stock prices in MongoDB and synchronizes newspaper
 */
export async function executeMarketCycle(CompanyModel) {
  try {
    const companies = await CompanyModel.find({});
    if (!companies || companies.length === 0) return;

    // Macro market state for sector correlation
    const now = Date.now();
    const marketState = {};

    for (const company of companies) {
      const update = await calculateCompanyPriceUpdate(company, marketState);

      company.currentPrice = update.newPrice;

      // Update rolling 10 prices
      company.last10Prices = company.last10Prices || [];
      company.last10Prices.push(update.newPrice);
      if (company.last10Prices.length > 10) {
        company.last10Prices.shift();
      }

      // Update extremes & market cap
      company.maxPrice = Math.max(...company.last10Prices, update.newPrice);
      company.minPrice = Math.min(...company.last10Prices, update.newPrice);
      company.trend = update.trend;
      company.marketCap = parseFloat((company.currentPrice * (company.totalSharesOutstanding || 1000)).toFixed(2));

      // Append to price history
      company.priceHistory = company.priceHistory || [];
      company.priceHistory.push({
        price: update.newPrice,
        date: new Date()
      });
      if (company.priceHistory.length > 50) {
        company.priceHistory.shift();
      }

      await company.save();

      // Reset trade volume counters in Redis for this company
      await redisClient.del(`stock:vol:buy:${company.name}`).catch(() => {});
      await redisClient.del(`stock:vol:sell:${company.name}`).catch(() => {});

      // Publish breaking news if there's significant trend movement
      if (update.isCatalyst || Math.random() < 0.35) {
        try {
          buildNews(company.name, update.trend, company.toObject());
        } catch (newsErr) {
          console.error(`[StockEngine] News build error for ${company.name}:`, newsErr);
        }
      }
    }

    console.log(`[StockEngine] ✅ Updated prices for ${companies.length} companies with active market dynamics.`);
  } catch (err) {
    console.error('[StockEngine] Error during market cycle:', err);
  }
}
