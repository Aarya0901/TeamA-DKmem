// Team B scorer for Tier 1 v2 (see docs/tier1_eval_contract.md). PRIVATE: reads the answer key.
//
// Takes one Team A run (run_manifest.json + pairwise_eval.jsonl), validates both against
// docs/schemas/*.json and the contract, joins entries to the answer key via source_utterance_id,
// and reports FCR / MCR with numerators and denominators overall, per distinction_class, per
// language and per class x language, plus outcome counts split by gold relation.
//
// Scoring follows contract §3-§8:
//   - Ignored records: an entry whose source_utterance_id is not in the key, entries from two
//     different eval_pair_ids (cross-episode), or both entries from the same utterance.
//   - Union-find over entry_id on the remaining merge/supersede records. A pair is "merged" when
//     some utt_a entry and some utt_b entry share a cluster.
//   - Otherwise: "compared_not_merged" if a kept cross-utterance record exists, "no_entry" if an
//     utterance has no entry in any record, else "not_compared". Entries only become visible
//     through records, so an utterance whose entries were never compared counts as no_entry.
//   - Denominators are every gold pair in the key. A relation with n = 0 in a cell -> "n/a". A cell
//     with fewer than 20 gold pairs (both relations together, as in contract §8) is indicative.
// A run is rejected (exit 1, no scores) on schema errors, run_id/strategy mismatches,
// gold_entity_id not matching its source_utterance_id in the key, reused record_id, or one
// entry_id used for entries from different utterances.
//
// The report holds aggregates only (no pair_id, relation or per-pair rows), but it is still
// derived from the key: keep it on the Team B side and never write it next to Team A inputs.
//
// Multi-seed mode (--run, repeated) scores each seed's run as above, then reports mean +- sample SD
// of the per-seed FCR / MCR rates per cell next to each seed's counts. Pair-level counts are never
// pooled across seeds. It needs >= 3 distinct seeds and rejects duplicate seeds or run_ids, and any
// difference in strategy, dataset_tier, backbone or other manifest settings (every field except
// run_id, seed, created_at). A settings key that only some manifests carry is warned about, not compared.
//
// Sweep mode (--sweep breakpoints|<t1,t2,...>, single run only) re-derives merged / not merged at
// each threshold from similarity_score and compatibility and reports the FCR-MCR frontier. The
// rule and what it rejects are documented at sweepRun below.
//
// Usage: node data/tier1/scripts/score_tier1_eval.js --pairwise <pairwise_eval.jsonl>
//          --manifest <run_manifest.json> [--key <answer_key.jsonl>] [--json <report.json>]
//        node data/tier1/scripts/score_tier1_eval.js --run <pairwise_eval.jsonl>,<run_manifest.json>
//          --run ... --run ... [--key <answer_key.jsonl>] [--json <report.json>]
//        node data/tier1/scripts/score_tier1_eval.js --pairwise <pairwise_eval.jsonl>
//          --manifest <run_manifest.json> --sweep breakpoints|<t1,t2,...> [--key ...] [--json ...]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SCHEMA_DIR = path.join(ROOT, 'docs', 'schemas');
const DEFAULT_KEY = path.join(__dirname, '..', 'eval_input', 'teamB_answer_key.jsonl');
const DATASET_TIER = 'tier1_minimal_pairs';
const INDICATIVE_N = 20;
const MIN_SEEDS = 3;
const PER_RUN_FIELDS = new Set(['run_id', 'seed', 'created_at']); // manifest fields allowed to differ across seeds
const MERGING = new Set(['merge', 'supersede']);
const KEY_FIELDS = ['eval_pair_id', 'pair_id', 'relation', 'distinction_class', 'language',
  'utterance_a_id', 'utterance_b_id', 'opaque_entity_id_a', 'opaque_entity_id_b'];
const OUTCOMES = ['merged', 'compared_not_merged', 'not_compared', 'no_entry'];

const readSchema = name => JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, name), 'utf8'));
const parseJsonl = (text, label) => text.split(/\r?\n/).map((l, i) => [l, i + 1]).filter(([l]) => l.trim())
  .map(([l, n]) => { try { return { line: n, value: JSON.parse(l) }; } catch (e) { return { line: n, error: `${label}:${n}: invalid JSON (${e.message})` }; } });

// ---- Minimal draft-07 validator: only the keywords the two schemas use. Unknown keywords throw,
// so a schema change can't be silently skipped.
const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', 'definitions']);
const HANDLED = new Set(['type', 'enum', 'required', 'properties', 'minimum', 'maximum', '$ref', 'if', 'then', 'else', 'format']);
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
const isType = (v, t) => t === 'integer' ? Number.isInteger(v) : t === 'number' ? typeof v === 'number' && Number.isFinite(v) : typeOf(v) === t;

function validate(schema, value, root, at = '$', errors = []) {
  for (const k of Object.keys(schema)) if (!ANNOTATIONS.has(k) && !HANDLED.has(k)) throw new Error(`unsupported schema keyword "${k}" at ${at}`);
  if (schema.$ref) {
    const m = /^#\/definitions\/(.+)$/.exec(schema.$ref);
    if (!m || !root.definitions[m[1]]) throw new Error(`unresolvable $ref ${schema.$ref}`);
    validate(root.definitions[m[1]], value, root, at, errors);
  }
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some(t => isType(value, t))) { errors.push(`${at}: expected ${types.join('|')}, got ${typeOf(value)}`); return errors; }
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: ${JSON.stringify(value)} not in ${JSON.stringify(schema.enum)}`);
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: ${value} < minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: ${value} > maximum ${schema.maximum}`);
  }
  if (schema.format === 'date-time' && typeof value === 'string' && !DATE_TIME_RE.test(value)) errors.push(`${at}: not an RFC 3339 date-time`);
  if (typeOf(value) === 'object') {
    for (const r of schema.required || []) if (!(r in value)) errors.push(`${at}: missing required "${r}"`);
    for (const [p, s] of Object.entries(schema.properties || {})) if (p in value) validate(s, value[p], root, `${at}.${p}`, errors);
  }
  if (schema.if) {
    const branch = validate(schema.if, value, root, at, []).length === 0 ? schema.then : schema.else;
    if (branch) validate(branch, value, root, at, errors);
  }
  return errors;
}

// ---- Answer key
function loadKey(text) {
  const errors = [];
  const rows = parseJsonl(text, 'key');
  const byPair = new Map();
  const byUtt = new Map(); // utterance_id -> { pair, side }
  for (const { line, value: r, error } of rows) {
    if (error) { errors.push(error); continue; }
    const missing = KEY_FIELDS.filter(f => typeof r[f] !== 'string' || !r[f]);
    if (missing.length) { errors.push(`key:${line}: missing ${missing.join(', ')}`); continue; }
    if (!['same', 'different'].includes(r.relation)) errors.push(`key:${line}: relation "${r.relation}"`);
    if (byPair.has(r.eval_pair_id)) errors.push(`key:${line}: duplicate eval_pair_id ${r.eval_pair_id}`);
    if (r.utterance_a_id === r.utterance_b_id) errors.push(`key:${line}: utterance_a_id == utterance_b_id`);
    for (const [side, id] of [['a', r.utterance_a_id], ['b', r.utterance_b_id]]) {
      if (byUtt.has(id)) errors.push(`key:${line}: duplicate utterance id ${id}`);
      byUtt.set(id, { pair: r, side });
    }
    byPair.set(r.eval_pair_id, r);
  }
  if (!byPair.size) errors.push('key: no rows');
  return { byPair, byUtt, errors };
}

// ---- Run validation + scoring
function validateRun({ manifest, pairwiseText, keyText }) {
  const key = loadKey(keyText);
  if (key.errors.length) return { ok: false, errors: key.errors.map(e => `answer key: ${e}`), warnings: [] };
  const errors = [];
  const warnings = [];
  const manifestSchema = readSchema('run_manifest.schema.json');
  const pairSchema = readSchema('pairwise_eval.schema.json');

  errors.push(...validate(manifestSchema, manifest, manifestSchema, 'run_manifest').map(e => `schema: ${e}`));
  if (manifest && manifest.dataset_tier !== DATASET_TIER) errors.push(`run_manifest.dataset_tier must be "${DATASET_TIER}"`);
  if (manifest && !pairSchema.properties.strategy.enum.includes(manifest.strategy)) errors.push(`run_manifest.strategy "${manifest.strategy}" is not a PairwiseEvalRecord strategy`);

  const records = [];
  const recordIds = new Set();
  const entryInfo = new Map(); // entry_id -> source_utterance_id
  for (const { line, value: r, error } of parseJsonl(pairwiseText, 'pairwise_eval')) {
    if (error) { errors.push(error); continue; }
    const at = `pairwise_eval:${line}`;
    const schemaErrors = validate(pairSchema, r, pairSchema, at);
    if (schemaErrors.length) { errors.push(...schemaErrors.map(e => `schema: ${e}`)); continue; }
    if (manifest && r.run_id !== manifest.run_id) errors.push(`${at}: run_id "${r.run_id}" != manifest "${manifest.run_id}"`);
    if (manifest && r.strategy !== manifest.strategy) errors.push(`${at}: strategy "${r.strategy}" != manifest "${manifest.strategy}"`);
    if (recordIds.has(r.record_id)) errors.push(`${at}: duplicate record_id "${r.record_id}"`);
    recordIds.add(r.record_id);
    for (const side of ['entry_a', 'entry_b']) {
      const e = r[side];
      const src = e.source_utterance_id ?? null;
      if (entryInfo.has(e.entry_id) && entryInfo.get(e.entry_id) !== src) {
        errors.push(`${at}: ${side}.entry_id "${e.entry_id}" is also used for an entry from ${JSON.stringify(entryInfo.get(e.entry_id))} (entry_id must be unique per entry)`);
      }
      entryInfo.set(e.entry_id, src);
      const k = src !== null && key.byUtt.get(src);
      if (!k) continue;
      const gold = k.side === 'a' ? k.pair.opaque_entity_id_a : k.pair.opaque_entity_id_b;
      if (e.gold_entity_id !== gold) errors.push(`${at}: ${side}.gold_entity_id does not match its source_utterance_id "${src}" in the key`);
      if (e.language !== k.pair.language) warnings.push(`${at}: ${side}.language "${e.language}" != input language for ${src}`);
    }
    if (r.decision === 'supersede' && ![r.entry_a.entry_id, r.entry_b.entry_id].includes(r.superseded_entry_id)) {
      warnings.push(`${at}: supersede with superseded_entry_id not equal to entry_a or entry_b`);
    }
    records.push(r);
  }
  if (errors.length) return { ok: false, errors, warnings };
  return { ok: true, errors, warnings, key, records };
}

// Splits records into kept cross-utterance records and ignored ones (contract §3), and collects
// the entries seen per utterance, including entries that only appear in ignored records.
function classifyRecords(records, key) {
  const ignored = { unknown_utterance: 0, cross_episode: 0, same_utterance: 0 };
  const seen = new Map(); // utterance_id -> Set(entry_id)
  const kept = [];
  for (const r of records) {
    const ka = key.byUtt.get(r.entry_a.source_utterance_id);
    const kb = key.byUtt.get(r.entry_b.source_utterance_id);
    for (const [k, e] of [[ka, r.entry_a], [kb, r.entry_b]]) {
      if (!k) continue;
      if (!seen.has(e.source_utterance_id)) seen.set(e.source_utterance_id, new Set());
      seen.get(e.source_utterance_id).add(e.entry_id);
    }
    if (!ka || !kb) ignored.unknown_utterance++;
    else if (ka.pair.eval_pair_id !== kb.pair.eval_pair_id) ignored.cross_episode++;
    else if (ka.side === kb.side) ignored.same_utterance++;
    else kept.push(r);
  }
  return { kept, seen, ignored };
}

// Union-find over entry_id on the kept records for which isMerged(record) is true, then one
// outcome per gold pair in the key.
function pairOutcomes(key, kept, seen, isMerged) {
  const parent = new Map();
  const find = x => { while (parent.has(x) && parent.get(x) !== x) x = parent.get(x); return x; };
  const union = (x, y) => { for (const v of [x, y]) if (!parent.has(v)) parent.set(v, v); const rx = find(x), ry = find(y); if (rx !== ry) parent.set(rx, ry); };
  const compared = new Set();
  for (const r of kept) {
    compared.add(key.byUtt.get(r.entry_a.source_utterance_id).pair.eval_pair_id);
    if (isMerged(r)) union(r.entry_a.entry_id, r.entry_b.entry_id);
  }

  const outcomes = [];
  for (const p of key.byPair.values()) {
    const ea = seen.get(p.utterance_a_id) || new Set();
    const eb = seen.get(p.utterance_b_id) || new Set();
    const rootsA = new Set([...ea].map(find));
    let outcome;
    if ([...eb].some(e => rootsA.has(find(e)))) outcome = 'merged';
    else if (compared.has(p.eval_pair_id)) outcome = 'compared_not_merged';
    else if (!ea.size || !eb.size) outcome = 'no_entry';
    else outcome = 'not_compared';
    outcomes.push({ relation: p.relation, distinction_class: p.distinction_class, language: p.language, outcome });
  }
  return outcomes;
}

function scoreRun({ manifest, pairwiseText, keyText }) {
  const v = validateRun({ manifest, pairwiseText, keyText });
  if (!v.ok) return v;
  const { kept, seen, ignored } = classifyRecords(v.records, v.key);
  const outcomes = pairOutcomes(v.key, kept, seen, r => MERGING.has(r.decision));
  return { ok: true, errors: v.errors, warnings: v.warnings, report: buildReport(manifest, outcomes, v.records.length, kept.length, ignored) };
}

// ---- Threshold sweep (FCR-MCR frontier)
// Re-derives merged / not merged per kept cross-utterance record at each tau, using only the rules
// the docs define (experiment_output_spec.md "Threshold-sweep contract"; research_idea_context.md
// merge gating):
//   compatibility null (no gating):    merged(tau) := similarity_score > tau
//   compatibility set (DK-Mem gating): merged(tau) := similarity_score > tau AND compatibility == "compatible"
// "incompatible" and "underdetermined" block the merge at every tau. merge / supersede vs
// no_merge / underdetermined_link only matters as merged vs not, so the exact decision isn't rebuilt.
// Not-compared and no-entry pairs have no score and stay constant at every tau (contract §6).
// Records whose rule is undefined are rejected, not guessed: a kept record with no compatibility
// field, a run mixing null and non-null compatibility, or a DK-Mem run with null compatibility.
const sweepMerged = (r, tau) => r.similarity_score > tau && (r.compatibility === null || r.compatibility === 'compatible');

function parseThresholds(spec) {
  if (spec === 'breakpoints') return { thresholds: 'breakpoints' };
  const parts = String(spec).split(',').map(p => p.trim());
  const bad = parts.filter(p => !/^(\d+(\.\d*)?|\.\d+)$/.test(p) || Number(p) > 1);
  if (bad.length) return { error: `--sweep takes "breakpoints" or comma-separated thresholds in [0, 1]; bad: ${bad.map(b => JSON.stringify(b)).join(', ')}` };
  return { thresholds: [...new Set(parts.map(Number))].sort((a, b) => a - b) };
}

function sweepRun({ manifest, pairwiseText, keyText, thresholds }) {
  const v = validateRun({ manifest, pairwiseText, keyText });
  if (!v.ok) return v;
  const { kept, seen, ignored } = classifyRecords(v.records, v.key);
  const errors = [];
  const warnings = [...v.warnings];

  const missing = kept.filter(r => !('compatibility' in r)).map(r => r.record_id);
  if (missing.length) errors.push(`sweep: ${missing.length} scored record(s) have no compatibility field (need null or a value), e.g. ${missing.slice(0, 5).join(', ')}`);
  const gated = kept.filter(r => r.compatibility != null).length;
  const ungated = kept.filter(r => r.compatibility === null).length;
  if (gated && ungated) errors.push(`sweep: run mixes null (${ungated}) and non-null (${gated}) compatibility, so no single merge rule applies`);
  if (manifest.strategy.startsWith('dk-mem') && ungated && !gated) errors.push(`sweep: ${manifest.strategy} is a DK-Mem variant but every scored record has compatibility null`);
  if (thresholds !== 'breakpoints' && (!Array.isArray(thresholds) || !thresholds.length || thresholds.some(t => typeof t !== 'number' || !(t >= 0 && t <= 1)))) {
    errors.push('sweep: thresholds must be "breakpoints" or a non-empty list of numbers in [0, 1]');
  }
  if (errors.length) return { ok: false, errors, warnings };

  const taus = thresholds === 'breakpoints'
    ? [...new Set([0, ...kept.map(r => r.similarity_score)])].sort((a, b) => a - b)
    : thresholds;

  // Diagnostic: does the rule at each record's own tau reproduce the system's decision?
  const disagree = kept.filter(r => sweepMerged(r, r.threshold) !== MERGING.has(r.decision));
  if (disagree.length) {
    warnings.push(`sweep: at each record's own threshold, the sweep rule disagrees with the system's decision on ${disagree.length}/${kept.length} scored records ` +
      `(e.g. ${disagree.slice(0, 5).map(r => r.record_id).join(', ')}); the frontier is the spec's re-derived rule, not the system's own decisions`);
  }
  const runThresholds = [...new Set(kept.map(r => r.threshold))].sort((a, b) => a - b);

  const points = taus.map(tau => {
    const rep = buildReport(manifest, pairOutcomes(v.key, kept, seen, r => sweepMerged(r, tau)), v.records.length, kept.length, ignored);
    return { tau, overall: rep.overall, by_class: rep.by_class, by_language: rep.by_language, by_class_language: rep.by_class_language, outcome_breakdown: rep.outcome_breakdown };
  });
  return {
    ok: true, errors: [], warnings,
    report: {
      label: LABEL,
      mode: 'sweep',
      run: runInfo(manifest),
      records: { total: v.records.length, scored_cross_utterance: kept.length, ignored },
      rule: gated ? 'merged(tau) := similarity_score > tau AND compatibility == "compatible"' : 'merged(tau) := similarity_score > tau',
      gating: gated ? 'compatibility' : 'none',
      thresholds: thresholds === 'breakpoints' ? 'breakpoints: 0 and every distinct similarity_score among scored records' : 'explicit',
      run_thresholds: runThresholds,
      decision_consistency: { scored_records: kept.length, agree: kept.length - disagree.length, disagree: disagree.length },
      points,
      indicative_threshold_n: INDICATIVE_N,
    },
  };
}

function cell(rows) {
  const diff = rows.filter(r => r.relation === 'different');
  const same = rows.filter(r => r.relation === 'same');
  const fcrNum = diff.filter(r => r.outcome === 'merged').length;
  const mcrNum = same.filter(r => r.outcome !== 'merged').length;
  const rate = (num, n) => ({ numerator: num, n, rate: n ? num / n : 'n/a' });
  return { n_gold_pairs: rows.length, indicative: rows.length < INDICATIVE_N, FCR: rate(fcrNum, diff.length), MCR: rate(mcrNum, same.length) };
}

function groupBy(outcomes, keyFn) {
  const groups = new Map();
  for (const o of outcomes) { const k = keyFn(o); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); }
  return Object.fromEntries([...groups.keys()].sort().map(k => [k, cell(groups.get(k))]));
}

const LABEL = 'Tier 1 v2, LLM-annotated, provisional';
const runInfo = m => ({ run_id: m.run_id, strategy: m.strategy, backbone: m.backbone ?? null, seed: m.seed });

function buildReport(manifest, outcomes, nRecords, nKept, ignored) {
  const breakdown = {};
  for (const rel of ['different', 'same']) {
    breakdown[rel] = Object.fromEntries(OUTCOMES.map(o => [o, outcomes.filter(x => x.relation === rel && x.outcome === o).length]));
  }
  return {
    label: LABEL,
    run: runInfo(manifest),
    records: { total: nRecords, scored_cross_utterance: nKept, ignored },
    overall: cell(outcomes),
    by_class: groupBy(outcomes, o => o.distinction_class),
    by_language: groupBy(outcomes, o => o.language),
    by_class_language: groupBy(outcomes, o => `${o.distinction_class} x ${o.language}`),
    outcome_breakdown: breakdown,
    indicative_threshold_n: INDICATIVE_N,
  };
}

// ---- Multi-seed summary (see header). With one shared key every seed has the same denominators,
// so mean-of-rates and pooled rates coincide numerically; the per-seed rates are still the input.
function mismatchErrors(results) {
  const errors = [];
  const warnings = [];
  const manifests = results.map(r => r.manifest);
  const labelled = get => results.map(r => `${r.label}=${JSON.stringify(get(r.manifest))}`).join(', ');

  const seeds = manifests.map(m => m.seed);
  const dupSeeds = [...new Set(seeds.filter((s, i) => seeds.indexOf(s) !== i))];
  if (dupSeeds.length) errors.push(`duplicate seed(s) ${dupSeeds.join(', ')}: ${labelled(m => m.seed)}`);
  if (new Set(seeds).size < MIN_SEEDS) errors.push(`need at least ${MIN_SEEDS} distinct seeds, got ${new Set(seeds).size}`);
  const runIds = manifests.map(m => m.run_id);
  if (new Set(runIds).size < runIds.length) errors.push(`duplicate run_id: ${labelled(m => m.run_id)}`);

  // Everything except per-run identity must match: strategy, dataset_tier, backbone and any extra
  // settings keys a manifest carries (the schema has no settings field but allows extra keys).
  const keys = new Set(manifests.flatMap(m => Object.keys(m)));
  for (const k of [...keys].filter(k => !PER_RUN_FIELDS.has(k)).sort()) {
    const get = m => (k === 'backbone' ? m.backbone ?? null : m[k]);
    const present = manifests.filter(m => k === 'backbone' || k in m).length;
    if (present < manifests.length) { warnings.push(`manifest setting "${k}" is in only ${present}/${manifests.length} runs, so it can't be compared: ${labelled(get)}`); continue; }
    if (new Set(manifests.map(m => JSON.stringify(get(m)))).size > 1) errors.push(`${k} differs across runs: ${labelled(get)}`);
  }
  return { errors, warnings };
}

function stat(perSeed) {
  const rated = perSeed.filter(p => p.rate !== 'n/a');
  if (!rated.length) return { mean: 'n/a', sd: 'n/a', n_seeds: perSeed.length, per_seed: perSeed };
  if (rated.length !== perSeed.length) throw new Error('a cell has n = 0 in some seeds but not others; runs were not scored against the same key');
  const xs = rated.map(p => p.rate);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = xs.length > 1 ? Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (xs.length - 1)) : 'n/a';
  return { mean, sd, n_seeds: xs.length, per_seed: perSeed };
}

function summarizeCells(reports, get) {
  const perSeed = (c, metric, rep) => ({ seed: rep.run.seed, ...(c ? c[metric] : { numerator: 0, n: 0, rate: 'n/a' }) });
  const cells = reports.map(get);
  const first = cells.find(Boolean);
  return {
    n_gold_pairs: first.n_gold_pairs,
    indicative: first.indicative,
    FCR: stat(cells.map((c, i) => perSeed(c, 'FCR', reports[i]))),
    MCR: stat(cells.map((c, i) => perSeed(c, 'MCR', reports[i]))),
  };
}

function summarizeSeeds(reports) {
  const group = name => {
    const keys = [...new Set(reports.flatMap(r => Object.keys(r[name])))].sort();
    return Object.fromEntries(keys.map(k => [k, summarizeCells(reports, r => r[name][k])]));
  };
  return {
    label: reports[0].label,
    mode: 'multi_seed',
    sd_method: 'sample standard deviation (n - 1) of per-seed rates; pair-level counts are not pooled across seeds',
    strategy: reports[0].run.strategy,
    backbone: reports[0].run.backbone,
    seeds: reports.map(r => r.run.seed),
    overall: summarizeCells(reports, r => r.overall),
    by_class: group('by_class'),
    by_language: group('by_language'),
    by_class_language: group('by_class_language'),
    per_seed: reports,
    indicative_threshold_n: INDICATIVE_N,
  };
}

function scoreSeeds({ runs, keyText }) {
  const results = runs.map((r, i) => ({ label: r.label || `run ${i + 1}`, manifest: r.manifest,
    res: scoreRun({ manifest: r.manifest, pairwiseText: r.pairwiseText, keyText }) }));
  const errors = results.flatMap(r => r.res.errors.map(e => `${r.label}: ${e}`));
  const warnings = results.flatMap(r => r.res.warnings.map(w => `${r.label}: ${w}`));
  if (errors.length) return { ok: false, errors, warnings };
  const cross = mismatchErrors(results);
  warnings.push(...cross.warnings);
  if (cross.errors.length) return { ok: false, errors: cross.errors, warnings };
  const reports = results.map(r => r.res.report).sort((a, b) => a.run.seed - b.run.seed);
  return { ok: true, errors: [], warnings, report: summarizeSeeds(reports) };
}

// ---- Text rendering
function fmt(m) {
  if (m.rate === 'n/a') return 'n/a (n=0)';
  return `${m.rate.toFixed(3)} (${m.numerator}/${m.n})`;
}
function fmtStat(s) {
  if (s.mean === 'n/a') return 'n/a (n=0)';
  return `${s.mean.toFixed(3)} ± ${s.sd === 'n/a' ? 'n/a' : s.sd.toFixed(3)}`;
}
function renderRows(head, rows) {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
  const line = r => r.map((v, i) => v.padEnd(w[i])).join('  ').trimEnd();
  return [line(head), w.map(n => '-'.repeat(n)).join('  '), ...rows.map(line)].join('\n');
}
function renderTable(title, cells) {
  const rows = Object.entries(cells).map(([k, c]) => [k, String(c.n_gold_pairs), fmt(c.FCR), fmt(c.MCR), c.indicative ? 'indicative' : '']);
  return renderRows([title, 'n', 'FCR', 'MCR', 'flag'], rows);
}
function renderSeedTable(title, cells, seeds) {
  const head = [title, 'n', 'FCR mean ± sd', 'MCR mean ± sd', 'flag', ...seeds.flatMap(s => [`seed ${s} FCR`, `seed ${s} MCR`])];
  const rows = Object.entries(cells).map(([k, c]) => [k, String(c.n_gold_pairs), fmtStat(c.FCR), fmtStat(c.MCR), c.indicative ? 'indicative' : '',
    ...c.FCR.per_seed.flatMap((f, i) => [fmt(f), fmt(c.MCR.per_seed[i])])]);
  return renderRows(head, rows);
}
function renderSeedReport(rep) {
  const s = rep.seeds;
  return [
    `${rep.label}. Not human gold; do not present as a validated benchmark result.`,
    `multi-seed summary: strategy=${rep.strategy} backbone=${rep.backbone} seeds=${s.join(', ')} (n=${s.length})`,
    `mean ± sd = ${rep.sd_method}.`,
    '',
    renderRows(['seed', 'run_id', 'records', 'scored', 'ignored'], rep.per_seed.map(r => [String(r.run.seed), r.run.run_id,
      String(r.records.total), String(r.records.scored_cross_utterance), Object.entries(r.records.ignored).map(([k, v]) => `${k}=${v}`).join(', ')])), '',
    renderSeedTable('overall', { all: rep.overall }, s), '',
    renderSeedTable('distinction_class', rep.by_class, s), '',
    renderSeedTable('language', rep.by_language, s), '',
    renderSeedTable('class x language', rep.by_class_language, s), '',
    'outcome breakdown per seed (by gold relation)',
    renderRows(['seed', 'relation', ...OUTCOMES], rep.per_seed.flatMap(r => ['different', 'same'].map(rel =>
      [String(r.run.seed), rel, ...OUTCOMES.map(o => String(r.outcome_breakdown[rel][o]))]))),
    '',
    `indicative = fewer than ${rep.indicative_threshold_n} gold pairs in the cell. n/a = no gold pairs of that relation. Do not headline overall FCR/MCR alone.`,
  ].join('\n');
}
function renderSweepReport(rep) {
  const c = rep.decision_consistency;
  const first = rep.points[0];
  const constant = rel => first ? first.outcome_breakdown[rel].not_compared + first.outcome_breakdown[rel].no_entry : 0;
  return [
    `${rep.label}. Not human gold; do not present as a validated benchmark result.`,
    `FCR-MCR threshold sweep: run_id=${rep.run.run_id} strategy=${rep.run.strategy} backbone=${rep.run.backbone} seed=${rep.run.seed}`,
    `rule: ${rep.rule}  (gating: ${rep.gating}; thresholds: ${rep.thresholds})`,
    `records: ${rep.records.total} total, ${rep.records.scored_cross_utterance} scored cross-utterance, ignored: ` +
      Object.entries(rep.records.ignored).map(([k, v]) => `${k}=${v}`).join(', '),
    `system's own threshold(s): ${rep.run_thresholds.join(', ') || 'none'}; rule reproduces the system's decision on ${c.agree}/${c.scored_records} scored records`,
    `constant at every tau (no score to sweep): ${constant('different')} gold-different and ${constant('same')} gold-same pairs not compared or with no entry`,
    '',
    renderRows(['tau', 'FCR', 'MCR', 'merged different', 'merged same'], rep.points.map(p => [String(p.tau), fmt(p.overall.FCR), fmt(p.overall.MCR),
      String(p.outcome_breakdown.different.merged), String(p.outcome_breakdown.same.merged)])),
    '',
    `merged at tau means similarity_score > tau (strict). Per class / language / class x language frontiers are in the --json report.`,
    'Do not headline overall FCR/MCR alone.',
  ].join('\n');
}
function renderReport(rep) {
  const b = rep.outcome_breakdown;
  const out = [
    `${rep.label}. Not human gold; do not present as a validated benchmark result.`,
    `run_id=${rep.run.run_id} strategy=${rep.run.strategy} backbone=${rep.run.backbone} seed=${rep.run.seed}`,
    `records: ${rep.records.total} total, ${rep.records.scored_cross_utterance} scored cross-utterance, ignored: ` +
      Object.entries(rep.records.ignored).map(([k, v]) => `${k}=${v}`).join(', '),
    '',
    renderTable('overall', { all: rep.overall }), '',
    renderTable('distinction_class', rep.by_class), '',
    renderTable('language', rep.by_language), '',
    renderTable('class x language', rep.by_class_language), '',
    'outcome breakdown (by gold relation)',
    ['relation'.padEnd(9), ...OUTCOMES].join('  '),
    ...['different', 'same'].map(rel => [rel.padEnd(9), ...OUTCOMES.map(o => String(b[rel][o]).padEnd(o.length))].join('  ')),
    '',
    `indicative = fewer than ${rep.indicative_threshold_n} gold pairs in the cell. n/a = no gold pairs of that relation. Do not headline overall FCR/MCR alone.`,
  ];
  return out.join('\n');
}

// ---- CLI
const USAGE = `usage:
  single run: node score_tier1_eval.js --pairwise <pairwise_eval.jsonl> --manifest <run_manifest.json> [--key <answer_key.jsonl>] [--json <report.json>]
  multi-seed: node score_tier1_eval.js --run <pairwise_eval.jsonl>,<run_manifest.json> --run ... --run ... [--key ...] [--json ...]
              (one --run per seed, at least ${MIN_SEEDS} distinct seeds, same strategy / backbone / settings)
  sweep:      node score_tier1_eval.js --pairwise <pairwise_eval.jsonl> --manifest <run_manifest.json> --sweep breakpoints|<t1,t2,...> [--key ...] [--json ...]
              (FCR-MCR frontier for one run; thresholds in [0, 1])`;

const FLAGS = new Set(['pairwise', 'manifest', 'key', 'json', 'run', 'sweep']);

function main(argv) {
  const args = { run: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i].startsWith('--') ? argv[i].slice(2) : null;
    const value = argv[i + 1];
    let problem = null;
    if (!FLAGS.has(flag)) problem = `unknown argument "${argv[i]}"`;
    else if (value === undefined || value.startsWith('--')) problem = `${argv[i]} needs a value`;
    else if (flag !== 'run' && flag in args) problem = `${argv[i]} given more than once`;
    if (problem) { console.error(`${problem}\n${USAGE}`); return 2; }
    if (flag === 'run') args.run.push(value);
    else args[flag] = value;
  }
  const multi = args.run.length > 0;
  if (multi ? args.pairwise || args.manifest || args.sweep : !args.pairwise || !args.manifest) { console.error(USAGE); return 2; }
  const sweep = args.sweep ? parseThresholds(args.sweep) : null;
  if (sweep && sweep.error) { console.error(`${sweep.error}\n${USAGE}`); return 2; }
  const runs = multi ? args.run.map(r => r.split(',')) : [[args.pairwise, args.manifest]];
  if (runs.some(r => r.length !== 2 || !r[0] || !r[1])) { console.error(`--run takes <pairwise_eval.jsonl>,<run_manifest.json>\n${USAGE}`); return 2; }

  const keyPath = path.resolve(args.key || DEFAULT_KEY);
  if (args.json) {
    // The report is derived from the key: never overwrite an input, and never write it into (or
    // below) a folder holding a run file or the key (the key's folder also holds the Team A input).
    const norm = p => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
    const out = norm(args.json);
    const inputs = [keyPath, ...runs.flat()].map(norm);
    const inside = dir => { const rel = path.relative(dir, path.dirname(out)); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
    if (inputs.includes(out) || inputs.map(path.dirname).some(inside)) {
      console.error('--json must not overwrite an input or be written into a Team A run folder or the answer key folder');
      return 2;
    }
  }
  const loaded = [];
  for (const [pairwise, manifestPath] of runs) {
    try { loaded.push({ label: manifestPath, manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')), pairwiseText: fs.readFileSync(pairwise, 'utf8') }); } catch (e) {
      console.error(`REJECTED: cannot read run ${pairwise}, ${manifestPath} (${e.message})`);
      return 1;
    }
  }
  let keyText;
  try { keyText = fs.readFileSync(keyPath, 'utf8'); } catch (e) {
    console.error(`REJECTED: cannot read answer key ${keyPath} (${e.message})`);
    return 1;
  }
  const { manifest, pairwiseText } = loaded[0];
  const result = multi ? scoreSeeds({ runs: loaded, keyText })
    : sweep ? sweepRun({ manifest, pairwiseText, keyText, thresholds: sweep.thresholds })
    : scoreRun({ manifest, pairwiseText, keyText });
  for (const w of result.warnings) console.error(`warning: ${w}`);
  if (!result.ok) {
    console.error(`REJECTED: ${result.errors.length} validation error(s)`);
    for (const e of result.errors.slice(0, 50)) console.error(`  ${e}`);
    if (result.errors.length > 50) console.error(`  ... ${result.errors.length - 50} more`);
    return 1;
  }
  console.log(multi ? renderSeedReport(result.report) : sweep ? renderSweepReport(result.report) : renderReport(result.report));
  if (args.json) {
    try { fs.writeFileSync(args.json, JSON.stringify(result.report, null, 2) + '\n'); } catch (e) {
      console.error(`cannot write --json report ${args.json} (${e.message})`);
      return 1;
    }
  }
  return 0;
}

module.exports = { scoreRun, scoreSeeds, summarizeSeeds, sweepRun, parseThresholds, validate, renderReport, renderSeedReport, renderSweepReport };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
