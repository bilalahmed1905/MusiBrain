# 🧠 MusiBrain Web App (`/app`)

The full-stack Next.js web application powering MusiBrain.

---

## 🛠️ Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io) with dual support:
  - **Local SQLite** (`prisma/dev.db`): Zero-setup offline database
  - **Supabase PostgreSQL**: Cloud database with connection pooling
- **AI / LLM Engine**: [Groq SDK](https://groq.com) (`openai/gpt-oss-120b` or custom `GROQ_MODEL`)
- **Music APIs**:
  - [Last.fm](https://www.last.fm/api): Track search, artist top tags, similar track vectors, and album artwork
  - [Odesli (Songlink)](https://odesli.co): Universal cross-platform links (Spotify, Apple Music, YouTube Music, Tidal, Deezer, Amazon Music)
- **Styling**: Vanilla CSS Modules with custom Dark-Mode design tokens (`globals.css`)

---

## 🚦 Quick Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server on `localhost:3000` |
| `npm run build` | Build optimized production bundle with TypeScript check |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:local` | Switch Prisma schema to local SQLite and regenerate client |
| `npm run db:supabase` | Switch Prisma schema to Supabase PostgreSQL and regenerate client |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Essential Keys:
```env
# Groq LLM API
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

# Last.fm API
LASTFM_API_KEY=...

# Database (Default: local SQLite)
DATABASE_URL="file:./dev.db"

# Local Auth Fallback
NEXT_PUBLIC_LOCAL_MODE=true
```

### Optional Supabase Cloud Keys:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

---

## 📂 Directory Map

```
app/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Schema migrations
│   └── dev.db               # Local SQLite database
├── scripts/
│   └── switch-db.js         # Automated provider switch script
├── src/
│   ├── app/
│   │   ├── page.tsx         # Landing page & auth modal
│   │   ├── dashboard/       # Dashboard, taste interview, profile, playlists
│   │   ├── api/
│   │   │   ├── auth/        # Auth sync & local dev login/logout
│   │   │   ├── favourites/  # Song interview favourites CRUD
│   │   │   ├── taste-profile/# LLM taste brain generation & updates
│   │   │   ├── playlists/   # Playlist generation & curation
│   │   │   ├── search/      # Last.fm song search
│   │   │   ├── reset/       # Interview reset
│   │   │   └── export/      # YouTube Music microservice export
│   │   └── auth/callback/   # Supabase OAuth redirect handler
│   └── lib/                 # Service integrations (groq, lastfm, odesli, auth, db)
├── .env.example
└── package.json
```
