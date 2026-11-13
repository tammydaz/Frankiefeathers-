# Scratch recordings (your dialect, not your final voice)

Record **how you say the line** — Philly slang, rhythm, attitude. The timbre does **not** matter.

## Record these three files (phone voice memo is fine)

| Save as | Character | Read from |
|---------|-----------|-----------|
| `01_frankie_scratch.mp3` | Frankie (guy) | `VOICE-NOTES-ep1.md` line 1 |
| `02_gina_scratch.mp3` | Gina (girl) | line 2 |
| `03_sal_scratch.mp3` | Sal (guy) | line 3 |

Tips:

- Quiet room, hold phone ~6–8 inches away.
- Perform **in dialect** (youse, dat, Two Street energy).
- One file per character; pause at the end is OK.

Then either:

1. **On your PC:** `node convert_scratch.js` (after `voices.config.json` has male/female voice IDs), or  
2. **In ElevenLabs app:** Speech to Speech — upload each scratch, pick guy/girl voice, download as `line_0_frankie.mp3` etc.

Put finished `line_*.mp3` in this folder or the repo root, then `node render_episode.js`.
