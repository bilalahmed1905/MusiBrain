# **MusiBrain – Product Requirements Document (PRD)**

## **1\. Purpose and Vision**

MusiBrain is a web application that connects to a user’s Spotify account and builds a persistent “taste brain” that explains *why* they love certain songs, then uses that understanding to generate and refresh emotionally aligned playlists for different life contexts.

This PRD is written as the initial, contract‑style prompt for an AI coding agent building the MusiBrain MVP web app.

---

## **2\. Objectives and Success Metrics**

## **2.1 Objectives**

* Help music‑obsessed listeners articulate and understand the emotional patterns behind their taste (beyond raw streaming history).  
* Generate context‑specific playlists (e.g., study, late‑night drive, gym) that feel “emotionally right” and improve on generic algorithmic playlists.  
* Provide a simple, inspectable “taste profile” users can view and nudge over time, and that the system uses as a persistent internal model rather than one‑off prompts.

**2.2 Success Metrics (MVP)**

For a small pilot user group (e.g., first 50–100 users):

* ≥70% of users rate at least one generated playlist as “feels very me” (4 or 5 on a 5‑point scale).  
* ≥60% of users return at least once to regenerate or refresh a playlist within 2 weeks.  
* ≥60% of users complete the full taste interview (select 5–10 favourites and answer all questions).

## **3\. Target Users and Core Use Cases**

## **3.1 Primary User Persona**

* **Profile:** Spotify user, teens to late 40s, heavy listener (multiple hours/day), cares deeply about music and its quality and why they enjoy music the way they do.  
* **Behaviours:** Already curates playlists manually, complains that Discover Weekly / AI playlists feel “off” or too generic. Likes talking about songs and “why they hit.”  
* **Platforms:** Primarily desktop or laptop for setup and initial taste interview; mobile Spotify app for listening.

## **3.2 Key Use Cases**

1. **Taste Brain Setup:**  
   User logs in with Spotify, picks 5–10 all‑time favourite songs, writes short answers about each, and gets a taste profile summary.  
2. **Context Playlist Generation:**  
   User selects a context (e.g., “Late‑night drive”) and MusiBrain creates a 12–25 track Spotify playlist that reflects their taste adjusted for that context.  
3. **Playlist Review and Save:**  
   User previews the playlist, reads a few “why this track fits” blurbs, then saves, renames, or regenerates the playlist. Directly imports the playlist into Spotify.  
4. **Ongoing Taste Evolution:**  
   On return visits, user can refresh a context playlist based on recent listening and optionally adjust tags (“less happy pop, more sad indie”).

---

## **4\. Scope, Non‑Goals, and Constraints**

## **4.1 In‑Scope (MVP)**

* Spotify OAuth login with basic account connection.  
* Reading user’s top tracks/artists and recent listening history from Spotify.  
* Guided taste interview (5–10 favourites, 2–3 questions per song, optional tags).  
* Taste profile computation combining user text \+ Spotify audio features.  
* Context‑based playlist generation for a small fixed set of contexts (see 6.3).  
* Playlist creation in the user’s Spotify account (name, description, tracks).  
* Simple “Taste Profile” page with tags, sliders, and basic editing.

## **4.2 Non‑Goals (Explicit)**

* Only one service integrations in v1 (Spotify).  
* No raw audio analysis or custom audio embeddings (use Spotify’s audio features only).  
* No social graph, friend feeds, or shared playlists in v1.  
* No advanced analytics dashboards; only simple feedback (e.g., “like/dislike playlist”).  
* No massive LLM fine‑tuning project; Instead lightly fine tune it and instead provide it with enough examples to understand how music feels to people and some general prompting and light examples.

## **4.3 Constraints**

* Must be feasible for a single‑team semester‑scale project using AI coding agents; avoid overly complex, distributed architectures.  
* Must respect Spotify API terms of use and rate limits (read‑only history \+ recommendation endpoints, write playlists).  
* Must not hallucinate non‑existent tracks or artists; playlists must be composed of real Spotify IDs.

---

## **5\. Functional Requirements**

## **5.1 Authentication and Onboarding**

* **FR‑1:** Provide a “Log in with Spotify” button using Spotify OAuth (Authorization Code Flow).  
* **FR‑2:** After login, store a secure access token/refresh token pair for API calls.  
* **FR‑3:** On first login, guide the user through a short onboarding explaining MusiBrain’s value and what permissions are needed.

## **5.2 Spotify Data Import**

* **FR‑4:** Fetch top tracks and top artists (short‑term and medium‑term) plus recent listening history (e.g., last 50–100 tracks) via Spotify API.  
* **FR‑5:** Fetch audio features (energy, valence, danceability, tempo, acousticness, instrumentalness, speechiness, loudness) for:  
  * user‑selected favourites, and  
  * candidate recommendation tracks.  
* **FR‑6:** Cache track metadata and audio features in the app database to reduce repeated API calls.

## **5.3 Taste Interview Flow**

* **FR‑7:** Show a grid/list of suggested favourites (top tracks) and allow search for any track on Spotify.  
* **FR‑8:** Require user to select at least 5 and at most 10 favourite songs before proceeding.   
* **FR‑9:** For each favourite, collect:  
  * Free‑text answer to “What do you love about this song?” (1-2 sentences to capture the essence of the song / 200 characters).  
  * Free‑text answer to “What mood are you in when you put it on?”  
  * Optional multi‑select tags such as: “lyrics”, “nostalgic”, “hype”, “sad but hopeful”, “cinematic”, “background”, “focus”, “party.”  
* **FR‑10:** Allow users to save progress and edit answers before finalizing the taste profile.

## **5.4 Taste Profile Builder**

* **FR‑11:** On submission, compute aggregate numeric patterns (e.g., typical ranges for energy, valence, tempo, danceability) from favourites’ audio features.  
* **FR‑12:** Use an LLM to analyse user text \+ tags and generate:  
  * Semantic tags (e.g., “melancholy indie with big emotional choruses”, “cinematic builds”).  
  * A short, user‑facing “Taste Profile Summary” (2–3 paragraphs).  
  * Internal notes about preferred moods, themes, and structures (e.g., “slow build into loud chorus”).  
* **FR‑13:** Persist a structured Taste Profile object per user, including:  
  * Numeric feature ranges and distributions.  
  * Semantic tags and moods.  
  * User‑facing summary text.  
  * Last‑updated timestamp.

## **5.5 Context‑Based Playlist Generation**

* **FR‑14:** Provide a “Generate Playlist” screen with a dropdown or cards for contexts, e.g.:  
  * Late‑night drive  
  * Studying / deep focus  
  * Gym / workout  
  * Background at a party  
* **FR‑15:** For a selected context, use an LLM to:  
  * Adjust taste profile feature ranges (e.g., higher energy, higher tempo for gym; lower speechiness for studying).  
  * Select seed tracks (mix of favourites and recent history tracks that match the context).  
* **FR‑16:** Call Spotify’s Recommendations API with:  
  * Seed tracks and/or seed artists.  
  * Target feature ranges (energy, valence, tempo, danceability, etc.).  
  * Limit to return at least 40–60 candidates.  
* **FR‑17:** Use the LLM or heuristic scoring to pick 12–25 final tracks from candidates, balancing:  
  * Fit to adjusted taste profile.  
  * Diversity (not all from the same artist/album).  
  * Inclusion of some known favourites plus new discoveries.  
* **FR‑18:** Ask the LLM to generate short “why this track fits” blurbs (1–3 sentences) for at least 3–5 tracks per playlist, referencing both user’s reasons and audio features.

## **5.6 Playlist Delivery and Refresh**

* **FR‑19:** Create a playlist in the user’s Spotify account with:  
  * Name template: MusiBrain – \[Context\] – \[Month Year\] (editable).  
  * Description summarizing the context and the user’s taste profile.  
* **FR‑20:** In the app, show:  
  * Playlist track list with links to open in Spotify.  
  * The explanatory blurbs attached to selected tracks.  
  * Buttons: “Save as is”, “Regenerate playlist”, “Rename playlist”.  
* **FR‑21:** Implement basic “refresh” logic per context (no background cron jobs needed in MVP):  
  * On user request, re‑read recent listening data.  
  * Slightly adjust taste profile (e.g., up‑weight recently repeated artists/tracks).  
  * Regenerate playlist using updated profile.

## **5.7 Taste Profile Inspection and Editing**

* **FR‑22:** Provide a “Taste Profile” page showing:  
  * Key semantic tags (chips/pills) with ability to toggle on/off or “turn down” intensity.  
  * Simple sliders or readonly bars for core audio features (e.g., typical energy, valence, tempo).  
  * The user‑facing profile summary with an “Edit description” option.  
* **FR‑23:** Changes to tags or sliders update the stored Taste Profile and influence subsequent playlists. 

**5.8 API Rate Limit & Error Handling (MVP)**

**FR‑24:** When Spotify API returns a 429 Too Many Requests response, the system must:

* Extract the Retry-After header (seconds to wait).  
* Wait the specified number of seconds before retrying the same request.  
* If no Retry-After header is provided, use exponential backoff starting at 1 second, doubling each attempt (1, 2, 4, 8 seconds) up to a maximum of 32 seconds.  
* Show a user-friendly message: *"Spotify is rate-limiting requests right now. Waiting X seconds before retrying..."*  
* After 3 consecutive 429 failures, fail gracefully and offer the user a "Try again later" button instead of an infinite loop.

**FR‑25:** Implement token refresh before expiry:

* Store the expires\_in value from Spotify OAuth response.  
* When the access token reaches 10 minutes remaining (or 15% of its lifetime, whichever is smaller), automatically refresh it using the refresh token.  
* If a request fails with 401 Unauthorized, attempt a single token refresh and retry the original request once. If that fails, log the user out and redirect to login.

**FR‑26:** Cache recommendation results per user per context for 1 hour:

* Store the generated playlist (track IDs and order) with a timestamp.  
* If the same user requests the same context within 1 hour, return the cached version instantly instead of calling Spotify/LLM again.  
* Provide a "Force regenerate" button that bypasses cache and creates a fresh playlist.

---

## **6\. AI/LLM Behaviour Requirements**

## **6.1 LLM Responsibilities**

* Interpret free‑text reasons and moods from the taste interview.  
* Generate semantic tags and the Taste Profile summary.  
* For each context, adjust numeric feature ranges and choose seed tracks.  
* Rank and select final playlist tracks from Spotify candidates.  
* Generate short “why this track fits” blurbs (clear, non‑repetitive).

## **6.2 Behaviour Guidelines**

* Do **not** invent tracks, artists, or album names; only use IDs returned by Spotify APIs.  
* When user‑written reasons are vague, the LLM should default to patterns in audio features rather than hallucinating deep meanings.  
* When there is insufficient data (e.g., only 3 favourites), ask the user to add more favourites instead of producing a low‑quality profile.  
* Keep the user‑facing text concise, specific, and non‑cringey; avoid generic clichés (“this song is a vibe”) give specific details.

## **6.3 Example Context Prompting (for Implementation)**

For internal use in the agent’s prompts (illustrative, not exhaustive):

* **Late‑night drive:** “Emphasize moody, atmospheric tracks with mid‑tempo, moderate energy, lower valence; avoid high‑energy EDM bangers unless they match user history.”  
* **Studying / deep focus:** “Prefer lower speechiness, moderate to low energy, stable tempo, fewer abrupt transitions; avoid tracks with very prominent vocals if user usually listens to instrumental for focus.”  
* **Gym / workout:** “Increase energy and tempo ranges; pick tracks with strong rhythmic drive; allow higher valence and intensity.”

---

## **7\. Non‑Functional and Technical Requirements**

## **7.1 Architecture and Stack (Guidance for AI Coding Agent)**

* Web application with a simple monolithic backend and SPA/SSR frontend to keep architecture manageable for a semester‑length project.  
* Suggested stack (can be adapted by AI agent if justified):  
  * Frontend: React \+ TypeScript (or Next.js for full‑stack React).  
  * Backend: Node.js with a minimal framework (Express, Next.js API routes, or similar).  
  * Database: PostgreSQL (via Prisma/ORM) to store users, taste profiles, and cached track metadata.  
  * Integrations:  
    * Spotify Web API (OAuth, user profile, top tracks, recent tracks, audio features, recommendations, playlist creation).  
    * LLM API (e.g., OpenAI/Anthropic) via HTTPS.

## **7.2 Non‑Functional Requirements**

* **Performance:**  
  * Taste interview pages must respond within 300–500 ms for UI actions (excluding Spotify/LLM round‑trips).  
  * Playlist generation end‑to‑end target: under 10 seconds for typical users (Spotify \+ LLM calls).  
* **Security & Privacy:**  
  * Store tokens securely; never expose access tokens to the frontend.  
  * Clearly state what data is stored (favourites, text answers, taste profile, playlists created) and that MusiBrain does not post on behalf of the user beyond playlist creation.  
* **Reliability:**  
  * Handle Spotify API or LLM failures gracefully with user‑friendly error messages and retry options.  
* **Maintainability:**  
  * Codebase organized into clear modules: auth, data import, taste profile engine, playlist generation, UI.

---

## **8\. UX and Visual Direction (Light Brand Guidance)**

* Simple, clean layout with a focus on text and track lists; avoid flashy, distracting UI.  
* Colour palette: neutral background (light or dark) with a single accent colour (e.g., teal or purple) to evoke a “music brain” / “neural” vibe.  
* Responsive design that works well on laptop screens first; mobile‑friendly for reviewing playlists and reading blurbs.

---

## **9\. Risks, Assumptions, and Open Questions**

## **9.1 Assumptions**

* Users are willing to spend 5–10 minutes on the taste interview and write out why these songs are their favorite, capturing the essence of the music provided the perceived payoff (highly personalized, emotionally accurate playlists) is made clear from the start.  
* Spotify’s current APIs continue to provide sufficient access to audio features and recommendations.  
* A general‑purpose LLM, prompted correctly and with a small set of in‑context examples, is sufficient to generate high‑quality profiles and blurbs.

## **9.2 Key Risks**

* **Risk:** Playlists may still feel too similar to existing Spotify recommendations.  
  * **Mitigation:** Emphasize user‑specific reasons and semantic tags in LLM logic, and surface “why this fits you” to reinforce differentiation.  
* **Risk:** Over‑complex prompts or architecture may be hard for AI coding agents to implement or debug within project time.  
  * **Mitigation:** Keep architecture monolithic and prompts modular; start with a small set of contexts and expand later.

## **9.3 Open Questions (for Future Iteration, Not Required for v1)**

* Should users be able to mark individual generated tracks as “nailed it” or “miss” to further refine the taste brain?   
* How could MusiBrain support multiple distinct “taste modes” (e.g., “indie me” vs “EDM me”) per user in later versions?  
* Will there be future integration for Apple Music or Amazon Music?

