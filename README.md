# VinylVault

A vinyl record collection manager powered by the Discogs API. All record data comes from Discogs — the database only stores what users own, want, and sell.

CSCI-300 Database Design & Management — NYIT, Spring 2026

## How It Works

1. **Search Discogs** — Search 16M+ releases from the world's largest music database
2. **Add to Collection** — Import any release with cover art, tracklist, credits, and community stats
3. **Track Value** — Monitor purchase price vs current value across your collection
4. **Sell on Marketplace** — List records from your collection for other users to buy
5. **Analytics** — View genre distribution, decade breakdown, and most valuable records

## Features

- Full Discogs API integration (search, release details, artist profiles, label catalogs, master releases, marketplace pricing)
- Cover art and tracklists on every record
- Community have/want counts and ratings
- Wishlist directly from Discogs search results
- One-click import with condition grading and price tracking
- User authentication with JWT

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | MySQL 8.0 |
| Backend | Node.js + Express |
| Frontend | React + Vite + Recharts |
| Data Source | Discogs REST API |
| Auth | JWT + bcrypt |

## Setup

```bash
# 1. Database
mysql -u root -p < database/schema.sql

# 2. Backend
cd backend
cp .env.example .env   # Set DB_PASSWORD
npm install
npm start              # http://localhost:5001

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## API Endpoints

### Discogs (all data from Discogs API)
- `GET /api/discogs/search` — Search releases, artists, labels
- `GET /api/discogs/release/:id` — Full release details with tracklist, credits, videos
- `GET /api/discogs/artist/:id` — Artist profile and discography
- `GET /api/discogs/label/:id` — Label details and catalog
- `GET /api/discogs/master/:id` — Master release and all pressings
- `GET /api/discogs/pricing/:id` — Marketplace price suggestions
- `POST /api/discogs/import/:id` — Import release to local DB + add to collection

### User Data (stored locally)
- `POST /api/auth/register|login` — Authentication
- `GET/POST/PUT/DELETE /api/collection` — Manage collection
- `GET/POST/DELETE /api/collection/wishlist` — Manage wishlist
- `GET/POST /api/marketplace` — Browse and create listings
- `PUT /api/marketplace/:id/buy|complete|cancel` — Trade actions
- `GET /api/analytics/*` — Collection analytics

## Database Schema

| Table | Purpose |
|-------|---------|
| users | Registered collectors |
| records | Imported from Discogs (only records users have added) |
| tracklists | Track listings per record |
| record_genres | Genre associations |
| collection_items | What each user owns (condition, price, value) |
| wishlists | Records users want (can reference Discogs directly) |
| marketplace | Active sale listings |
| condition_types | Goldmine grading scale |
| genres | Music genre lookup |

## Team

| Member | Role |
|--------|------|
| TBD | TBD |
