import redisClient from '../../../redis.js';
import { buildNews } from './stockNews.js';

export const MAX_STOCK_PRICE = 25000;
export const MIN_STOCK_PRICE = 0.5;

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
  const currentPrice = Math.max(MIN_STOCK_PRICE, Number(company.currentPrice || 100));
  const sharesOutstanding = Math.max(100, Number(company.totalSharesOutstanding || 1000));
  const sector = getSectorProfile(company.sector);

  // ── 1. CEILING RESISTANCE & OVERBOUGHT CORRECTION (Cap at 25,000) ──
  // If price is already at or above 25,000, trigger an immediate resistance hit (not very high: -8% to -18%)
  if (currentPrice >= MAX_STOCK_PRICE) {
    const hitPct = 0.08 + Math.random() * 0.10; // -8% to -18% correction
    let newPrice = Math.round(MAX_STOCK_PRICE * (1 - hitPct) * 10) / 10;
    newPrice = Math.min(MAX_STOCK_PRICE, Math.max(MIN_STOCK_PRICE, newPrice));
    const actualPercentChange = ((newPrice - currentPrice) / currentPrice) * 100;

    return {
      oldPrice: currentPrice,
      newPrice,
      percentChange: actualPercentChange,
      trend: 'down',
      isCatalyst: true
    };
  }

  // ── 2. ORDER BOOK / TRADING PRESSURE (From Redis) ──
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
  let orderFlowImpact = 0;
  if (sharesOutstanding > 0) {
    const volumeRatio = netTradeVolume / sharesOutstanding;
    orderFlowImpact = Math.max(-0.12, Math.min(0.15, volumeRatio * 0.10));
  }

  // ── 3. FUNDAMENTAL ACTIVITY (Positive Boost for active work, neutral for inactive) ──
  let fundamentalDrift = 0;
  const now = Date.now();
  if (company.lastWorkAt) {
    const hoursSinceWork = (now - new Date(company.lastWorkAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceWork <= 24) {
      // Actively worked on: positive fundamental boost (+0.5% to +2.5%)
      const workBoost = Math.min(0.025, 0.005 + (company.workCount % 10) * 0.002);
      fundamentalDrift += workBoost;
    }
    // Note: Inactive companies do NOT suffer continuous negative drag anymore,
    // which previously dragged all stock prices down below $5!
  }

  if (company.fundingRounds && company.fundingRounds.length > 0) {
    fundamentalDrift += 0.003;
  }

  // ── 4. MACRO / SECTOR ROTATION CYCLE ──
  const sectorSentiment = marketContext[company.sector] !== undefined
    ? marketContext[company.sector]
    : (Math.sin((now / (86400000 * 2)) + company.name.length) * 0.025);
  const macroDrift = sectorSentiment * sector.beta;

  // ── 5. ASYMMETRIC LOW-PRICE VALUE SURGE / PENNY STOCK REBOUND (< $5 & < $15) ──
  let valueReboundDrift = 0;
  if (currentPrice < 5.0) {
    // Deep Value / Short Squeeze zone: 75% chance of aggressive upward rally
    if (Math.random() < 0.75) {
      valueReboundDrift = 0.15 + Math.random() * 0.25; // +15% to +40% surge
    } else {
      valueReboundDrift = -0.05 + Math.random() * 0.10; // -5% to +5% consolidation
    }
  } else if (currentPrice < 15.0) {
    // Value accumulation zone (< $15): 65% chance of upward lift
    if (Math.random() < 0.65) {
      valueReboundDrift = 0.06 + Math.random() * 0.15; // +6% to +21% lift
    } else {
      valueReboundDrift = -0.06 + Math.random() * 0.08;
    }
  } else if (currentPrice > 20000) {
    // Upper resistance zone ($20k - $25k): institutional profit taking
    valueReboundDrift = -0.04 + (Math.random() * 0.06 - 0.03); // -7% to -1%
  }

  // ── 6. PROPER STOCHASTIC RANDOM WALK (Gaussian with healthy volatility) ──
  const volatility = Math.max(0.8, (company.volatility || 1) * sector.volatility);
  const u1 = Math.random() || 0.001;
  const u2 = Math.random() || 0.001;
  const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const randomDrift = gaussian * (volatility * 0.045); // ~4.5% std dev for lively, realistic fluctuations

  // ── 7. RANDOM COMPANY CATALYSTS (12% chance of breaking market event) ──
  let catalystDrift = 0;
  if (Math.random() < 0.12) {
    const isBullish = Math.random() < 0.58;
    catalystDrift = isBullish
      ? (0.08 + Math.random() * 0.14)  // +8% to +22% catalyst pop
      : -(0.06 + Math.random() * 0.12); // -6% to -18% catalyst dip
  }

  // ── 8. AGGREGATE NET PERCENTAGE CHANGE ──
  let totalPercentChange = orderFlowImpact + fundamentalDrift + macroDrift + valueReboundDrift + randomDrift + catalystDrift;

  // Ensure minimum tick of at least ±1.0% so prices never freeze
  if (Math.abs(totalPercentChange) < 0.01) {
    const sign = totalPercentChange >= 0 ? 1 : -1;
    totalPercentChange = sign * (0.015 + Math.random() * 0.015);
  }

  // Cap single-cycle move between -25% and +40%
  totalPercentChange = Math.max(-0.25, Math.min(0.40, totalPercentChange));

  // Compute final price
  let newPrice = currentPrice * (1 + totalPercentChange);
  newPrice = Math.round(newPrice * 10) / 10;

  // If price after rounding equals old price, force meaningful movement
  if (newPrice === currentPrice) {
    if (currentPrice < 5.0) {
      newPrice = Math.round((currentPrice + 0.3 + Math.random() * 0.6) * 10) / 10;
    } else {
      const step = totalPercentChange >= 0 ? 0.2 : -0.2;
      newPrice = Math.max(MIN_STOCK_PRICE, Math.round((currentPrice + step) * 10) / 10);
    }
  }

  // ── 9. STRICT CEILING ENFORCEMENT (<= 25,000) ──
  // If calculation exceeds 25,000, trigger a random resistance hit (not very high)
  if (newPrice > MAX_STOCK_PRICE) {
    const hitPct = 0.08 + Math.random() * 0.10; // -8% to -18%
    newPrice = Math.round(MAX_STOCK_PRICE * (1 - hitPct) * 10) / 10;
  }
  newPrice = Math.min(MAX_STOCK_PRICE, Math.max(MIN_STOCK_PRICE, newPrice));

  const actualPercentChange = ((newPrice - currentPrice) / currentPrice) * 100;
  const trend = newPrice > currentPrice ? 'up' : (newPrice < currentPrice ? 'down' : 'stable');
  const isCatalyst = Math.abs(actualPercentChange) >= 7.0;

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
      // If an existing company in DB is already above 25,000, immediately hit it down below 25k
      if (company.currentPrice > MAX_STOCK_PRICE) {
        const hitPct = 0.08 + Math.random() * 0.10;
        company.currentPrice = Math.min(MAX_STOCK_PRICE, Math.round(MAX_STOCK_PRICE * (1 - hitPct) * 10) / 10);
      }

      // If an existing company in DB is severely depressed (< 2.0), give it an initial jump-start
      if (company.currentPrice < 2.0) {
        company.currentPrice = Math.round((company.currentPrice * (1.35 + Math.random() * 0.35) + 1.0) * 10) / 10;
      }

      const update = await calculateCompanyPriceUpdate(company, marketState);

      company.currentPrice = update.newPrice;

      // Update rolling 10 prices
      company.last10Prices = company.last10Prices || [];
      company.last10Prices.push(update.newPrice);
      if (company.last10Prices.length > 10) {
        company.last10Prices.shift();
      }

      // Update extremes & market cap
      company.maxPrice = Math.min(MAX_STOCK_PRICE, Math.max(...company.last10Prices, update.newPrice));
      company.minPrice = Math.max(MIN_STOCK_PRICE, Math.min(...company.last10Prices, update.newPrice));
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

    console.log(`[StockEngine] ✅ Updated prices for ${companies.length} companies with active market dynamics (Cap: ${MAX_STOCK_PRICE}).`);
  } catch (err) {
    console.error('[StockEngine] Error during market cycle:', err);
  }
}
