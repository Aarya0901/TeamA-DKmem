// Builds the blinded Tier 1 v2 evaluation inputs from data/tier1/tier1_eval_v2.jsonl
// (see docs/tier1_eval_contract.md):
//   eval_input/teamA_tier1_v2.jsonl   -- what Team A's pipeline ingests. Keyed by a random eval_pair_id;
//                                        no original pair_id, relation, class, or provenance.
//   eval_input/teamB_answer_key.jsonl -- Team B's scoring key: eval_pair_id <-> original pair_id, gold
//                                        relation, and the IDs Team A echoes back.
// All Team A IDs (eval_pair_id, opaque entity IDs) come from crypto.randomBytes, not from pair_id or
// relation, so they carry no information about either. Team A records are ordered by eval_pair_id,
// which is a random order (the t1_XXXX order would group records by class).
//
// The random mapping is stored in the answer key and REUSED on rebuild, so existing Team A outputs
// stay scoreable. Pass --regenerate to draw fresh IDs (invalidates any outputs made with the old ones).
// Validates both files and exits 1 on any failure. tier1_eval_v2.jsonl is only read.
//
// Usage: node data/tier1/scripts/build_tier1_eval_inputs.js [--regenerate]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TIER1 = path.join(__dirname, '..');
const SRC = path.join(TIER1, 'tier1_eval_v2.jsonl');
const OUT_DIR = path.join(TIER1, 'eval_input');
const TEAM_A = path.join(OUT_DIR, 'teamA_tier1_v2.jsonl');
const KEY = path.join(OUT_DIR, 'teamB_answer_key.jsonl');
const EXPECTED_N = 173;

const TEAM_A_FIELDS = ['eval_pair_id', 'language', 'utterance_a', 'utterance_b',
  'utterance_a_id', 'utterance_b_id', 'opaque_entity_id_a', 'opaque_entity_id_b'];
const KEY_FIELDS = ['eval_pair_id', 'pair_id', 'relation', 'distinction_class', 'language',
  'utterance_a_id', 'utterance_b_id', 'opaque_entity_id_a', 'opaque_entity_id_b'];
const PAIR_ID_RE = /^ep_[0-9a-f]{12}$/;
const ENT_ID_RE = /^ent_[0-9a-f]{16}$/;

const readJsonl = f => fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const writeJsonl = (f, rows) => fs.writeFileSync(f, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
const rand = bytes => crypto.randomBytes(bytes).toString('hex');

const srcBefore = fs.readFileSync(SRC);
const eval2 = readJsonl(SRC);

// Reuse an existing random mapping (pair_id -> IDs) unless asked to regenerate.
let mapping = new Map();
if (!process.argv.includes('--regenerate') && fs.existsSync(KEY)) {
  const old = readJsonl(KEY);
  const complete = old.length === eval2.length && old.every(r => PAIR_ID_RE.test(r.eval_pair_id || '') &&
    ENT_ID_RE.test(r.opaque_entity_id_a || '') && ENT_ID_RE.test(r.opaque_entity_id_b || ''));
  if (complete) mapping = new Map(old.map(r => [r.pair_id, r]));
}
const reused = mapping.size > 0;
const used = new Set();
const fresh = (gen) => { let id; do id = gen(); while (used.has(id)); used.add(id); return id; };

const key = [];
for (const r of eval2) {
  const m = mapping.get(r.pair_id);
  if (reused && !m) throw new Error(`existing key has no mapping for ${r.pair_id}; rerun with --regenerate`);
  const eval_pair_id = m ? m.eval_pair_id : fresh(() => 'ep_' + rand(6));
  const opaque_entity_id_a = m ? m.opaque_entity_id_a : fresh(() => 'ent_' + rand(8));
  const opaque_entity_id_b = m ? m.opaque_entity_id_b : fresh(() => 'ent_' + rand(8));
  key.push({
    eval_pair_id,
    pair_id: r.pair_id,
    relation: r.relation,
    distinction_class: r.distinction_class,
    language: r.language,
    utterance_a_id: `${eval_pair_id}_utt_a`,
    utterance_b_id: `${eval_pair_id}_utt_b`,
    opaque_entity_id_a,
    opaque_entity_id_b,
  });
}
const src = new Map(eval2.map(r => [r.pair_id, r]));
const teamA = key
  .map(k => {
    const s = src.get(k.pair_id);
    return {
      eval_pair_id: k.eval_pair_id,
      language: s.language,
      utterance_a: s.utterance_a,
      utterance_b: s.utterance_b,
      utterance_a_id: k.utterance_a_id,
      utterance_b_id: k.utterance_b_id,
      opaque_entity_id_a: k.opaque_entity_id_a,
      opaque_entity_id_b: k.opaque_entity_id_b,
    };
  })
  .sort((x, y) => (x.eval_pair_id < y.eval_pair_id ? -1 : 1));

fs.mkdirSync(OUT_DIR, { recursive: true });
writeJsonl(TEAM_A, teamA);
writeJsonl(KEY, key);

// ---- validation (re-read from disk) ----
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const A = readJsonl(TEAM_A);
const K = readJsonl(KEY);

check(eval2.length === EXPECTED_N, `tier1_eval_v2 has ${eval2.length} records, expected ${EXPECTED_N}`);
check(A.length === EXPECTED_N, `Team A has ${A.length} records, expected ${EXPECTED_N}`);
check(K.length === EXPECTED_N, `answer key has ${K.length} records, expected ${EXPECTED_N}`);

// Exact 1:1 mapping: eval_pair_id <-> pair_id, and every v2 pair covered exactly once.
const kByEval = new Map(K.map(r => [r.eval_pair_id, r]));
check(kByEval.size === K.length, 'duplicate eval_pair_id in answer key');
check(new Set(K.map(r => r.pair_id)).size === K.length, 'duplicate pair_id in answer key');
check(JSON.stringify(K.map(r => r.pair_id).sort()) === JSON.stringify([...src.keys()].sort()),
  'answer key pair_ids differ from tier1_eval_v2');
check(new Set(A.map(r => r.eval_pair_id)).size === A.length, 'duplicate eval_pair_id in Team A input');
check(JSON.stringify(A.map(r => r.eval_pair_id).sort()) === JSON.stringify([...kByEval.keys()].sort()),
  'eval_pair_id sets differ between Team A input and answer key');

// Team A: exact fields, content matches v2 through the key, no gold/class/provenance/original IDs.
const rawA = fs.readFileSync(TEAM_A, 'utf8');
for (const banned of ['gold_relation', '"relation"', 'distinction_class', 'distinction_value', 'provenance',
  'label_source', '"pair_id"', 'gold_entity_id']) {
  check(!rawA.includes(banned), `Team A input contains ${banned}`);
}
check(!/t1_\d{4}/.test(rawA), 'Team A input contains an original t1_XXXX pair_id');
const allIds = [];
for (const r of A) {
  check(JSON.stringify(Object.keys(r)) === JSON.stringify(TEAM_A_FIELDS), `${r.eval_pair_id}: Team A fields ${Object.keys(r)}`);
  const k = kByEval.get(r.eval_pair_id);
  const s = k && src.get(k.pair_id);
  if (s) {
    check(r.utterance_a === s.utterance_a && r.utterance_b === s.utterance_b && r.language === s.language,
      `${r.eval_pair_id}: utterances/language differ from tier1_eval_v2 (${k.pair_id})`);
    for (const f of ['utterance_a_id', 'utterance_b_id', 'opaque_entity_id_a', 'opaque_entity_id_b']) {
      check(r[f] === k[f], `${r.eval_pair_id}: ${f} differs between Team A input and answer key`);
    }
  }
  check(PAIR_ID_RE.test(r.eval_pair_id), `${r.eval_pair_id}: eval_pair_id format`);
  check(r.utterance_a_id === `${r.eval_pair_id}_utt_a` && r.utterance_b_id === `${r.eval_pair_id}_utt_b`,
    `${r.eval_pair_id}: utterance ID format`);
  check(ENT_ID_RE.test(r.opaque_entity_id_a) && ENT_ID_RE.test(r.opaque_entity_id_b), `${r.eval_pair_id}: opaque ID format`);
  check(r.opaque_entity_id_a !== r.opaque_entity_id_b, `${r.eval_pair_id}: opaque_entity_id_a == opaque_entity_id_b`);
  for (const v of Object.values(r)) check(!/^(same|different|ambiguous)$/i.test(v), `${r.eval_pair_id}: field value is a relation label`);
  allIds.push(r.eval_pair_id, r.opaque_entity_id_a, r.opaque_entity_id_b);
}
check(new Set(allIds).size === 3 * A.length, 'Team A IDs are not globally unique');
// Team A IDs must not be derivable from pair_id: none may equal a deterministic hash of it.
for (const k of K) {
  const h = crypto.createHash('sha256').update(`tier1_v2|${k.pair_id}|a`).digest('hex').slice(0, 16);
  check(k.opaque_entity_id_a !== 'ent_' + h, `${k.pair_id}: opaque ID is the old deterministic hash`);
}
// ID fields must look identical for same and different pairs.
const shape = r => JSON.stringify([r.eval_pair_id.length, r.opaque_entity_id_a === r.opaque_entity_id_b,
  r.opaque_entity_id_a.length, r.opaque_entity_id_b.length,
  r.utterance_a_id.replace(r.eval_pair_id, ''), r.utterance_b_id.replace(r.eval_pair_id, '')]);
const shapesBy = { same: new Set(), different: new Set() };
for (const r of A) shapesBy[kByEval.get(r.eval_pair_id)?.relation]?.add(shape(r));
check(shapesBy.same.size === 1 && shapesBy.different.size === 1 &&
  [...shapesBy.same][0] === [...shapesBy.different][0], 'ID fields differ in shape between same and different pairs');
// Record order must be the random eval_pair_id order, not the class-grouped t1_XXXX order.
check(A.every((r, i) => i === 0 || A[i - 1].eval_pair_id < r.eval_pair_id), 'Team A input is not ordered by eval_pair_id');

// Answer key: exact fields, every gold relation present and matching v2.
for (const r of K) {
  check(JSON.stringify(Object.keys(r)) === JSON.stringify(KEY_FIELDS), `${r.pair_id}: key fields ${Object.keys(r)}`);
  check(r.relation === 'same' || r.relation === 'different', `${r.pair_id}: relation ${r.relation}`);
  const s = src.get(r.pair_id);
  if (s) check(r.relation === s.relation && r.distinction_class === s.distinction_class && r.language === s.language,
    `${r.pair_id}: key differs from tier1_eval_v2`);
}

check(Buffer.compare(srcBefore, fs.readFileSync(SRC)) === 0, 'tier1_eval_v2.jsonl changed');

if (errors.length) {
  console.error(`FAILED: ${errors.length} error(s)`);
  for (const e of errors.slice(0, 50)) console.error(' - ' + e);
  process.exit(1);
}
const count = (rows, k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {});
console.log(`OK: ${A.length} Team A records, ${K.length} answer-key records (${reused ? 'reused existing' : 'new random'} ID mapping)`);
console.log('key relation:', count(K, 'relation'));
console.log('key language:', count(K, 'language'));
