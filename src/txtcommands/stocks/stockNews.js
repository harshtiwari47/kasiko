import { Helper } from '../../../helper.js';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get current directory
const newsDatabasePath = path.join(__dirname, 'news.json');

/**
 * replacePlaceholders:
 * Replaces placeholders in the provided news JSON (as a string) with values from the companyData object.
 * Placeholders like __currentPrice__, __marketCap__, __maxPrice__, __minPrice__, and __companyName__ are replaced.
 */
function replacePlaceholders(companyName, news, companyData) {
  let updatedNews = JSON.stringify(news);
  updatedNews = updatedNews.replace(/__([^_]+)__/g, (_, placeholder) => {
    let data;
    if (companyData[placeholder] !== undefined) {
      // Format certain properties with a coin emoji.
      if (placeholder === "currentPrice" || placeholder === "marketCap") {
        data = `<:kasiko_coin:1300141236841086977> ${companyData[placeholder]}`;
      } else {
        data = `${companyData[placeholder]}`;
      }
    } else if (placeholder === "maxPrice") {
      data = `<:kasiko_coin:1300141236841086977> ${companyData.maxPrice}`;
    } else if (placeholder === "minPrice") {
      data = `<:kasiko_coin:1300141236841086977> ${companyData.minPrice}`;
    } else if (placeholder === "companyName") {
      data = `${companyName}`;
    } else {
      data = `__${placeholder}__`;
    }
    return data;
  });
  return JSON.parse(updatedNews);
}

/**
 * buildNews:
 * This function retrieves all news from the helper's database, filters by the provided type (either "", "up", or "down"),
 * selects one at random, replaces placeholders using the provided companyData, and then appends it to a persistent newspaper
 * (stored in news.json). The newspaper is limited to 3 entries.
 *
 * @param {String} companyName - The name of the company.
 * @param {String} type - The news type (e.g., "", "up", "down").
 * @param {Object} companyData - A Company document containing properties like currentPrice, marketCap, etc.
 */
export function buildNews(companyName, type, companyData) {
  const allNewsData = Helper.newsDatabase();
  let newspaper = fs.readFileSync(newsDatabasePath, 'utf-8');
  newspaper = JSON.parse(newspaper);

  if (allNewsData) {
    // Allow only "" or "up" or "down" for news type.
    if (!(type === "" || type === "up" || type === "down")) return {};
    
    const reqTypeNews = allNewsData.filter(news => news.stat === type);
    if (reqTypeNews.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * reqTypeNews.length);
    newspaper.push(replacePlaceholders(companyName, reqTypeNews[randomIndex], companyData));

    // Limit newspaper to 3 entries.
    if (newspaper.length > 3) {
      newspaper.shift(); // Remove the oldest entry.
    }
    fs.writeFileSync(newsDatabasePath, JSON.stringify(newspaper, null, 2));
  }
}

/**
 * currentNewspaper:
 * Reads and returns the current newspaper (an array of news items) from the news.json file.
 */
export function currentNewspaper() {
  let newspaper = fs.readFileSync(newsDatabasePath, 'utf-8');
  newspaper = JSON.parse(newspaper);
  return newspaper;
}