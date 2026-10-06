// Builds data/tier1/tier1_eval_v2.jsonl from the two LLM-adjudicated annotation files:
//   annotations/llm_adjudicated.jsonl      (original 186 candidates, t1_0001..t1_0186)
//   annotations/llm_new_adjudicated.jsonl  (40 hand-authored candidates, t1_0187..t1_0226)
// Inclusion rule: grammaticality == grammatical, minimal_pair == yes, relation in {same, different}.
// language/class/utterances are joined from candidates.jsonl; gold_relation is dropped on read
// and never consulted. Labels are LLM-annotated/adjudicated, NOT human gold.
//
// Usage: node data/tier1/scripts/build_tier1_eval_v2.js

const fs = require('fs');
const path = require('path');

const TIER1 = path.join(__dirname, '..');
const SOURCES = [
  { file: 'annotations/llm_adjudicated.jsonl', batch: 'original_186' },
  { file: 'annotations/llm_new_adjudicated.jsonl', batch: 'new_40' },
];
const OUT = path.join(TIER1, 'tier1_eval_v2.jsonl');

const readJsonl = f =>
  fs.readFileSync(path.join(TIER1, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

const candidates = new Map();
for (const c of readJsonl('candidates.jsonl')) {
  const { gold_relation, ...rest } = c; // eslint-disable-line no-unused-vars
  candidates.set(c.pair_id, rest);
}

const out = [];
const excluded = [];
const seen = new Set();
for (const { file, batch } of SOURCES) {
  for (const r of readJsonl(file)) {
    if (seen.has(r.pair_id)) throw new Error(`duplicate pair_id ${r.pair_id}`);
    seen.add(r.pair_id);
    const c = candidates.get(r.pair_id);
    if (!c) throw new Error(`pair_id ${r.pair_id} not in candidates.jsonl`);
    if (r.label_source !== 'llm_adjudicated_not_human_gold') throw new Error(`unexpected label_source ${r.pair_id}`);

    const keep = r.grammaticality === 'grammatical' && r.minimal_pair === 'yes' &&
      (r.relation === 'same' || r.relation === 'different');
    if (!keep) {
      excluded.push({ pair_id: r.pair_id, batch, language: c.language, distinction_class: c.distinction_class,
        grammaticality: r.grammaticality, minimal_pair: r.minimal_pair, relation: r.relation });
      continue;
    }

    const provenance = {
      label_source: r.label_source,
      batch,
      source_type: c.source_type,
      adjudicated_file: `data/tier1/${file}`,
      adjudication_status: r.adjudication_status,
      annotators: [r.annotation_A, r.annotation_B].map(a => ({ annotator_id: a.annotator_id, relation: a.relation })),
      grammaticality: r.grammaticality,
      minimal_pair: r.minimal_pair,
    };
    if (r.grammaticality_status) provenance.grammaticality_status = r.grammaticality_status;

    out.push({
      pair_id: r.pair_id,
      language: c.language,
      distinction_class: c.distinction_class,
      utterance_a: c.utterance_a,
      utterance_b: c.utterance_b,
      distinction_value_a: c.distinction_value_a,
      distinction_value_b: c.distinction_value_b,
      relation: r.relation,
      provenance,
    });
  }
}
if (seen.size !== candidates.size) throw new Error(`covered ${seen.size} of ${candidates.size} candidates`);

fs.writeFileSync(OUT, out.map(r => JSON.stringify(r)).join('\n') + '\n');

const tally = (rows, key) => {
  const t = {};
  for (const r of rows) {
    const k = typeof key === 'function' ? key(r) : r[key];
    t[k] = t[k] || { same: 0, different: 0, total: 0 };
    t[k][r.relation]++;
    t[k].total++;
  }
  return t;
};
console.log(`wrote ${out.length} records to ${path.relative(process.cwd(), OUT)} (${excluded.length} excluded)`);
console.log('by relation:', tally(out, () => 'all').all);
console.log('by class:', tally(out, 'distinction_class'));
console.log('by language:', tally(out, 'language'));
console.log('by batch:', tally(out, r => r.provenance.batch));
console.log('by adjudication_status:', tally(out, r => r.provenance.adjudication_status));
console.log('excluded:', JSON.stringify(excluded));
