import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ytmusicapi import YTMusic
import json

app = FastAPI(title="MusiBrain YTMusic Microservice")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YTMusic
# In a real deployed scenario, you would pass `auth=oauth.json` or headers
# For unauthenticated search/playlist creation (if public), headers aren't always strictly required for read-only
# But to create a playlist, authentication IS required.
# Since this is an MVP without user oauth flow, we can use a server-side dummy account
# or just return search results.

try:
    if os.path.exists('oauth.json'):
        ytmusic = YTMusic('oauth.json')
    else:
        ytmusic = YTMusic()
except Exception as e:
    ytmusic = YTMusic()
    print(f"Failed to load oauth.json: {e}")

class TrackQuery(BaseModel):
    query: str

class PlaylistCreateRequest(BaseModel):
    title: str
    description: str
    video_ids: List[str]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/search")
def search_tracks(query: TrackQuery):
    try:
        results = ytmusic.search(query.query, filter="songs", limit=5)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/playlist")
def create_playlist(req: PlaylistCreateRequest):
    try:
        # NOTE: This endpoint requires ytmusic to be authenticated!
        # If it's not authenticated, it will raise an Exception.
        playlist_id = ytmusic.create_playlist(
            title=req.title,
            description=req.description,
            video_ids=req.video_ids
        )
        return {"playlist_id": playlist_id, "url": f"https://music.youtube.com/playlist?list={playlist_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication required to create playlists. Provide oauth.json. Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
