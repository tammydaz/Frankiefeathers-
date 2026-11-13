# Frankie Feathers

Renders a 9:16 Short/Reel (`episode_1_final.mp4`) from a still scene and three character lines: **Frankie**, **Gina**, and **Sal** (Two Street / hoagie-roll chaos).

This project is **not** [Phone Hands](https://github.com/tammydaz/phone-hands). Phone Hands is Tammy’s Android accessibility app; Frankie Feathers is the vertical video pipeline only.

## Setup (Windows)

1. Paste your ElevenLabs key into `.env` (copy from `.env.example`):
   ```
   ELEVENLABS_API_KEY=your_key_here
   ```
2. Drop **`scene.jpg`** (1080×1920 vertical) into this folder.
3. Install **ffmpeg** if it is not on PATH:
   ```
   winget install Gyan.FFmpeg
   ```
   Or run `setup.ps1` once (ffmpeg + npm packages).
4. Install packages and render:
   ```
   npm install
   node render_episode.js
   ```

Voice IDs and line text live in the `VOICES` / `LINES` section at the top of `render_episode.js`. Existing `line_*.mp3` files are reused; delete them to regenerate voices with ElevenLabs.

## Output

- `episode_1_final.mp4` — h264, 9:16, burned-in yellow captions, punch-in crops per speaker, wide shot at the end.
- `captions.srt` / `captions.ass` — generated sidecars (gitignored).

## Phone Hands

If Phone Hands is driving your phone, open that app and tap **Stop**, or turn it off under **Settings → Accessibility → Phone Hands**. You do not need Phone Hands to run this renderer.
