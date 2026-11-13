/**
 * Lists ElevenLabs shared voices to help pick a guy + girl for Philly-style lines.
 * Does not auto-pick — prints IDs to paste into voices.config.json.
 *
 *   node pick_voices.js
 *   node pick_voices.js "philly"
 */

import axios from 'axios';
import dotenv from 'dotenv';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(ROOT, '.env') });

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('Missing ELEVENLABS_API_KEY.');
  process.exit(1);
}

const q = process.argv[2] || 'american east coast';
const { data } = await axios.get('https://api.elevenlabs.io/v1/shared-voices', {
  headers: { 'xi-api-key': apiKey },
  params: { search: q, page_size: 30, gender: undefined },
});

const voices = data.voices || [];
const males = voices.filter((v) => (v.gender || '').toLowerCase() === 'male');
const females = voices.filter((v) => (v.gender || '').toLowerCase() === 'female');

function show(label, list) {
  console.log(`\n## ${label}\n`);
  for (const v of list.slice(0, 8)) {
    console.log(
      `- ${v.name} | id=${v.voice_id} | accent=${v.accent || '?'} | age=${v.age || '?'}`,
    );
    if (v.description) console.log(`  ${v.description.slice(0, 120)}`);
  }
}

console.log(`Search: "${q}" (${voices.length} hits)`);
show('Male (Frankie / Sal)', males);
show('Female (Gina)', females);
console.log(
  '\nPaste voice_id values into voices.config.json, then record scratch files and run node convert_scratch.js',
);
