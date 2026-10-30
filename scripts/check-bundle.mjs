// Fails the build if a package the app must not ship reaches the bundle.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ASSETS = 'dist/assets';
const BANNED = [
  'reown',
  'walletconnect',
  'appkit',
  '@hot-wallet',
  'near-api',
  '@near-js',
  'coinbase',
  '@solana',
];

const matches = [];
const files = await readdir(ASSETS, { recursive: true, withFileTypes: true });
for (const file of files.filter((entry) => entry.isFile())) {
  const path = join(file.parentPath, file.name);
  const text = (await readFile(path, 'utf8')).toLowerCase();
  for (const name of BANNED) {
    if (text.includes(name)) matches.push(`${name} in ${path}`);
  }
}

if (matches.length > 0) {
  console.error('Bundle check failed:');
  for (const match of matches) console.error(`  ${match}`);
  process.exit(1);
}
console.log(`Bundle check passed: ${files.length} files, no banned names.`);
