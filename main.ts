/* Leonida Trophy Atlas — entrypoint.
 *
 * Copies the static app (app/) and the screenshots (screenshots/) into the
 * output directory, then writes dossier.json with the kit's buildDossier.
 * Deterministic: running twice produces identical bytes.
 *
 * Node 22 stdlib only. Run with:
 *   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
 * (or leave MAKEFUN_OUTPUT_DIR unset to write to /output, the grader default)
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

/* Empty the output directory's CONTENTS only — never remove the directory
 * itself: on the grader /output is a mount point and removing it fails. */
function emptyDirContents(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    rmSync(join(dir, entry.name), { recursive: true, force: true });
  }
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  emptyDirContents(OUT_DIR);

  cpSync(join(REPO_ROOT, 'app'), join(OUT_DIR, 'app'), { recursive: true });

  const screenshotsDir = join(REPO_ROOT, 'screenshots');
  if (existsSync(screenshotsDir)) {
    cpSync(screenshotsDir, join(OUT_DIR, 'screenshots'), { recursive: true });
  }

  /* Caps from this bounty's RULES.txt. */
  const dossier = buildDossier(OUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier, 'utf8');
  console.log('Wrote dossier.json to ' + OUT_DIR);
}

main();
