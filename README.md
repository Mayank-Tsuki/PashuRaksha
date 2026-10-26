# PashuRaksha — Animal Rescue & Care Platform

This project keeps the existing frontend design and adds a first version of role-based login and an NGO/rescue-center dashboard.

## What is included

- Existing individual/helper frontend and visual styling retained.
- Role selection: individual helper or NGO/rescue center.
- Registration and login with mobile number and password.
- Passwords stored as `scrypt` hashes (not plain text).
- Signed bearer-token sessions for API requests.
- Individual rescue reports save the selected animal photo to `MiniBCKEND/uploads/` and store its URL and GPS coordinates in the database.
- NGO request cards display the uploaded animal photo and a map link when GPS coordinates are available.
- Helper profile displays the registered name and mobile number, plus report totals from the database.
- NGO dashboard with incoming reports, accept/reject actions, and status updates.
- NGO profile, rescued-animal count, and shelter capacity / occupancy fields.
- Persistent database with **MongoDB Atlas** cloud support (and automatic local JSON fallback).
- Existing public shelter directory API retained.

## Requirements

- Node.js 18 or newer recommended
- npm
- MongoDB Atlas cluster (free tier / M0 works great)

## Database Setup: MongoDB Atlas

The backend seamlessly supports MongoDB Atlas without requiring any architectural rewrite:

1. Open `MiniBCKEND/.env` (or copy from `.env.example`).
2. Add your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/pashuraksha?retryWrites=true&w=majority
   ```
   *(Ensure you replace `<username>` and `<password>` with your database user credentials, and whitelist your IP `0.0.0.0/0` in Atlas Network Access).*
3. **Automatic Data Migration**: On first connection to MongoDB Atlas, existing organizations, user accounts, and reports from `database.json` are automatically migrated to your Atlas database!
4. **Fallback Safety**: If `MONGODB_URI` is not set or network fails, the backend automatically falls back to `database.json` without crashing.

## Run locally

1. Open a terminal in the `MiniBCKEND` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the API server:

   ```bash
   npm start
   ```

4. Keep that terminal running. The backend now also serves the frontend. Open **`http://localhost:5000/`** (or `http://localhost:5000/frontend.html`) in your browser. You do not need to run Python or a second frontend server.

## First-time use

- Select **I'm here to help an animal** and create a helper account to submit reports.
- Select **I'm an NGO or rescue center member** and register a center account to review reports.
- Create one account of each type using different mobile numbers to test the flow.
- When a helper submits a report, its tracking ID is shown in a success message and the request appears in the NGO dashboard.

## Main API routes

- `GET /api/health` — backend health check (returns active database mode)
- `POST /api/auth/register` — register a helper or NGO account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — get the signed-in account
- `GET /api/shelters` and `GET /api/shelters/:id` — public shelter directory
- `POST /api/reports` — create a helper rescue report (login required)
- `GET /api/reports/track/:tracking_id` — look up report status
- `GET /api/ngo/dashboard` — list reports for the NGO dashboard (NGO login required)
- `PATCH /api/ngo/reports/:trackingId/status` — accept/reject/update a rescue request (NGO login required)
- `PUT /api/ngo/profile` — update NGO details and capacity (NGO login required)

## Important notes

- Animal photos are stored in `MiniBCKEND/uploads/`; keep that folder when backing up the project.
- GPS requires the user to grant location permission in the browser.
- Before public deployment, set a strong random `TOKEN_SECRET` in `.env` and restrict CORS.

