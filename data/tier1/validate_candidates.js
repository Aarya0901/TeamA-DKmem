// Validates data/tier1/candidates.jsonl:
//   - required fields present and non-empty on every record
//   - no duplicate pair_id, no duplicate (language, utterance_a, utterance_b), no a==b pair
//   - distinction_class in the 7-class taxonomy; source_type in {template_generated, hand_authored}
//   - gold_relation in {same, different} for template_generated records; null (unlabeled) for
//     hand_authored records, which must all come after the template_generated block
//   - class coverage (all 7 classes present) and language coverage (Hindi + >=1 non-Indic language)
// Exits 1 on any error. Prints counts by class, language, class x language, and source_type.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'candidates.jsonl');
const REQUIRED_FIELDS = [
  'pair_id', 'language', 'distinction_class', 'utterance_a', 'utterance_b',
  'distinction_value_a', 'distinction_value_b', 'english_gloss', 'gold_relation', 'source_type',
];
const REQUIRED_CLASSES = [
  'kinship', 'honorific_register', 'name_variant', 'evidentiality',
  'classifier_measure', 'politeness_relationship', 'spatial_temporal_deixis',
];
const VALID_GOLD_RELATION = ['same', 'different'];
const VALID_SOURCE_TYPES = ['template_generated', 'hand_authored'];
// hand_authored records are deliberately unlabeled: gold_relation must be present but null.
const NULL_FIELDS_BY_SOURCE = { hand_authored: ['gold_relation'] };
const INDIC_LANGUAGES = ['hi'];

function fail(errors) {
  console.error(`FAILED: ${errors.length} error(s)`);
  for (const e of errors.slice(0, 50)) console.error(' - ' + e);
  if (errors.length > 50) console.error(`   ...and ${errors.length - 50} more`);
  process.exit(1);
}

const raw = fs.readFileSync(FILE, 'utf8').trim();
if (!raw) fail(['candidates.jsonl is empty']);
const lines = raw.split('\n');

const errors = [];
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

  const nullFields = NULL_FIELDS_BY_SOURCE[r.source_type] || [];
  for (const f of REQUIRED_FIELDS) {
    if (nullFields.includes(f)) {
      if (!(f in r) || r[f] !== null) {
        errors.push(`line ${i + 1} (${r.pair_id || '?'}): ${r.source_type} record must have '${f}' present and null (unlabeled)`);
      }
    } else if (!(f in r) || r[f] === null || r[f] === undefined || String(r[f]).trim() === '') {
      errors.push(`line ${i + 1} (${r.pair_id || '?'}): missing/empty required field '${f}'`);
    }
  }
  if (r.source_type && !VALID_SOURCE_TYPES.includes(r.source_type)) {
    errors.push(`line ${i + 1} (${r.pair_id}): source_type must be one of ${VALID_SOURCE_TYPES.join('/')}, got '${r.source_type}'`);
  }
  if (r.distinction_class && !REQUIRED_CLASSES.includes(r.distinction_class)) {
    errors.push(`line ${i + 1} (${r.pair_id}): unknown distinction_class '${r.distinction_class}'`);
  }
  if (r.gold_relation && !VALID_GOLD_RELATION.includes(r.gold_relation)) {
    errors.push(`line ${i + 1} (${r.pair_id}): gold_relation must be one of ${VALID_GOLD_RELATION.join('/')}, got '${r.gold_relation}'`);
  }
  if (r.utterance_a && r.utterance_b && r.utterance_a === r.utterance_b) {
    errors.push(`line ${i + 1} (${r.pair_id}): utterance_a and utterance_b are identical`);
  }
  if (r.distinction_value_a && r.distinction_value_b && r.distinction_value_a === r.distinction_value_b) {
    errors.push(`line ${i + 1} (${r.pair_id}): distinction_value_a and distinction_value_b are identical`);
  }
});

// ordering: hand_authored records are appended after the template_generated block, so template
// pair_ids stay stable when the supplement changes
const firstHand = records.findIndex(r => r.source_type === 'hand_authored');
if (firstHand !== -1) {
  const late = records.slice(firstHand).filter(r => r.source_type !== 'hand_authored');
  if (late.length) errors.push(`${late.length} non-hand_authored record(s) appear after the first hand_authored record (e.g. '${late[0].pair_id}')`);
}

// duplicate pair_id
const idSeen = new Map();
for (const r of records) {
  if (!r.pair_id) continue;
  if (idSeen.has(r.pair_id)) {
    errors.push(`duplicate pair_id '${r.pair_id}' (lines ${idSeen.get(r.pair_id)} and ${records.indexOf(r) + 1})`);
  } else {
    idSeen.set(r.pair_id, records.indexOf(r) + 1);
  }
}

// duplicate (language, utterance_a, utterance_b)
const pairSeen = new Map();
for (const r of records) {
  if (!r.language || !r.utterance_a || !r.utterance_b) continue;
  const key = `${r.language}|${r.utterance_a}|${r.utterance_b}`;
  if (pairSeen.has(key)) {
    errors.push(`duplicate (language, utterance_a, utterance_b) for pair_id '${r.pair_id}' (same as '${pairSeen.get(key)}')`);
  } else {
    pairSeen.set(key, r.pair_id);
  }
}

if (errors.length) fail(errors);

// coverage
const byClass = {};
const byLang = {};
const byClassLang = {};
const bySource = {};
const byClassLangSource = {};
for (const r of records) {
  bySource[r.source_type] = (bySource[r.source_type] || 0) + 1;
  const ks = `${r.distinction_class}/${r.language}/${r.source_type}`;
  byClassLangSource[ks] = (byClassLangSource[ks] || 0) + 1;
  byClass[r.distinction_class] = (byClass[r.distinction_class] || 0) + 1;
  byLang[r.language] = (byLang[r.language] || 0) + 1;
  const k = `${r.distinction_class}/${r.language}`;
  byClassLang[k] = (byClassLang[k] || 0) + 1;
}

const missingClasses = REQUIRED_CLASSES.filter(c => !byClass[c]);
if (missingClasses.length) fail([`missing coverage for class(es): ${missingClasses.join(', ')}`]);

const hasIndic = INDIC_LANGUAGES.some(l => byLang[l]);
const nonIndicLangs = Object.keys(byLang).filter(l => !INDIC_LANGUAGES.includes(l));
if (!hasIndic) fail(['no Hindi/Hinglish (hi) records found']);
if (!nonIndicLangs.length) fail(['no non-Indic language records found']);

console.log(`OK: ${records.length} records, 0 errors`);
console.log(`\nCounts by class:`);
for (const c of REQUIRED_CLASSES) console.log(`  ${c.padEnd(24)} ${byClass[c] || 0}`);
console.log(`\nCounts by language:`);
for (const l of Object.keys(byLang).sort()) console.log(`  ${l.padEnd(24)} ${byLang[l]}`);
console.log(`\nCounts by class x language:`);
for (const k of Object.keys(byClassLang).sort()) console.log(`  ${k.padEnd(34)} ${byClassLang[k]}`);
console.log(`\nCounts by source_type:`);
for (const s of Object.keys(bySource).sort()) console.log(`  ${s.padEnd(24)} ${bySource[s]}`);
console.log(`\nCounts by class x language x source_type:`);
for (const k of Object.keys(byClassLangSource).sort()) console.log(`  ${k.padEnd(54)} ${byClassLangSource[k]}`);
console.log(`\nHindi/Hinglish present: yes. Non-Indic languages present: ${nonIndicLangs.join(', ')}`);
