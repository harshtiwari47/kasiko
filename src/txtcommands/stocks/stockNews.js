import {
  Helper
} from '../../../helper.js';

import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname); // Get the directory of the current filter
const newsDatabasePath = path.join(__dirname, 'news.json');

function replacePlaceholders(companyName, news, companyStock) {
  let updatedNews = JSON.stringify(news);
  updatedNews = updatedNews.replace(/__([^_]+)__/g, (_, placeholder) => {
    let data;
    if (companyStock[placeholder] !== undefined) {
      if (placeholder === "currentPrice" || placeholder === "marketCap") {
        data = `<:kasiko_coin:1300141236841086977> ${companyStock[placeholder]}`;
      } else {
        data = `${companyStock[placeholder]}`;
      }
    } else if (placeholder.includes("maxmin")) {
      const index = parseInt(placeholder.split("[")[1].split("]")[0], 10);
      data = `<:kasiko_coin:1300141236841086977> **${companyStock["maxmin"][index]}`;
    } else if (placeholder === "companyName") {
      data = `${companyName}`
    } else {
      data = `__${placeholder}__`;
    }

    return data;
  });

  return JSON.parse(updatedNews);
}

export function buildNews(companyName, type, stockData) {
  const allNewsData = Helper.newsDatabase();
  let newspaper = fs.readFileSync(newsDatabasePath,
    'utf-8');
  newspaper = JSON.parse(newspaper);


  if (allNewsData) {
    if (!(type === "" || type === "up" || type === "down")) return {}

    let reqTypeNews = allNewsData.filter(news => news.stat === type);
    const randomIndex = Math.floor(Math.random() * reqTypeNews.length);

    newspaper.push(replacePlaceholders(companyName, reqTypeNews[randomIndex], stockData));

    if (newspaper.length > 3) {
      newspaper.shift(); // Remove the oldest price
    }

    fs.writeFileSync(newsDatabasePath, JSON.stringify(newspaper, null, 2));
  }
}

export function currentNewspaper() {
  let newspaper = fs.readFileSync(newsDatabasePath, 'utf-8');
  newspaper = JSON.parse(newspaper);

  return newspaper;
}