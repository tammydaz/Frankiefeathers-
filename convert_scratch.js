/**
 * Your scratch performance → guy/girl character voices (ElevenLabs Speech-to-Speech).
 *
 * 1. Drop scratch/01_frankie_scratch.mp3 etc. (see scratch/README.md)
 * 2. Set male voice IDs in voices.config.json (run node pick_voices.js to search)
 * 3. ELEVENLABS_API_KEY in .env or Cursor secret on cloud
 * 4. node convert_scratch.js
 * 5. node render_episode.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { createReadStream, existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import FormData from 'form-data';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
process.chdir(ROOT);
dotenv.config({ path: path.join(ROOT, '.env') });

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error(
    'Missing ELEVENLABS_API_KEY in .env (Windows) or Cursor Secrets (cloud).',
  );
  process.exit(1);
}

const config = JSON.parse(
  await readFile(path.join(ROOT, 'voices.config.json'), 'utf8'),
);

async function convertOne(characterKey, spec) {
  const scratchPath = path.join(ROOT, spec.scratchFile);
  if (!existsSync(scratchPath)) {
    console.warn(`Skip ${characterKey}: no scratch file ${spec.scratchFile}`);
    return;
  }
  if (spec.voiceId.startsWith('REPLACE_')) {
    console.warn(
      `Skip ${characterKey}: set voiceId in voices.config.json (run node pick_voices.js).`,
    );
    return;
  }

  const form = new FormData();
  form.append('audio', createReadStream(scratchPath));
  form.append('model_id', config.model_sts || 'eleven_english_sts_v2');
  form.append(
    'voice_settings',
    JSON.stringify({
      stability: spec.stability,
      similarity_boost: spec.similarity_boost,
    }),
  );

  const url = `https://api.elevenlabs.io/v1/speech-to-speech/${spec.voiceId}`;
  const response = await axios.post(url, form, {
    headers: {
      'xi-api-key': apiKey,
      ...form.getHeaders(),
    },
    responseType: 'arraybuffer',
    maxBodyLength: Infinity,
  });

  const outPath = path.join(ROOT, spec.outputFile);
  await writeFile(outPath, Buffer.from(response.data));
  console.log(`Wrote ${spec.outputFile} ← ${spec.scratchFile} (${spec.label})`);
}

console.log('Frankie Feathers — Speech-to-Speech\n');
for (const [key, spec] of Object.entries(config.characters)) {
  await convertOne(key, spec);
}
console.log('\nDone. Run: node render_episode.js');
