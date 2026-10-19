# 🧠 MusiBrain

> Build a persistent **"taste brain"** that understands *why* you love the music you do, and generates emotionally-aligned playlists for any life context.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-purple.svg)](./LICENSE)
[![Stack: Next.js + Prisma](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20Prisma%20%7C%20SQLite%20%2F%20Supabase-cyan.svg)](#-tech-stack)

MusiBrain goes beyond surface-level streaming algorithms. By combining direct user taste interviews with sonic analysis and fast LLM reasoning, MusiBrain constructs a deep, inspectable, and persistent model of your music tastes—capturing the emotional textures, lyrical resonance, and musical structures that make songs truly "hit" for you.

Try it here: https://musibrain.vercel.app

---

## ✨ Features

- 💬 **Guided Taste Interview:** Select 5–10 defining songs and articulate *why* you love them and what moods they evoke.
- 🧠 **The Taste Brain:** LLM analysis builds a structured taste profile complete with semantic tags, mood signatures, narrative summaries, and tag intensities.
- 🎵 **Emotionally Aligned Playlist Generation:** Generates tailored playlists for real life moments:
  - 🌙 *Late Night Drive* (atmospheric, nocturnal, introspective)
  - 📚 *Studying / Deep Focus* (non-intrusive focus flow)
  - 🔥 *Gym / Workout* (driving rhythmic momentum)
  - 🎉 *Party Mode* (groove-heavy and high energy)
- 📋 **Easy Playlist Export to Any Platform:** 1-click tracklist copy and instant `.txt` / `.csv` downloads, formatted specifically for free tools like TuneMyMusic, SongShift, and Playlisty to import entire playlists directly into your **Apple Music or Spotify** library in seconds.
- 🎯 **Fine-Grained Taste Feedback:** Rate recommendations with nuanced feedback (*"Wow, so good"*, *"Nailed it"*, *"Kinda mid / not quite it"*, *"Already have this"*, *"Failed it"*) to dynamically prune future playlist generations.
- 🔗 **Universal Streaming Links:** Powered by Odesli / Songlink to generate direct links for **Spotify, Apple Music, YouTube Music, Tidal, Deezer, and Amazon Music**.
- 💾 **Dual-Mode Database (Local SQLite & Supabase):** Run completely offline with local SQLite out of the box, or connect to Supabase Cloud PostgreSQL with a single command.
- ⚡ **Instant Local & Cloud Auth:** Sign in with Google OAuth / Email Magic Link via Supabase, or use the built-in Local Mode for instant offline development.


---

## 🛠️ Tech Stack

- **Frontend & App Framework:** [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19, TypeScript)
- **Database & ORM:** [Prisma ORM](https://www.prisma.io) with native dual support:
  - **Local Mode:** SQLite (`app/prisma/dev.db`)
  - **Cloud Mode:** PostgreSQL via [Supabase](https://supabase.com)
- **AI & Reasoning:** [Groq](https://groq.com) SDK (`openai/gpt-oss-120b` or custom `GROQ_MODEL`) for structured taste mapping and playlist curation
- **Music Metadata & Search:** [Last.fm API](https://www.last.fm/api) for track searches, similarity vectors, and album art
- **Platform Resolution:** [Odesli (Songlink)](https://odesli.co) for universal cross-platform music streaming links
- **Optional Microservice:** FastAPI Python microservice (`ytmusic-service/`) for automated YouTube Music playlist exports
- **Design:** Custom Dark-Mode design system with fluid typography and glassmorphism

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher; v20+ recommended)
- **npm**, **pnpm**, or **yarn**
- Free API keys from:
  - [Groq Console](https://console.groq.com) (for AI taste analysis)
  - [Last.fm API](https://www.last.fm/api/account/create) (for music search & metadata)

---

### 2. Quick Setup (Local SQLite Mode)

MusiBrain runs locally out-of-the-box without needing any external database servers:

```bash
# 1. Clone the repository
git clone https://github.com/bilalahmed1905/MusiBrain.git
cd MusiBrain

# 2. Navigate to the app directory and install dependencies
cd app
npm install

# 3. Create your local environment file
cp .env.example .env.local
```

Open `app/.env.local` and add your `GROQ_API_KEY` and `LASTFM_API_KEY`:

```env
GROQ_API_KEY=your_groq_api_key_here
LASTFM_API_KEY=your_lastfm_api_key_here
DATABASE_URL="file:./dev.db"
```

Generate the Prisma client:

```bash
npm run db:local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and click **⚡ Local Mode** or **Launch Your Taste Brain** to start using MusiBrain immediately!

---

### 3. Connecting Supabase (Cloud Database & Google OAuth)

When you are ready to connect to a Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Under **Project Settings > Database**, copy your Transaction Pooler and Direct Connection strings.
3. In `app/.env.local`, update:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   ```
4. Switch Prisma to PostgreSQL and sync your schema:
   ```bash
   npm run db:supabase
   npx prisma db push
   ```
5. To switch back to local SQLite at any time, just run `npm run db:local`.

---

## 📁 Repository Structure

```
MusiBrain/
├── app/                        # Next.js Full-Stack Application
│   ├── prisma/                 # Prisma schema, migrations, and local dev.db
│   │   └── schema.prisma       # Database schema (User, TasteProfile, Favourite, Playlist)
│   ├── scripts/                # Database provider switch scripts
│   ├── src/
│   │   ├── app/                # App Router (Landing, Dashboard, Interview, Playlists)
│   │   │   ├── api/            # API Routes (auth, favourites, taste-profile, playlists)
│   │   │   └── dashboard/      # Interactive user interface
│   │   └── lib/                # Core services (Groq, Last.fm, Odesli, Auth, DB)
│   ├── .env.example            # Sanitized environment variable template
│   └── package.json
├── ytmusic-service/            # Optional FastAPI YouTube Music microservice
│   ├── main.py
│   └── requirements.txt
├── Product Requirements Document.md
├── LICENSE
└── README.md
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

MusiBrain is an independent project built with love for music-obsessed listeners. If you want to support development, prioritize new features, or sponsor my work, please consider supporting me:

- **[Sponsor via GitHub Sponsors](https://github.com/sponsors/bilalahmed)** — Select a tier (from supporting the developer to corporate sponsorship).

Thank you for supporting independent open-source developers! 🎧✨
