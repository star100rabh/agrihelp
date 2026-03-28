# KisanSahayak (MERN JavaScript)

KisanSahayak is a MERN-style JavaScript platform for agricultural scheme assistance with:

- **Web dashboard for smartphone users**
- **AI voice-call workflow for keypad/low-proficiency users**
- **Scheme filtering based on farmer survey data**
- **Application tracking and call-followup logs**

The UI is designed to match the provided dashboard style:

- Overview
- My Schemes
- AI Voice
- Tracking

## Project structure

```txt
.
├── client/   # React + Vite frontend (JavaScript)
└── server/   # Node.js + Express + Mongo-ready backend
```

## Features implemented

### Farmer survey profile inputs used for filtering

- name
- phone number
- aadhar (optional)
- land area (hectares)
- location (state/district)
- caste
- crop types
- annual income
- previously allotted schemes
- smartphone/keypad usage and smartphone proficiency

### Scheme eligibility and prioritization

Backend service scores and prioritizes schemes using:

- land area range
- income range
- location checks
- caste constraints
- crop tags overlap
- phone type fit
- scheme priority weight

### Dashboard tabs

- **Overview**: top prioritized schemes + action-required alert
- **My Schemes**: required docs, apply link, CSC guidance
- **AI Voice**: outbound call action + call activity log
- **Tracking**: application timeline and receipt download row

### AI call assistant workflow support

APIs and data model support:

- queueing keypad/low-proficiency users
- logging outbound/follow-up calls
- storing farmer response summary
- collecting application number for follow-up tracking

## API endpoints

Base URL: `http://localhost:5000/api`

- `GET /health`
- `GET /farmers`
- `GET /dashboard/:farmerId`
- `GET /farmers/:farmerId/schemes`
- `GET /farmers/:farmerId/tracking`
- `GET /voice/queue`
- `POST /voice/calls`

## Run locally

### 1) Backend

```bash
cd server
npm install
npm run dev
```

Optional MongoDB config:

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/kisansahayak
PORT=5000
```

If `MONGO_URI` is not set, API falls back to in-memory demo data.

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

Optional API base override:

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Seed database (optional)

If MongoDB is configured:

```bash
cd server
npm run seed
```

## Tech stack

- **Frontend:** React (JavaScript), Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB + Mongoose (with demo fallback)
- **Architecture:** MERN-style full-stack JavaScript
