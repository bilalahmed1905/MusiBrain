# MusiBrain YouTube Music Microservice

This is a thin Python wrapper around `ytmusicapi` to allow the Next.js frontend to search YouTube Music and create playlists.

## Why a Python microservice?
`ytmusicapi` is the most robust reverse-engineered API for YouTube Music, but it is written in Python. Since our frontend is Next.js (TypeScript), we use this FastAPI service to bridge the gap.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. **Authentication (Required for creating playlists):**
   To create playlists, you need an authenticated session.
   Run the following command and follow the prompts to authenticate via your browser:
   ```bash
   ytmusicapi oauth
   ```
   This will generate an `oauth.json` file in this directory. The FastAPI server will automatically load this file if it exists.

4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The service will run on `http://localhost:8000`.

## Endpoints

- `GET /health` - Check if service is up.
- `POST /search` - Search tracks on YouTube Music (no auth required).
- `POST /playlist` - Create a YouTube Music playlist (requires `oauth.json`).
