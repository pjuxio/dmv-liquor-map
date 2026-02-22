# Claude AI Context — DMV Liquor Map

## Project Overview

Interactive web map showing liquor store locations in the DMV area (D.C., Maryland, Virginia) with demographic census data overlays. Node.js/Express backend with PostgreSQL database, deployed on Heroku.

## Architecture

**Backend**: Node.js + Express serving API endpoints and static files  
**Database**: PostgreSQL storing liquor store data  
**Frontend**: Single HTML file with Leaflet.js, fetches store data from API

### Key Files
- `server.js` — Express server with /api/stores endpoint
- `public/index.html` — Frontend map application
- `scripts/migrate.js` — Database schema creation
- `scripts/seed.js` — CSV import to PostgreSQL

### External Dependencies (CDN)
- Leaflet 1.9.4 — map rendering
- Leaflet.markercluster 1.5.3 — marker clustering
- Turf.js 6 — spatial operations (point-in-polygon)

### External APIs (fetched at runtime)
- **Census TIGERweb**: County boundaries and census tract polygons
- **Census ACS API**: Demographic data (income, race, age) by tract

## Database Schema

```sql
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  address TEXT,
  zip VARCHAR(20),
  city VARCHAR(255),
  rating DECIMAL(2,1),
  user_ratings_total INTEGER,
  business_status VARCHAR(50),
  lat DECIMAL(12,8) NOT NULL,
  lng DECIMAL(12,8) NOT NULL,
  types TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/stores` — Returns all store data as JSON
- `GET /api/stores/count` — Returns total store count
- `GET /health` — Health check with database status

## Key Code Sections (public/index.html)

### Map Setup (lines 180-210)
- Creates Leaflet map centered on D.C.
- Custom panes: `choropleth` (z-index 350), `markerTop` (z-index 650)
- CartoDB Positron basemap

### Store Data Loading (lines 200-230)
- Fetches from `/api/stores` API endpoint
- Creates clustered markers with popups
- Exports store coordinates via Promise for spatial join

### Demographic Data (lines 270-320)
- Fetches tract geometries from TIGERweb
- Fetches ACS data for MD, VA, DC (separate queries)
- Joins demographics to tract features by GEOID

### Spatial Analysis (lines 320-340)
- Uses Turf.js `booleanPointInPolygon` to count stores per tract
- Calculates outlet density (stores per 1,000 residents)

### Choropleth Layers (lines 230-270)
Color scales use ColorBrewer palettes:
- Income: Greens (`#edf8e9` → `#006d2c`)
- % Black: Purples (`#f2f0f7` → `#54278f`)
- Age: Oranges (`#feedde` → `#a63603`)
- Density: Reds (`#fff5f0` → `#a50f15`)

### UI Controls (lines 360-480)
- Radio button layer switcher (top-right)
- Dynamic legend (bottom-right)
- Modal dialogs for About/Sources

## Data Files

### `source/dmv_merged.csv`
665 liquor store records with columns:
- `place_id`, `name`, `address`, `zip`, `city`
- `rating`, `user_ratings_total`, `business_status`
- `lat`, `lng`, `types`

## Common Tasks

### Adding a new store
1. Add row to `dmv_merged.csv` with lat/lng coordinates
2. Re-run `npm run db:seed` to update database

### Adding a new API endpoint
Add route in `server.js` using the `pool.query()` pattern.

### Adding a new demographic layer
1. Add color scale function (e.g., `newMetricColor()`)
2. Add ACS variable to API queries
3. Create layer in `buildLayers()` using `makeLayer()`
4. Add radio option in `DemoControl`
5. Add legend config in `legendConfigs`

### Changing geographic coverage
Modify WHERE clauses in:
- County borders fetch (line ~230)
- `TRACT_URL` (line ~275)
- ACS API queries (lines ~280-282)

## Deployment

### Heroku Commands
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
git push heroku main
heroku run npm run db:setup
```

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Heroku)
- `NODE_ENV` — development or production
- `PORT` — Server port (auto-set by Heroku)

## Notes

- All map layers use `interactive: false` to allow marker clicks through choropleth
- Store markers always render above choropleth via custom panes
- ACS API requires separate queries per state
- GEOID format: state (2) + county (3) + tract (6) = 11 digits
- Database uses SSL in production mode
