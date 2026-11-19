# Leonida Trophy Atlas — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sintaameliaa-mee/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sintaameliaa-mee/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft
Auto VI** — 1 platinum, 2 gold, 6 silver, 46 bronze. Built for the
[make.fun bounty gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Every trophy** with its official name, description and grade exactly as
  PlayStation publishes them, plus a guide in our own words for each one, with
  named and linked sources beside it.
- **Tracker**: tick trophies off as you earn them; progress is saved in the
  browser (localStorage), and can be exported to a file and imported back.
- **Filters** by kind (story, missable, collectibles, activities, online),
  by grade, and by roadmap stage, plus full-text search.
- **Spoiler setting**: hides the names and descriptions of story trophies
  until you mark them earned — safe to browse mid-playthrough.
- **Platinum roadmap**: three stages (Story → 100% checklist → Cleanup) with
  the order to earn trophies in, built from the official descriptions and the
  launch-era guides, including the one potentially missable trophy
  (Positive Mental Attitude, Chapter 1) and the no-mission-replay warning.
- **Fully offline**: static files under `app/`, no build step, no network
  request at run time. Serve `app/` with any static server and open
  `index.html`.

## Run it

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

## How it is handed in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-frontend.ts` (the kit's copy, unchanged):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Trophy names, descriptions and grades are the official list as published by
PlayStation, as listed by Exophase and PSNProfiles. Guides are written in our
own words from launch-era guides: PowerPyx, GTABase, KeenGamer, Output Lag,
Planet GTA 6, CryptoGames, EGamers and GTA Vibes — each guide names its
sources, and every source is linked beside the guide it supports. Where a
method was still unconfirmed at launch, the guide says so instead of guessing.

## Notes

- Unofficial fan guide. Not affiliated with Rockstar Games, Take-Two
  Interactive, Sony or PlayStation. No Rockstar logo, official artwork, box
  art or game screenshots are used anywhere in the app or its screenshots;
  the look is our own.
- All 55 trophies unlock in single player; there are no online trophies, no
  difficulty trophies and no mission medals. Estimated platinum time is
  around 200 hours (PowerPyx, GTABase).
- Cheats disable trophies and saving on a trophy run (PowerPyx, GTABase) —
  keep them off your trophy save.

## License

MIT — see [LICENSE](LICENSE).
