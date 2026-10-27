import { build } from 'esbuild';
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const localEnv = path.join(root, '.env.local');
if (existsSync(localEnv) && process.loadEnvFile) process.loadEnvFile(localEnv);
const output = path.resolve(root, 'public');
// Only clean the generated public folder inside this repository.
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'public') {
 throw new Error('Invalid build output directory');
}

await build({
 entryPoints: [path.join(root, 'src/page-waves.js')],
 bundle: true,
 minify: true,
 format: 'iife',
 outfile: path.join(root, 'assets/page-waves.js')
});

for (const entry of ['storefront', 'admin', 'order']) {
 await build({
  entryPoints: [path.join(root, `src/${entry}.js`)],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: path.join(root, `assets/${entry}.js`)
 });
}

const publicConfig = {
 supabaseUrl: process.env.SUPABASE_URL || '',
 supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
};
await writeFile(path.join(root, 'assets/config.js'), `window.WRAP_CONFIG = ${JSON.stringify(publicConfig)};\n`);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
 if (entry.isFile() && /\.(html|png|ico|webmanifest)$/.test(entry.name)) {
  await cp(path.join(root, entry.name), path.join(output, entry.name));
 }
}
console.log('Built static website in public/');
