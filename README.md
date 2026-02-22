# DMV Liquor Store Map

An interactive web map visualizing liquor store locations across the greater Washington D.C., Maryland, and Virginia (DMV) area, combined with demographic census data overlays.

## Features

- **Interactive Map**: Leaflet-based map with marker clustering for 665+ liquor store locations
- **Demographic Overlays**: Toggle between census tract choropleth layers:
  - Median Household Income
  - % Black or African American Population
  - Median Age
  - Liquor Store Density (outlets per 1,000 residents)
- **Store Information**: Click markers to view store name, address, rating, and Google Maps link
- **Dynamic Legend**: Context-aware legend updates based on selected overlay

## Geographic Coverage

- **Maryland**: Prince George's County, Montgomery County
- **Virginia**: Arlington County, Fairfax County, Loudoun County, City of Fairfax, Falls Church City
- **Washington D.C.**

## Tech Stack

- **Node.js + Express** — Backend server
- **PostgreSQL** — Database for store data
- **Leaflet.js** — Interactive mapping
- **Leaflet.markercluster** — Marker clustering for performance
- **Turf.js** — Spatial analysis (point-in-polygon for density calculations)
- **Census APIs** — Real-time demographic data fetching

## Project Structure

```
dmv-liquor-map/
├── server.js           # Express server with API endpoints
├── package.json        # Dependencies and scripts
├── Procfile            # Heroku deployment config
├── public/
│   └── index.html      # Frontend application
├── scripts/
│   ├── migrate.js      # Database schema migration
│   └── seed.js         # CSV import to PostgreSQL
└── source/
    └── dmv_merged.csv  # Liquor store dataset (665 locations)
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database:
   ```bash
   createdb dmv_liquor_map
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

5. Run database setup:
   ```bash
   npm run db:setup
   ```

6. Start the server:
   ```bash
   npm start
   ```

7. Open http://localhost:3000

## Heroku Deployment

1. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Add PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

4. Run database setup:
   ```bash
   heroku run npm run db:setup
   ```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stores` | Returns all liquor store data |
| `GET /api/stores/count` | Returns total store count |
| `GET /health` | Health check (database connectivity) |

## Data Sources

### Liquor Store Locations
- Virginia ABC, Montgomery County ABS
- Google Places API (names, addresses, ratings)

### Demographics
- U.S. Census Bureau — American Community Survey (ACS) 5-Year Estimates, 2022
- Variables: median household income (B19013), race (B02001), median age (B01002)

### Geographic Boundaries
- U.S. Census Bureau TIGERweb — county boundaries and census tract polygons

### Basemap
- CartoDB Positron — © OpenStreetMap contributors, © CARTO

## Database Schema

### stores table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| place_id | VARCHAR(255) | Unique identifier |
| name | VARCHAR(500) | Store name |
| address | TEXT | Full address |
| zip | VARCHAR(20) | ZIP code |
| city | VARCHAR(255) | City name |
| rating | DECIMAL(2,1) | Google rating (1-5) |
| user_ratings_total | INTEGER | Number of reviews |
| business_status | VARCHAR(50) | OPERATIONAL or CLOSED_TEMPORARILY |
| lat | DECIMAL(12,8) | Latitude |
| lng | DECIMAL(12,8) | Longitude |
| types | TEXT | Business type categories |

## License

Created by [PJUX.io](https://pjux.io)
