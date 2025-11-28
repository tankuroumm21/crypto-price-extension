import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Create dist directory if it doesn't exist
const distDir = join(rootDir, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
copyFileSync(
  join(rootDir, 'manifest.json'),
  join(distDir, 'manifest.json')
);

// Copy icons directory
import { cpSync } from 'fs';
const iconsDir = join(rootDir, 'icons');
const distIconsDir = join(distDir, 'icons');
if (existsSync(iconsDir)) {
  cpSync(iconsDir, distIconsDir, { recursive: true });
}

console.log('Manifest and icons copied to dist/');

