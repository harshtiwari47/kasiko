import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GlobalFonts } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fontsRegistered = false;

export function registerGlobalFonts() {
  if (fontsRegistered) return;

  const fontCandidates = [
    { file: path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'), family: 'Roboto' },
    { file: path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'), family: 'Roboto' },
    { file: path.join(__dirname, '../src/txtcommands/wildlife/fonts/Roboto-Bold.ttf'), family: 'Roboto' },
    { file: path.join(__dirname, '../src/txtcommands/wildlife/fonts/Roboto-Regular.ttf'), family: 'Roboto' },
  ];

  for (const item of fontCandidates) {
    if (fs.existsSync(item.file)) {
      try {
        GlobalFonts.registerFromPath(item.file, item.family);
      } catch (e) {
        console.warn(`[CanvasFont] Could not register font ${item.file}:`, e.message);
      }
    }
  }

  fontsRegistered = true;
}

registerGlobalFonts();
export default registerGlobalFonts;
