// Generates data/tier1/annotations_template.jsonl: one blank annotation record per candidate in
// candidates.jsonl, keyed by pair_id. Makes no grammaticality/minimality/relation judgments --
// every judgment field is null. annotator_id is "" (each annotator copies this file and fills in
// their own id, per docs/tier1_annotation_protocol.md).

const fs = require('fs');
const path = require('path');

const candidatesPath = path.join(__dirname, 'candidates.jsonl');
const outPath = path.join(__dirname, 'annotations_template.jsonl');

const candidates = fs.readFileSync(candidatesPath, 'utf8').trim().split('\n').map(JSON.parse);

const out = candidates.map(c => ({
  pair_id: c.pair_id,
  annotator_id: '',
  grammaticality: null,
  minimal_pair: null,
  relation: null,
  ambiguity_reason: null,
  suggested_fix: null,
  notes: null,
}));

fs.writeFileSync(outPath, out.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`wrote ${out.length} blank annotation records to ${outPath}`);
