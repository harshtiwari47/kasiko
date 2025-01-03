import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let allJewelry = [];

/**
 * Because ESM modules might not have __dirname by default, we can fix that:
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadJewelryData() {
  let allJewelry = [];
  const filePath = path.join(__dirname, 'data', '../../../../data/jewelry.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  allJewelry = [
    ...data.rings,
    ...data.necklaces,
    ...data.watches,
    ...data.strips
  ];
  return allJewelry;
}

export function getAllJewelry() {
  return loadJewelryData();
}