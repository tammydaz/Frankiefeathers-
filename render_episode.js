/**
 * render_episode.js — Frankie Feathers
 *
 * Windows 9:16 Short/Reel pipeline:
 *   scene.jpg + character dialogue  ->  episode_1_final.mp4
 *
 * Setup (once):
 *   1. Paste ELEVENLABS_API_KEY into .env
 *   2. Drop scene.jpg (1080x1920) into this folder
 *   3. Install ffmpeg if needed:  winget install Gyan.FFmpeg
 *      (or run setup.ps1)
 *
 * Run:
 *   node render_episode.js
 *
 * Existing line_*.mp3 files are reused (delete them to regenerate voices).
 */

import axios from 'axios';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import { parseFile } from 'music-metadata';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
process.chdir(ROOT);
dotenv.config({ path: path.join(ROOT, '.env') });

// ---------------------------------------------------------------------------
// Voices — swap any voiceId here without touching the rest of the pipeline.
// ---------------------------------------------------------------------------
const VOICES = {
  frankie: {
    name: 'Dylan',
    voiceId: 'kWjdIkuzqBCnHbyAOYlF',
    voice_settings: { stability: 0.32, similarity_boost: 0.75 },
  },
  gina: {
    name: 'Gina (custom)',
    voiceId: 'GVF6c2ERWN64CxwxjaUt',
    voice_settings: { stability: 0.4, similarity_boost: 0.75 },
  },
  sal: {
    name: 'Adam',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    voice_settings: { stability: 0.52, similarity_boost: 0.75 },
  },
};

const TTS_MODEL = 'eleven_turbo_v2_5';
const TTS_URL = (voiceId) =>
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

const SCENE_IMAGE = path.join(ROOT, 'scene.jpg');
const CAPTIONS_SRT = path.join(ROOT, 'captions.srt');
const CAPTIONS_ASS = path.join(ROOT, 'captions.ass');
const OUTPUT_MP4 = path.join(ROOT, 'episode_1_final.mp4');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const PAUSE_BETWEEN_LINES = 0.2;
const WIDE_SHOT_SECONDS = 4;

// 1.35x punch-in crops, synced to each speaker (1080x1920 source).
const CROPS = {
  frankie: 'crop=iw/1.35:ih/1.35:(iw-iw/1.35)/2:(ih-ih/1.35)/2.4', // folding chair, middle
  gina: 'crop=iw/1.35:ih/1.35:iw-iw/1.35:ih-ih/1.35', // lower-right curb
  sal: 'crop=iw/1.35:ih/1.35:0:ih-ih/1.35', // lower-left stoop
};

const LINES = [
  {
    index: 0,
    speaker: 'Frankie',
    voice: VOICES.frankie,
    crop: CROPS.frankie,
    audioPath: path.join(ROOT, 'line_0_frankie.mp3'),
    text: "Yo, look at this payload! Confetti, sequin glitter, and an entire Italian hoagie sitting on a folding chair! Gina, don't flap a single feather toward that hoagie—that's Ninth Street salvage!",
  },
  {
    index: 1,
    speaker: 'Gina',
    voice: VOICES.gina,
    crop: CROPS.gina,
    audioPath: path.join(ROOT, 'line_1_gina.mp3'),
    text: "Ninth Street salvage?! Frankie, your eyes are full of dust! You are sitting on Two Street on January First! My family has had staging rights to this stoop since the Fancy Brigades wore cardboard wings! You step on dat bun and I'll knock you all the way back across Broad!",
  },
  {
    index: 2,
    speaker: 'Sal',
    voice: VOICES.sal,
    crop: CROPS.sal,
    audioPath: path.join(ROOT, 'line_2_sal.mp3'),
    text: "Hey! Keep it down, ya feather dusters! Some of us worked the midnight shift pullin' whole kielbasas out of the party barrels. Split the seeded roll fifty-fifty or I knock the whole foldin' chair over and nobody eats!",
  },
];

function die(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function findOnPath(binary) {
  const command = process.platform === 'win32' ? `where ${binary}` : `which ${binary}`;
  try {
    return execSync(command, { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || null;
  } catch {
    return null;
  }
}

function ensureFfmpeg() {
  const ffmpegPath = findOnPath('ffmpeg');
  if (!ffmpegPath) {
    die(
      [
        'ffmpeg is not on the system PATH.',
        '',
        'On Windows, install it with:',
        '  winget install Gyan.FFmpeg',
        '',
        'Then close this terminal, open a new one, and run:',
        '  node render_episode.js',
      ].join('\n'),
    );
  }
  ffmpeg.setFfmpegPath(ffmpegPath);
  const ffprobePath = findOnPath('ffprobe');
  if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);
  console.log(`ffmpeg: ${ffmpegPath}`);
}

function ensureScene() {
  if (!existsSync(SCENE_IMAGE)) {
    die('Drop scene.jpg (1080x1920) into this folder and run again.');
  }
}

function runFfmpeg(builder) {
  return new Promise((resolve, reject) => {
    builder
      .on('start', () => {
        console.log('  Running ffmpeg...');
      })
      .on('progress', (progress) => {
        if (progress.timemark) {
          process.stdout.write(`  timemark ${progress.timemark}\r`);
        }
      })
      .on('end', () => {
        process.stdout.write('\n');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

async function elevenLabsTts(line) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    die(
      'ELEVENLABS_API_KEY is missing. Paste your key into .env:\n  ELEVENLABS_API_KEY=your_key_here',
    );
  }

  const url = TTS_URL(line.voice.voiceId);
  const body = {
    text: line.text,
    model_id: TTS_MODEL,
    voice_settings: line.voice.voice_settings,
  };

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.post(url, body, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
        timeout: 120000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        await writeFile(line.audioPath, Buffer.from(response.data));
        return;
      }

      const detail = Buffer.from(response.data).toString('utf8').slice(0, 400);
      if (response.status === 429 && attempt < maxAttempts) {
        const wait = 2 ** attempt;
        console.warn(`  Rate limited (429). Retrying in ${wait}s...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }

      die(
        `ElevenLabs TTS failed for ${line.speaker} (HTTP ${response.status}): ${detail}`,
      );
    } catch (err) {
      if (attempt < maxAttempts) {
        console.warn(`  TTS request error (${err.message}). Retrying...`);
        continue;
      }
      die(`ElevenLabs TTS failed for ${line.speaker}: ${err.message}`);
    }
  }
}

async function readDuration(audioPath) {
  const metadata = await parseFile(audioPath);
  const duration = metadata.format.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    die(`Could not read duration from ${path.basename(audioPath)}`);
  }
  return duration;
}

async function generateAllTts() {
  const timed = [];
  for (const line of LINES) {
    const label = `${line.speaker} (${line.voice.name})`;
    if (existsSync(line.audioPath)) {
      console.log(`  Reusing ${path.basename(line.audioPath)} for ${label}`);
    } else {
      console.log(`  Generating ${label}...`);
      await elevenLabsTts(line);
    }
    const duration = await readDuration(line.audioPath);
    console.log(`  ${label}: ${duration.toFixed(3)}s`);
    timed.push({ ...line, duration });
  }
  return timed;
}

function srtTimestamp(seconds) {
  const msTotal = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(msTotal / 3_600_000);
  const minutes = Math.floor((msTotal % 3_600_000) / 60_000);
  const secs = Math.floor((msTotal % 60_000) / 1000);
  const millis = msTotal % 1000;
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

function assTimestamp(seconds) {
  const csTotal = Math.max(0, Math.round(seconds * 100));
  const hours = Math.floor(csTotal / 360_000);
  const minutes = Math.floor((csTotal % 360_000) / 6_000);
  const secs = Math.floor((csTotal % 6_000) / 100);
  const cs = csTotal % 100;
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${hours}:${pad(minutes)}:${pad(secs)}.${pad(cs)}`;
}

function escapeAssText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

function wrapCaption(text, maxChars = 42) {
  const words = text.split(/\s+/);
  const rows = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) rows.push(current);
  return rows.join('\n');
}

function buildTimeline(lines) {
  const segments = [];
  let cursor = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const start = cursor;
    const end = cursor + line.duration;
    const isLast = i === lines.length - 1;
    const holdAfter = isLast ? 0 : PAUSE_BETWEEN_LINES;
    segments.push({
      ...line,
      start,
      end,
      videoDuration: line.duration + holdAfter,
    });
    cursor = end + holdAfter;
  }
  const wideStart = cursor;
  const totalDuration = wideStart + WIDE_SHOT_SECONDS;
  return { segments, wideStart, totalDuration };
}

async function writeCaptions(timeline) {
  const srtBlocks = timeline.segments.map((seg, i) => {
    const body = wrapCaption(seg.text);
    return `${i + 1}\n${srtTimestamp(seg.start)} --> ${srtTimestamp(seg.end)}\n${body}\n`;
  });
  await writeFile(CAPTIONS_SRT, `${srtBlocks.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${path.basename(CAPTIONS_SRT)}`);

  // ASS PlayRes matches the 1080x1920 frame so Fontsize=18 and MarginV=380
  // are pixel values on the Short (SRT defaults to PlayResY=288, which would
  // push MarginV=380 off-screen).
  const events = timeline.segments.map((seg) => {
    const body = escapeAssText(wrapCaption(seg.text)).replace(/\n/g, '\\N');
    return `Dialogue: 0,${assTimestamp(seg.start)},${assTimestamp(seg.end)},Default,,0,0,0,,${body}`;
  });
  const ass = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: TV.709',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,18,&H0000FFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,40,40,380,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events,
    '',
  ].join('\n');
  await writeFile(CAPTIONS_ASS, ass, 'utf8');
  console.log(`Wrote ${path.basename(CAPTIONS_ASS)}`);
}

function formatDur(seconds) {
  return Number(seconds).toFixed(4);
}

function buildFilterGraph(timeline) {
  const [frankie, gina, sal] = timeline.segments;
  const assPath = 'captions.ass';
  const forceStyle = [
    'Fontsize=18',
    'Bold=1',
    'PrimaryColour=&H0000FFFF',
    'OutlineColour=&H00000000',
    'BorderStyle=1',
    'Outline=2',
    'Shadow=0',
    'Alignment=2',
    'MarginV=380',
  ].join(',');

  return [
    `[0:v]fps=${FPS},scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos,crop=${WIDTH}:${HEIGHT},setsar=1,format=yuv420p,split=4[s0][s1][s2][s3]`,
    `[s0]${frankie.crop},scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1,trim=duration=${formatDur(frankie.videoDuration)},setpts=PTS-STARTPTS[v0]`,
    `[s1]${gina.crop},scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1,trim=duration=${formatDur(gina.videoDuration)},setpts=PTS-STARTPTS[v1]`,
    `[s2]${sal.crop},scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1,trim=duration=${formatDur(sal.videoDuration)},setpts=PTS-STARTPTS[v2]`,
    `[s3]trim=duration=${formatDur(WIDE_SHOT_SECONDS)},setpts=PTS-STARTPTS[v3]`,
    `[v0][v1][v2][v3]concat=n=4:v=1:a=0[vcat]`,
    `[vcat]subtitles=${assPath}:force_style='${forceStyle}'[vout]`,
    `[1:a]aresample=44100:async=1,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=pad_dur=${PAUSE_BETWEEN_LINES}[a0]`,
    `[2:a]aresample=44100:async=1,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=pad_dur=${PAUSE_BETWEEN_LINES}[a1]`,
    `[3:a]aresample=44100:async=1,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=pad_dur=${WIDE_SHOT_SECONDS}[a2]`,
    `[a0][a1][a2]concat=n=3:v=0:a=1[aout]`,
  ].join(';');
}

async function renderEpisode(timeline) {
  const filter = buildFilterGraph(timeline);
  const cmd = ffmpeg();

  cmd
    .input(SCENE_IMAGE)
    .inputOptions([
      '-loop', '1',
      '-framerate', String(FPS),
      '-t', formatDur(timeline.totalDuration),
    ]);

  for (const seg of timeline.segments) {
    cmd.input(seg.audioPath);
  }

  cmd
    .complexFilter(filter, ['vout', 'aout'])
    .outputOptions([
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-r', String(FPS),
      '-movflags', '+faststart',
      '-shortest',
    ])
    .output(OUTPUT_MP4);

  await runFfmpeg(cmd);

  if (!existsSync(OUTPUT_MP4)) {
    die(`Render finished but ${path.basename(OUTPUT_MP4)} was not created.`);
  }
  console.log(`Wrote ${path.basename(OUTPUT_MP4)}`);
}

async function main() {
  console.log('Episode renderer — 9:16 Short/Reel\n');
  ensureFfmpeg();
  ensureScene();

  console.log('\n[1/3] ElevenLabs TTS');
  const lines = await generateAllTts();
  const timeline = buildTimeline(lines);
  console.log(`  Total runtime: ${timeline.totalDuration.toFixed(3)}s (incl. ${WIDE_SHOT_SECONDS}s wide shot)`);

  console.log('\n[2/3] Captions');
  await writeCaptions(timeline);

  console.log('\n[3/3] FFmpeg render (punch-ins + burned-in captions)');
  await renderEpisode(timeline);

  console.log('\nDone. Output: episode_1_final.mp4');
}

main().catch((err) => {
  die(err.stack || err.message || String(err));
});
