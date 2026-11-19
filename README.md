# Leonida Trophy Guide — GTA VI (PS5)

[![GTA VI](https://img.shields.io/badge/game-GTA%20VI-ff5da2)](https://make.fun/c/gta6-trophy-guide-01)
[![Trophies](https://img.shields.io/badge/trophies-55%20%7C%201%20%E2%98%85%202%20gold%206%20silver-39d5e8)](https://make.fun/c/gta6-trophy-guide-01)
[![Offline](https://img.shields.io/badge/offline-static%20app-5ee6a8)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies on PlayStation 5** — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden until earned. Built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Every trophy, officially listed** — names, descriptions and grades as PlayStation publishes them (cross-checked by Exophase and PSNProfiles), with a guide in our own words and the source beside it.
- **Tracker** — tick trophies off as you earn them; progress saves in `localStorage`, and can be exported to a file and imported back.
- **Filters** — story, missable, collectibles, activities, crime, exploration, completion, online (there are none — all 55 are single-player), plus grade, earned/not-earned and text search.
- **Spoiler setting** — hides the names and descriptions of story trophies until you earn them.
- **Platinum roadmap** — five stages in order, built from the official descriptions: chapter saves, the one missable moment, stranger strands, the free-roam grind, then the 100% checklist.
- **Missable flags** — one trophy is reported as potentially missable: **Positive Mental Attitude** (Lucia's Chapter 1 balcony meditation). Five trophies have no confirmed trigger yet at launch, and the guide says so instead of guessing.
- **Fully offline** — static files under `app/`, no build step, no network requests. Open `app/index.html` from any static server.

## Run it

```sh
# serve app/ and open it
python3 -m http.server 8080 --directory app
# then open http://localhost:8080
```

Or hand it in the way the bounty expects:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

## Layout

- `app/index.html` — the page
- `app/style.css` — the look (our own; no Rockstar artwork, logos or game screenshots)
- `app/app.js` — tracker logic: checklist, filters, spoiler mode, export/import
- `app/data/trophies.json` — the 55 trophies with guides, sources, kinds, roadmap stages
- `main.ts` — entrypoint: copies the app and writes the dossier
- `vendor/makefun-frontend.ts` — the kit's library, unchanged
- `screenshots/` — real renders of the app in a browser

## Sources

Trophy list: Exophase / PSNProfiles via PlanetGTA6 (18 Nov 2026). Guides draw on PowerPyx, Output Lag, KeenGamer, HowToVideoGame, Sportskeeda, The Gamers Hub, GTAVibes, GTA Zone and EGamers — each trophy names its sources beside its guide. Guide text is written for this page; nothing is copied from another guide.

Unofficial fan guide. Not affiliated with, endorsed by or connected to Rockstar Games, Take-Two Interactive, Sony or PlayStation.

## License

MIT — see [LICENSE](LICENSE).
