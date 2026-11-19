/* Leonida Trophy Guide — entrypoint.
   Copies app/ and screenshots/ from this repository into the output
   directory and writes /output/dossier.json with buildDossier from the
   kit's vendor library. The output directory itself is never removed:
   on the grader it is a mounted volume, so only its contents are emptied.
   Runs deterministically: two runs write the same bytes. */

import { buildDossier } from './vendor/makefun-frontend.ts';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const child of readdirSync(dir)) {
    rmSync(join(dir, child), { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const child of readdirSync(src)) {
    const from = join(src, child);
    const to = join(dest, child);
    const st = statSync(from);
    if (st.isDirectory()) {
      copyTree(from, to);
    } else if (st.isFile()) {
      copyFileSync(from, to);
    } else {
      throw new Error(`main.ts: refusing to copy non-regular entry ${from}`);
    }
  }
}

function main(): void {
  const appSrc = join(REPO_ROOT, 'app');
  const shotsSrc = join(REPO_ROOT, 'screenshots');
  if (!existsSync(appSrc)) throw new Error('main.ts: app/ is missing from the repository');
  if (!existsSync(shotsSrc)) throw new Error('main.ts: screenshots/ is missing from the repository');

  emptyContents(OUT_DIR);
  copyTree(appSrc, join(OUT_DIR, 'app'));
  copyTree(shotsSrc, join(OUT_DIR, 'screenshots'));

  const dossier = buildDossier(OUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
}

main();
