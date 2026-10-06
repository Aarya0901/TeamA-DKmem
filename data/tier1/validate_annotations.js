// Validates data/tier1/annotations_template.jsonl (or any annotation file with the same schema,
// e.g. a filled-in per-annotator copy):
//   - schema: every record has exactly the 8 required keys, no extras, no missing
//   - enum: grammaticality/minimal_pair/relation are null or one of their allowed values
//   - completeness: exactly one record per pair_id in candidates.jsonl -- no missing, no duplicate,
//     no unknown pair_id
//   - consistency: if relation == "ambiguous", the annotator should be using ambiguity_reason
//     (warning only, not an error -- this validator does not judge annotation content, only shape)
// Exits 1 on any schema/enum/completeness error. Prints a summary otherwise.
//
// Usage: node validate_annotations.js [path-to-annotations-file]
// Defaults to annotations_template.jsonl.

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'pair_id', 'annotator_id', 'grammaticality', 'minimal_pair',
  'relation', 'ambiguity_reason', 'suggested_fix', 'notes',
];
const ENUMS = {
  grammaticality: ['grammatical', 'ungrammatical', 'unnatural_but_grammatical'],
  minimal_pair: ['yes', 'no'],
  relation: ['same', 'different', 'ambiguous'],
};

const annotationsPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'annotations_template.jsonl');
const candidatesPath = path.join(__dirname, 'candidates.jsonl');

function fail(errors) {
  console.error(`FAILED: ${errors.length} error(s)`);
  for (const e of errors.slice(0, 50)) console.error(' - ' + e);
  if (errors.length > 50) console.error(`   ...and ${errors.length - 50} more`);
  process.exit(1);
}

const candidateIds = new Set(
  fs.readFileSync(candidatesPath, 'utf8').trim().split('\n').map(l => JSON.parse(l).pair_id)
);

const raw = fs.readFileSync(annotationsPath, 'utf8').trim();
if (!raw) fail(['annotations file is empty']);
const lines = raw.split('\n');

const errors = [];
const warnings = [];
const records = [];
lines.forEach((line, i) => {
  let r;
  try {
    r = JSON.parse(line);
  } catch (e) {
    errors.push(`line ${i + 1}: invalid JSON (${e.message})`);
    return;
  }
  records.push(r);

  const keys = Object.keys(r);
  for (const f of REQUIRED_FIELDS) {
    if (!(f in r)) errors.push(`line ${i + 1} (${r.pair_id || '?'}): missing required field '${f}'`);
  }
  for (const k of keys) {
    if (!REQUIRED_FIELDS.includes(k)) errors.push(`line ${i + 1} (${r.pair_id || '?'}): unexpected extra field '${k}'`);
  }
  if (!r.pair_id || typeof r.pair_id !== 'string') {
    errors.push(`line ${i + 1}: pair_id missing or not a string`);
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = r[field];
    if (v !== null && v !== undefined && !allowed.includes(v)) {
      errors.push(`line ${i + 1} (${r.pair_id}): ${field} must be null or one of [${allowed.join(', ')}], got '${v}'`);
    }
  }
  if (r.relation === 'ambiguous' && !r.ambiguity_reason) {
    warnings.push(`line ${i + 1} (${r.pair_id}): relation is 'ambiguous' but ambiguity_reason is empty`);
  }
});

if (errors.length) fail(errors);

// completeness against candidates.jsonl
const seen = new Map();
for (const r of records) {
  if (seen.has(r.pair_id)) errors.push(`duplicate pair_id '${r.pair_id}'`);
  seen.set(r.pair_id, (seen.get(r.pair_id) || 0) + 1);
}
const missing = [...candidateIds].filter(id => !seen.has(id));
const unknown = [...seen.keys()].filter(id => !candidateIds.has(id));
if (missing.length) errors.push(`missing annotation records for ${missing.length} candidate pair_id(s): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}`);
if (unknown.length) errors.push(`${unknown.length} pair_id(s) not found in candidates.jsonl: ${unknown.slice(0, 10).join(', ')}${unknown.length > 10 ? ', ...' : ''}`);

if (errors.length) fail(errors);

const filled = {
  grammaticality: records.filter(r => r.grammaticality !== null).length,
  minimal_pair: records.filter(r => r.minimal_pair !== null).length,
  relation: records.filter(r => r.relation !== null).length,
  annotator_id: records.filter(r => r.annotator_id && r.annotator_id !== '').length,
};

console.log(`OK: ${records.length} records, 0 errors, ${warnings.length} warning(s)`);
console.log(`candidates.jsonl coverage: ${records.length}/${candidateIds.size} pair_ids, exact 1:1 match`);
console.log(`\nJudgment fields filled in (0 expected for a fresh template):`);
for (const [k, v] of Object.entries(filled)) console.log(`  ${k.padEnd(14)} ${v}`);
if (warnings.length) {
  console.log(`\nWarnings:`);
  for (const w of warnings.slice(0, 20)) console.log(' - ' + w);
}
