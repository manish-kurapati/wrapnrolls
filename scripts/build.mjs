import { build } from 'esbuild';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
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

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
 if (entry.isFile() && /\.(html|png|ico|webmanifest)$/.test(entry.name)) {
  await cp(path.join(root, entry.name), path.join(output, entry.name));
 }
}
console.log('Built static website in public/');
