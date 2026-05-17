# 🧠 MusiBrain

> Build a persistent **"taste brain"** that understands *why* you love the music you do, and generates emotionally-aligned playlists for any life context.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-purple.svg)](./LICENSE)
[![Stack: Next.js + Prisma](https://img.shields.io/badge/Stack-Next.js%20%7C%20Prisma%20%7C%20Postgres-cyan.svg)](#-tech-stack)

MusiBrain goes beyond simple streaming histories. By combining direct user taste interviews with Spotify audio features and Large Language Models (LLMs), MusiBrain builds a highly detailed, inspectable, and persistent model of your music tastes—capturing the emotional resonance, lyrical themes, and musical structures that make songs "hit" for you.

---

## ✨ Features

- 🎧 **Spotify & Last.fm Onboarding:** Authenticate securely and pull your top tracks, artists, and listening history.
- 💬 **Guided Taste Interview:** Select 5–10 all-time favorite songs and articulate *why* they move you, generating a deep-level taste signature.
- 🧠 **The Taste Brain:** An LLM-generated semantic taste profile combining physical audio properties (energy, valence, danceability) with human emotional notes.
- 🎵 **Emotionally Aligned Playlist Generation:** Generate context-specific playlists (e.g., *Late-Night Drive*, *Deep Focus*, *Workout*) using adjusted seed patterns and LLM heuristics.
- 🔬 **Inspect & Nudge:** Tweak semantic tags, adjust acoustic feature ranges, or nudge your taste profile over time as your musical journey evolves.

---

## 🛠️ Tech Stack

MusiBrain is designed as a modular, full-stack application:

- **Frontend & Routing:** React + TypeScript with Next.js (App Router)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Integrations:** 
  - Spotify Web API (OAuth, Playlists, Playback, and Recommendations)
  - Last.fm API (Scrobbles & Listening Trends)
  - LLM Integration (OpenAI / Anthropic / Groq) for cognitive mapping and playlist reasoning
- **Styling:** Premium Dark-Mode theme with HSL neural accent palettes

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Spotify Developer Credentials
- OpenAI or Anthropic API Key

### 2. Environment Setup
Create a `.env.local` file inside the `app` directory (refer to `app/.env.local.example` for details):

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/musibrain"

# Spotify API
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
SPOTIFY_REDIRECT_URI="http://localhost:3000/api/auth/callback/spotify"

# LLM API
OPENAI_API_KEY="your_openai_api_key"
```

### 3. Installation
```bash
# Clone the repository
git clone https://github.com/bilalahmed/MusiBrain.git
cd MusiBrain

# Install dependencies and sync the database
cd app
npm install
npx prisma db push

# Start the development server
npm run dev
```

---

## ⚖️ License & Commercial Protection

This project is open-source and licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

### 🚫 Commercial Platforms & Companies
If you are a company, a startup, or a commercial platform looking to use MusiBrain:
* **The Copyleft Requirement:** If you host a modified version of MusiBrain on a server and offer it as a service over a network, the AGPL-3.0 **forces you to make your entire platform's source code publicly available under the AGPL-3.0**.
* **Commercial Exemption Licenses:** If you want to use MusiBrain commercially, integrate it into a proprietary application, or run it as a service *without* open-sourcing your code, you **must purchase a Commercial License** directly from the author. 

For inquiries regarding commercial licensing or custom integration partnerships, please contact **`bilalahmed21905@gmail.com`**.

---

## 💖 Support & Sponsorship

MusiBrain is an independent project built with love for music obsessed listeners. If you want to support development, prioritize new features, or sponsor my work, please consider supporting me:

- **[Sponsor via GitHub Sponsors](https://github.com/sponsors/bilalahmed)** — Select a tier (from supporting the developer to corporate sponsorship).

Thank you for supporting independent open-source developers! 🎧✨
