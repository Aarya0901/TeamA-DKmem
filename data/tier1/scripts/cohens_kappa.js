// Cohen's kappa on two annotators' raw relation judgments, per language and pooled
// (docs/tier1_annotation_protocol.md, "Cohen's kappa"):
//   - computed before adjudication, over the `relation` field of two annotator files;
//   - categories are same / different / ambiguous; ambiguous is its own category, not dropped;
//   - kappa = (p_o - p_e) / (1 - p_e), p_e from each annotator's marginal label distribution;
//   - language is joined from the candidates file by pair_id.
// Reports kappa and n only. It does not apply the kappa > 0.7 gate or any minimum n.
//
// Handling:
//   - A pair with relation null in either file is unlabeled: excluded from kappa and counted as
//     n_unlabeled in its language row and the pooled row.
//   - Kappa is null when n = 0, or when p_e = 1 (both annotators used one identical label).
//   - Rejected (exit 1, no kappa): invalid JSON, a relation outside same/different/ambiguous/null,
//     a missing or duplicate pair_id, a pair_id not in the candidates file or in only one annotator
//     file, a candidate without a language, a file whose annotator_id is empty or not constant, both
//     files with the same annotator_id, and any record carrying `adjudication_status` (adjudicated
//     output, not a raw judgment).
//
// Usage: node data/tier1/scripts/cohens_kappa.js --a <annotator_A.jsonl> --b <annotator_B.jsonl>
//          --candidates <candidates.jsonl> [--json <report.json>]

const fs = require('fs');

const LABELS = ['same', 'different', 'ambiguous'];

function parseJsonl(text, label, errors) {
  const rows = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (!l.trim()) return;
    try { rows.push({ line: i + 1, value: JSON.parse(l) }); } catch (e) { errors.push(`${label}:${i + 1}: invalid JSON (${e.message})`); }
  });
  return rows;
}

function loadCandidates(text, errors) {
  const lang = new Map();
  for (const { line, value: r } of parseJsonl(text, 'candidates', errors)) {
    if (typeof r.pair_id !== 'string' || !r.pair_id) { errors.push(`candidates:${line}: missing pair_id`); continue; }
    if (typeof r.language !== 'string' || !r.language) { errors.push(`candidates:${line}: ${r.pair_id} has no language`); continue; }
    if (lang.has(r.pair_id)) errors.push(`candidates:${line}: duplicate pair_id ${r.pair_id}`);
    lang.set(r.pair_id, r.language);
  }
  return lang;
}

function loadAnnotations(text, label, errors) {
  const byPair = new Map();
  const ids = new Set();
  for (const { line, value: r } of parseJsonl(text, label, errors)) {
    const at = `${label}:${line}`;
    if (typeof r.pair_id !== 'string' || !r.pair_id) { errors.push(`${at}: missing pair_id`); continue; }
    if ('adjudication_status' in r) errors.push(`${at}: ${r.pair_id} has adjudication_status; kappa uses raw judgments from before adjudication`);
    if (!('relation' in r)) errors.push(`${at}: ${r.pair_id} has no relation field`);
    else if (r.relation !== null && !LABELS.includes(r.relation)) errors.push(`${at}: ${r.pair_id} relation ${JSON.stringify(r.relation)} not in ${LABELS.join('/')}/null`);
    if (byPair.has(r.pair_id)) errors.push(`${at}: duplicate pair_id ${r.pair_id}`);
    ids.add(typeof r.annotator_id === 'string' ? r.annotator_id : '');
    byPair.set(r.pair_id, r.relation === undefined ? null : r.relation);
  }
  const annotatorId = ids.size === 1 ? [...ids][0] : null;
  if (!byPair.size) errors.push(`${label}: no records`);
  else if (ids.size > 1) errors.push(`${label}: annotator_id is not constant (${[...ids].map(i => JSON.stringify(i)).join(', ')})`);
  else if (!annotatorId) errors.push(`${label}: annotator_id is empty`);
  return { byPair, annotatorId };
}

// items: [{ a, b }] with labels from LABELS (unlabeled pairs already removed).
function kappa(items) {
  const countsA = {}, countsB = {};
  let agreements = 0;
  for (const { a, b } of items) {
    countsA[a] = (countsA[a] || 0) + 1;
    countsB[b] = (countsB[b] || 0) + 1;
    if (a === b) agreements++;
  }
  return kappaFromCounts({ n: items.length, agreements, countsA, countsB });
}

// The protocol's formula from summary counts: n, agreements, and each annotator's label counts.
function kappaFromCounts({ n, agreements, countsA, countsB }) {
  const out = { n, agreements, p_o: null, p_e: null, kappa: null, label_counts_a: countsA, label_counts_b: countsB };
  if (!n) { out.note = 'undefined: n = 0'; return out; }
  out.p_o = agreements / n;
  out.p_e = LABELS.reduce((s, c) => s + ((countsA[c] || 0) / n) * ((countsB[c] || 0) / n), 0);
  if (out.p_e === 1) out.note = 'undefined: both annotators used a single identical label (p_e = 1)';
  else out.kappa = (out.p_o - out.p_e) / (1 - out.p_e);
  return out;
}

function computeAgreement({ aText, bText, candidatesText }) {
  const errors = [];
  const lang = loadCandidates(candidatesText, errors);
  const A = loadAnnotations(aText, 'a', errors);
  const B = loadAnnotations(bText, 'b', errors);
  if (A.annotatorId && A.annotatorId === B.annotatorId) errors.push(`a and b have the same annotator_id "${A.annotatorId}"`);
  for (const id of new Set([...A.byPair.keys(), ...B.byPair.keys()])) {
    if (!B.byPair.has(id)) errors.push(`${id} is only in a`);
    else if (!A.byPair.has(id)) errors.push(`${id} is only in b`);
    if (!lang.has(id)) errors.push(`${id} is not in candidates`);
  }
  if (errors.length) return { errors };

  const groups = new Map(); // language -> { items, unlabeled }
  for (const [id, a] of A.byPair) {
    const l = lang.get(id);
    if (!groups.has(l)) groups.set(l, { items: [], unlabeled: 0 });
    const b = B.byPair.get(id);
    if (a === null || b === null) groups.get(l).unlabeled++;
    else groups.get(l).items.push({ a, b });
  }
  const row = g => ({ ...kappa(g.items), n_unlabeled: g.unlabeled });
  const by_language = {};
  for (const l of [...groups.keys()].sort()) by_language[l] = row(groups.get(l));
  const all = [...groups.values()];
  const pooled = row({ items: all.flatMap(g => g.items), unlabeled: all.reduce((s, g) => s + g.unlabeled, 0) });
  return {
    errors: [],
    report: {
      field: 'relation',
      method: "Cohen's kappa = (p_o - p_e) / (1 - p_e) on raw pre-adjudication relation judgments; categories same/different/ambiguous; pairs with a null relation in either file are excluded and counted as n_unlabeled. No gate or minimum n applied.",
      annotator_a: A.annotatorId,
      annotator_b: B.annotatorId,
      pooled,
      by_language,
    },
  };
}

const fmt = x => x === null ? 'n/a' : x.toFixed(4);

function render(rep) {
  const lines = [`Cohen's kappa on relation: ${rep.annotator_a} vs ${rep.annotator_b} (pre-adjudication, no gate applied)`,
    `${'language'.padEnd(10)} ${'n'.padStart(5)} ${'agree'.padStart(6)} ${'p_o'.padStart(7)} ${'p_e'.padStart(7)} ${'kappa'.padStart(7)} ${'unlabeled'.padStart(10)}`];
  const line = (name, r) => `${name.padEnd(10)} ${String(r.n).padStart(5)} ${String(r.agreements).padStart(6)} ${fmt(r.p_o).padStart(7)} ${fmt(r.p_e).padStart(7)} ${fmt(r.kappa).padStart(7)} ${String(r.n_unlabeled).padStart(10)}${r.note ? `  (${r.note})` : ''}`;
  for (const [l, r] of Object.entries(rep.by_language)) lines.push(line(l, r));
  lines.push(line('pooled', rep.pooled));
  return lines.join('\n');
}

const USAGE = 'usage: node cohens_kappa.js --a <annotator_A.jsonl> --b <annotator_B.jsonl> --candidates <candidates.jsonl> [--json <report.json>]';

function main(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i].startsWith('--') ? argv[i].slice(2) : null;
    if (!['a', 'b', 'candidates', 'json'].includes(flag) || argv[i + 1] === undefined || flag in args) { console.error(USAGE); return 2; }
    args[flag] = argv[i + 1];
  }
  if (!args.a || !args.b || !args.candidates) { console.error(USAGE); return 2; }
  let texts;
  try {
    texts = { aText: fs.readFileSync(args.a, 'utf8'), bText: fs.readFileSync(args.b, 'utf8'), candidatesText: fs.readFileSync(args.candidates, 'utf8') };
  } catch (e) { console.error(`cannot read input (${e.message})`); return 2; }
  const { errors, report } = computeAgreement(texts);
  if (errors.length) {
    console.error(`REJECTED: ${errors.length} error(s)`);
    for (const e of errors.slice(0, 50)) console.error(' - ' + e);
    if (errors.length > 50) console.error(`   ...and ${errors.length - 50} more`);
    return 1;
  }
  console.log(render(report));
  if (args.json) fs.writeFileSync(args.json, JSON.stringify(report, null, 2) + '\n');
  return 0;
}

module.exports = { kappa, kappaFromCounts, computeAgreement };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
