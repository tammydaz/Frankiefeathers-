# Frankie Feathers — voice setup (your dialect, guy + girl voices)

You want **your wording and Philly delivery**, but **not** your voice — **one man**, **one woman**, **one man** (Frankie, Gina, Sal).

## What is already in the repo

| Piece | Purpose |
|-------|---------|
| `voices.config.json` | Guy/girl voice IDs + scratch file names |
| `scratch/README.md` | What to record on your phone |
| `convert_scratch.js` | Scratch → guy/girl via **Speech-to-Speech** API |
| `pick_voices.js` | Search ElevenLabs for male/female voices to paste IDs |
| `render_episode.js` | Builds the video from `line_*.mp3` |

## Part A — On your phone (5 minutes)

1. Open **Voice Memos** (or any recorder).
2. Read each line from **`VOICE-NOTES-ep1.md`** **in Philly character** (slang, rhythm — sound does not matter).
3. AirDrop or upload to your PC as:
   - `scratch/01_frankie_scratch.mp3`
   - `scratch/02_gina_scratch.mp3`
   - `scratch/03_sal_scratch.mp3`

Or upload those three into your [Frankie Feathers Drive folder](https://drive.google.com/drive/folders/13dGWtA74shtPytPlnK-gWh14YKxxlOMC).

## Part B — ElevenLabs in the browser (guy / girl picks)

Open these (sign in with your account):

1. **Voice Library** — pick a **male** for Frankie (not “New York” Dylan):  
   https://elevenlabs.io/app/voice-library  
   Search: `east coast`, `rough`, `middle aged`. Copy **Voice ID**.

2. Pick a **second male** for Sal (deeper, calmer).

3. **Gina** — keep your custom female `GVF6c2ERWN64CxwxjaUt` in `voices.config.json`, or pick another **female** voice.

4. **Speech to Speech** (if you prefer the website instead of `convert_scratch.js`):  
   https://elevenlabs.io/app/speech-synthesis/speech-to-speech  
   Upload each scratch → choose target voice → download → rename to `line_0_frankie.mp3`, `line_1_gina.mp3`, `line_2_sal.mp3`.

## Part C — On your Windows PC (repo folder)

```powershell
winget install Gyan.FFmpeg   # once
npm install
copy .env.example .env       # paste ElevenLabs key if not using Cursor Secrets
```

Edit **`voices.config.json`**: replace `REPLACE_MALE_VOICE_ID` and `REPLACE_SECOND_MALE_VOICE_ID`.

```powershell
node pick_voices.js philly
node convert_scratch.js
node render_episode.js
```

Output: **`episode_1_final.mp4`**.

## Cursor Cloud Agent

If you use a cloud agent, add **ELEVENLABS_API_KEY** in Cursor **Secrets** (you were prompted). The agent can run `pick_voices.js` / `convert_scratch.js` once the key reaches the VM.

## I cannot do on your phone

This agent **cannot** open Voice Memos or ElevenLabs **on your Galaxy/PC logged in as you**. It **can** prepare the repo, Drive docs, and scripts — you only record three scratches and (optionally) paste two male voice IDs.
