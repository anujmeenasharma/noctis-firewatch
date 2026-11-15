# NOCTIS FireWatch — India

Live fire map, fire seasons and the MODIS ↔ VIIRS harmonization problem, explained for everyone.
Built on NASA FIRMS data for the NASA Space Apps Challenge (Harmonization of MODIS and VIIRS hot spots).

## Run it

```bash
npm install
npm run dev        # http://localhost:3300
```

## Refresh the data

The archive (2018–2025) is built from NASA FIRMS yearly country files for India.

1. Download the files into a folder (no account needed):
   `https://firms.modaps.eosdis.nasa.gov/data/country/<product>/<year>/<product>_<year>_India.csv`
   for product = `modis`, `viirs-snpp`, `viirs-jpss1` and year = 2018 … 2025.
2. Build:
   ```bash
   node scripts/build-data.mjs /path/to/that/folder
   ```
   This writes `public/data/*.json`, the state lookup in `src/lib/`, and a snapshot of the live feed.

The live map needs no build step: `/api/live` reads NASA's public 7-day South Asia feeds on the server
(cached 30 min) and falls back to `public/data/live-snapshot.json` if NASA can't be reached.

## What's on the page

| Section | Question it answers |
|---|---|
| Live fire map | Where is India burning this week? |
| Near me | Is there fire near a city / my location, and what should I do? |
| Fire seasons | When does each state burn? (calendar + month-by-month map) |
| Trends | Is it getting better or worse, by season and state? |
| Satellites | Why MODIS and VIIRS counts differ + a converter between them |
| Solutions | Practical steps for farmers, citizens, officials, researchers (sourced) |
| Data & method | Sources, processing steps, downloads, caveats |

## Notes
- Only vegetation fires (FIRMS type 0) are counted; static industrial heat sources are removed.
- A detection is one hot pixel at one satellite pass — not the same as one fire.
- Exploratory tool, not an official fire record.
