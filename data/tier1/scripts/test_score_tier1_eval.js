// Tests for score_tier1_eval.js against the synthetic fixture in test_fixtures/synthetic_tier1/.
// Never touches the real answer key. Usage: node --test data/tier1/scripts/test_score_tier1_eval.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { scoreRun, scoreSeeds, summarizeSeeds, sweepRun, parseThresholds } = require('./score_tier1_eval.js');

const FIX = path.join(__dirname, 'test_fixtures', 'synthetic_tier1');
const read = f => fs.readFileSync(path.join(FIX, f), 'utf8');
const keyText = read('synthetic_answer_key.jsonl');
const manifest = JSON.parse(read('run_manifest.json'));
const records = read('pairwise_eval.jsonl').trim().split('\n').map(l => JSON.parse(l));
const jsonl = rows => rows.map(r => JSON.stringify(r)).join('\n') + '\n';
const run = (recs = records, man = manifest) => scoreRun({ manifest: man, pairwiseText: jsonl(recs), keyText });
const clone = x => JSON.parse(JSON.stringify(x));
const m = (numerator, n) => ({ numerator, n, rate: n ? numerator / n : 'n/a' });
const c = (FCR, MCR) => ({ n_gold_pairs: FCR.n + MCR.n, indicative: FCR.n + MCR.n < 20, FCR, MCR });

test('scores the synthetic fixture', () => {
  const res = run();
  assert.deepEqual(res.errors, []);
  assert.deepEqual(res.warnings, []);
  const rep = res.report;
  assert.deepEqual(rep.records, { total: 11, scored_cross_utterance: 4, ignored: { unknown_utterance: 1, cross_episode: 2, same_utterance: 4 } });
  assert.deepEqual(rep.overall, c(m(1, 3), m(2, 3)));
  assert.deepEqual(rep.by_class, {
    evidentiality: c(m(0, 0), m(1, 2)),
    kinship: c(m(1, 2), m(0, 0)),
    name_variant: c(m(0, 1), m(1, 1)),
  });
  assert.deepEqual(rep.by_language, {
    de: c(m(0, 1), m(0, 0)),
    hi: c(m(1, 2), m(1, 2)),
    tr: c(m(0, 0), m(1, 1)),
  });
  assert.deepEqual(Object.keys(rep.by_class_language), ['evidentiality x hi', 'evidentiality x tr', 'kinship x hi', 'name_variant x de', 'name_variant x hi']);
  assert.deepEqual(rep.by_class_language['name_variant x hi'], c(m(0, 0), m(1, 1)));
  assert.deepEqual(rep.outcome_breakdown, {
    different: { merged: 1, compared_not_merged: 1, not_compared: 0, no_entry: 1 },
    same: { merged: 1, compared_not_merged: 1, not_compared: 1, no_entry: 0 },
  });
  assert.equal(rep.overall.indicative, true);
  assert.equal(rep.by_class.kinship.MCR.rate, 'n/a');
});

test('report carries no per-pair or gold identifiers', () => {
  const text = JSON.stringify(run().report);
  assert.doesNotMatch(text, /SYNTH_|ep_0000|ent_0000|"relation"/);
});

test('cross-utterance record in either orientation counts as merged', () => {
  const recs = clone(records);
  const r = recs.find(x => x.record_id === 'synth_rec_01');
  [r.entry_a, r.entry_b] = [r.entry_b, r.entry_a];
  assert.equal(run(recs).report.outcome_breakdown.different.merged, 1);
});

test('empty run: every pair is no_entry, FCR 0, MCR 1', () => {
  const rep = run([]).report;
  assert.deepEqual(rep.overall, c(m(0, 3), m(3, 3)));
  assert.equal(rep.outcome_breakdown.same.no_entry, 3);
});

test('indicative flag uses total gold pairs in the cell: 19 flagged, 20 not', () => {
  const key = (nSame, nDiff) => jsonl([...Array(nSame + nDiff)].map((_, i) => {
    const ep = 'ep_' + String(i).padStart(12, '0');
    return { eval_pair_id: ep, pair_id: `SYNTH_T${i}`, relation: i < nSame ? 'same' : 'different', distinction_class: 'kinship',
      language: 'hi', utterance_a_id: ep + '_utt_a', utterance_b_id: ep + '_utt_b', opaque_entity_id_a: `ent_a${i}`, opaque_entity_id_b: `ent_b${i}` };
  }));
  const score = k => scoreRun({ manifest, pairwiseText: '', keyText: k }).report.overall;
  assert.equal(score(key(10, 9)).indicative, true);
  assert.equal(score(key(10, 10)).indicative, false);
  assert.equal(score(key(10, 10)).FCR.n, 10);
});

const rejects = (name, mutate, pattern, man = manifest) => test(`rejects: ${name}`, () => {
  const recs = clone(records);
  mutate(recs);
  const res = run(recs, man);
  assert.equal(res.ok, false);
  assert.equal(res.report, undefined);
  assert.ok(res.errors.some(e => pattern.test(e)), res.errors.join('\n'));
});
rejects('gold_entity_id mismatch', r => { r[0].entry_b.gold_entity_id = r[0].entry_a.gold_entity_id; }, /gold_entity_id does not match/);
rejects('entry_id reused for another utterance', r => { r[1].entry_b.entry_id = r[1].entry_a.entry_id; }, /entry_id must be unique/);
rejects('run_id mismatch', r => { r[2].run_id = 'other'; }, /run_id "other" != manifest/);
rejects('duplicate record_id', r => { r[3].record_id = r[0].record_id; }, /duplicate record_id/);
rejects('merge without predicted_entity_id', r => { r[0].predicted_entity_id = null; }, /predicted_entity_id: expected string/);
rejects('similarity_score out of range', r => { r[0].similarity_score = 1.5; }, /> maximum 1/);
rejects('missing required entry field', r => { delete r[0].entry_a.gloss; }, /missing required "gloss"/);
rejects('wrong dataset_tier', () => {}, /dataset_tier must be/, { ...manifest, dataset_tier: 'tier2_injected_sessions' });
rejects('manifest missing seed', () => {}, /missing required "seed"/, (({ seed, ...rest }) => rest)(manifest));

test('warns on language mismatch without rejecting', () => {
  const recs = clone(records);
  recs[0].entry_a.language = 'en';
  const res = run(recs);
  assert.equal(res.ok, true);
  assert.ok(res.warnings.some(w => /language "en"/.test(w)));
});

// ---- Multi-seed mode. Seeds are built in memory from the synthetic fixture:
//   seed 1 = fixture as is:             FCR 1/3, MCR 2/3
//   seed 2 = pair 2 a-b turned to merge: FCR 2/3, MCR 2/3
//   seed 3 = pair 1 a-b no_merge, pair 3 b-a merge: FCR 0/3, MCR 1/3
const setDecision = (r, decision) => { r.decision = decision; r.predicted_entity_id = decision === 'merge' ? `synth_cluster_${r.record_id}` : null; };
const SEED_MUTATIONS = {
  1: () => {},
  2: recs => setDecision(recs[1], 'merge'),
  3: recs => { setDecision(recs[0], 'no_merge'); setDecision(recs[5], 'merge'); },
};
const seedRun = (seed, { mutation = seed, man = {}, recMut = () => {} } = {}) => {
  const recs = clone(records);
  SEED_MUTATIONS[mutation](recs);
  const run_id = man.run_id || `synth_run_s${seed}`;
  for (const r of recs) r.run_id = run_id;
  recMut(recs);
  const mf = { ...manifest, run_id, seed, ...man };
  for (const [k, v] of Object.entries(mf)) if (v === undefined) delete mf[k];
  return { label: `seed${seed}`, manifest: mf, pairwiseText: jsonl(recs) };
};
const seeds = (...runs) => scoreSeeds({ runs, keyText });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
const three = () => [seedRun(1), seedRun(2), seedRun(3)];

test('multi-seed: 3-seed mean of per-seed rates', () => {
  const res = seeds(...three());
  assert.deepEqual(res.errors, []);
  const { overall, seeds: s } = res.report;
  assert.deepEqual(s, [1, 2, 3]);
  assert.deepEqual(overall.FCR.per_seed, [{ seed: 1, ...m(1, 3) }, { seed: 2, ...m(2, 3) }, { seed: 3, ...m(0, 3) }]);
  assert.deepEqual(overall.MCR.per_seed, [{ seed: 1, ...m(2, 3) }, { seed: 2, ...m(2, 3) }, { seed: 3, ...m(1, 3) }]);
  close(overall.FCR.mean, 1 / 3);
  close(overall.MCR.mean, 5 / 9);
  assert.equal(overall.FCR.n_seeds, 3);
  close(res.report.by_class.kinship.FCR.mean, 0.5);
  close(res.report.by_class.evidentiality.MCR.mean, 1 / 3);
  assert.equal(res.report.by_class.kinship.MCR.mean, 'n/a');
  assert.equal(res.report.per_seed.length, 3);
  assert.deepEqual(res.report.per_seed[1].outcome_breakdown.different, { merged: 2, compared_not_merged: 0, not_compared: 0, no_entry: 1 });
});

test('multi-seed: SD is the sample SD (n - 1) of per-seed rates', () => {
  const r = seeds(...three()).report;
  close(r.overall.FCR.sd, 1 / 3);                  // rates 1/3, 2/3, 0
  close(r.overall.MCR.sd, Math.sqrt(3) / 9);       // rates 2/3, 2/3, 1/3
  close(r.by_class.kinship.FCR.sd, 0.5);           // rates 1/2, 1, 0
  close(r.by_class.evidentiality.MCR.sd, Math.sqrt(1 / 12)); // rates 1/2, 1/2, 0
  assert.equal(r.by_class.kinship.MCR.sd, 'n/a');
  const same = seeds(seedRun(1), seedRun(2, { mutation: 1 }), seedRun(3, { mutation: 1 })).report;
  assert.equal(same.overall.FCR.sd, 0);
});

test('multi-seed: mean is over per-seed rates, not pooled counts', () => {
  // Hand-made reports with unequal denominators, which a shared key never produces, so the two differ.
  const rep = (seed, numerator, n) => ({ label: 'synthetic', run: { seed, strategy: 'mem0', backbone: null },
    overall: { n_gold_pairs: n, indicative: true, FCR: m(numerator, n), MCR: m(0, 0) }, by_class: {}, by_language: {}, by_class_language: {} });
  const r = summarizeSeeds([rep(1, 1, 2), rep(2, 1, 4), rep(3, 1, 4)]);
  close(r.overall.FCR.mean, (0.5 + 0.25 + 0.25) / 3);
  assert.notEqual(r.overall.FCR.mean, 3 / 10);
});

const seedRejects = (name, runs, pattern) => test(`multi-seed rejects: ${name}`, () => {
  const res = seeds(...runs());
  assert.equal(res.ok, false);
  assert.equal(res.report, undefined);
  assert.ok(res.errors.some(e => pattern.test(e)), res.errors.join('\n'));
});
seedRejects('duplicate seed', () => [seedRun(1), seedRun(2), seedRun(2, { mutation: 3, man: { run_id: 'synth_run_dup' } })], /duplicate seed\(s\) 2/);
seedRejects('fewer than 3 distinct seeds', () => [seedRun(1), seedRun(2)], /need at least 3 distinct seeds, got 2/);
seedRejects('missing seed in a manifest', () => [seedRun(1), seedRun(2), seedRun(3, { man: { seed: undefined } })], /seed3: schema: run_manifest: missing required "seed"/);
seedRejects('duplicate run_id', () => [seedRun(1), seedRun(2), seedRun(3, { man: { run_id: 'synth_run_s1' } })], /duplicate run_id/);
seedRejects('mismatched strategy', () => [seedRun(1), seedRun(2),
  seedRun(3, { man: { strategy: 'mem0' }, recMut: recs => recs.forEach(r => { r.strategy = 'mem0'; }) })], /strategy differs across runs/);
seedRejects('mismatched backbone', () => [seedRun(1, { man: { backbone: 'synthetic-backbone-a' } }),
  seedRun(2, { man: { backbone: 'synthetic-backbone-a' } }), seedRun(3, { man: { backbone: 'synthetic-backbone-b' } })], /backbone differs across runs/);
seedRejects('backbone missing vs set', () => [seedRun(1, { man: { backbone: undefined } }), seedRun(2),
  seedRun(3, { man: { backbone: 'synthetic-backbone-a' } })], /backbone differs across runs/);
seedRejects('mismatched extra model setting', () => [seedRun(1, { man: { temperature: 0 } }), seedRun(2, { man: { temperature: 0 } }),
  seedRun(3, { man: { temperature: 0.7 } })], /temperature differs across runs/);
seedRejects('an invalid run', () => [seedRun(1), seedRun(2, { recMut: recs => { recs[0].entry_b.gold_entity_id = 'ent_wrong'; } }), seedRun(3)],
  /seed2: pairwise_eval:1: entry_b\.gold_entity_id does not match/);

test('multi-seed: backbone absent and null count as equal; a setting in only some runs warns', () => {
  const res = seeds(seedRun(1, { man: { backbone: undefined } }), seedRun(2, { man: { temperature: 0 } }), seedRun(3));
  assert.equal(res.ok, true);
  assert.ok(res.warnings.some(w => /setting "temperature" is in only 1\/3 runs/.test(w)), res.warnings.join('\n'));
});

test('CLI multi-seed: summarizes 3 runs; rejects 2; single-run flags cannot be mixed in', () => {
  const script = path.join(__dirname, 'score_tier1_eval.js');
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tier1_seeds_'));
  try {
    const args = three().map(r => {
      const d = path.join(dir, `seed${r.manifest.seed}`);
      fs.mkdirSync(d);
      fs.writeFileSync(path.join(d, 'pairwise_eval.jsonl'), r.pairwiseText);
      fs.writeFileSync(path.join(d, 'run_manifest.json'), JSON.stringify(r.manifest));
      return ['--run', `${path.join(d, 'pairwise_eval.jsonl')},${path.join(d, 'run_manifest.json')}`];
    });
    const key = ['--key', path.join(FIX, 'synthetic_answer_key.jsonl')];
    const out = execFileSync(process.execPath, [script, ...args.flat(), ...key], { encoding: 'utf8' });
    assert.match(out, /seeds=1, 2, 3 \(n=3\)/);
    assert.match(out, /all\s+6\s+0\.333 ± 0\.333\s+0\.556 ± 0\.192\s+indicative\s+0\.333 \(1\/3\)\s+0\.667 \(2\/3\)\s+0\.667 \(2\/3\)\s+0\.667 \(2\/3\)\s+0\.000 \(0\/3\)\s+0\.333 \(1\/3\)/);
    assert.throws(() => execFileSync(process.execPath, [script, ...args.slice(0, 2).flat(), ...key], { stdio: 'pipe' }),
      e => e.status === 1 && /need at least 3 distinct seeds/.test(e.stderr.toString()));
    assert.throws(() => execFileSync(process.execPath, [script, ...args.flat(), '--pairwise', 'x', ...key], { stdio: 'pipe' }), e => e.status === 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('CLI argument parsing: bad arguments exit 2 before scoring', () => {
  const script = path.join(__dirname, 'score_tier1_eval.js');
  const pw = path.join(FIX, 'pairwise_eval.jsonl');
  const mf = path.join(FIX, 'run_manifest.json');
  const key = ['--key', path.join(FIX, 'synthetic_answer_key.jsonl')];
  const exit2 = (args, pattern) => assert.throws(() => execFileSync(process.execPath, [script, ...args], { stdio: 'pipe' }),
    e => e.status === 2 && pattern.test(e.stderr.toString()), args.join(' '));
  exit2(['--pairwise', pw, '--manifest', mf, '--jsn', 'x.json', ...key], /unknown argument "--jsn"/);
  exit2(['--pairwise', pw, '--pairwise', pw, '--manifest', mf, ...key], /--pairwise given more than once/);
  exit2(['--pairwise', pw, '--manifest', mf, '--key'], /--key needs a value/);
  exit2(['--run', '--key', path.join(FIX, 'synthetic_answer_key.jsonl')], /--run needs a value/);
  exit2(['--run', pw, '--run', pw, '--run', pw, ...key], /--run takes <pairwise_eval.jsonl>,<run_manifest.json>/);
  exit2(['--run', `${pw},${mf}`, '--manifest', mf, ...key], /usage:/);
  exit2(['positional'], /unknown argument "positional"/);
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tier1_args_'));
  try {
    const mf2 = path.join(dir, 'run_manifest.json');
    fs.copyFileSync(mf, mf2);
    exit2(['--pairwise', pw, '--manifest', mf2, '--json', path.join(dir, 'report.json'), ...key], /must not overwrite an input or be written into/);
    assert.equal(fs.existsSync(path.join(dir, 'report.json')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---- Threshold sweep. Fixture scored records (all compatibility-gated, run threshold 0.8):
//   pair 1 a-b 0.91 compatible | pair 2 a-b 0.42 compatible | pair 3 0.85 underdetermined | pair 4 0.88 compatible
// Ignored records (0.93-0.99) must not become breakpoints or merge anything.
const sweep = (thresholds, recs = records, man = manifest) => sweepRun({ manifest: man, pairwiseText: jsonl(recs), keyText, thresholds });
const frontier = res => res.report.points.map(p => [p.tau, p.overall.FCR.numerator, p.overall.MCR.numerator]);

test('sweep: boundary thresholds, strict > at ties, 0 and 1', () => {
  const res = sweep([0, 0.42, 0.8, 0.85, 0.88, 0.91, 1]);
  assert.deepEqual(res.errors, []);
  assert.deepEqual(frontier(res), [
    [0, 2, 2],     // pairs 1, 2, 4 merge; pair 3 blocked by underdetermined
    [0.42, 1, 2],  // tie: 0.42 > 0.42 is false, pair 2 no longer merges
    [0.8, 1, 2],
    [0.85, 1, 2],
    [0.88, 1, 3],  // tie: pair 4 stops merging
    [0.91, 0, 3],  // tie: pair 1 stops merging
    [1, 0, 3],     // nothing merges at tau = 1
  ]);
  for (const p of res.report.points) {
    assert.equal(p.overall.FCR.n, 3);
    assert.equal(p.overall.MCR.n, 3);
    assert.equal(p.outcome_breakdown.same.not_compared, 1); // constant: pair 5
    assert.equal(p.outcome_breakdown.different.no_entry, 1); // constant: pair 6
  }
  assert.equal(res.report.gating, 'compatibility');
});

test('sweep: breakpoints are 0 plus distinct scores of scored records only', () => {
  const res = sweep('breakpoints');
  assert.deepEqual(res.report.points.map(p => p.tau), [0, 0.42, 0.85, 0.88, 0.91]);
  assert.deepEqual(res.report.run_thresholds, [0.8]);
});

test('sweep: ungated run uses similarity_score > tau alone', () => {
  const recs = clone(records).map(r => ({ ...r, strategy: 'mem0', compatibility: null }));
  const res = sweep([0, 0.85], recs, { ...manifest, strategy: 'mem0' });
  assert.deepEqual(res.errors, []);
  assert.equal(res.report.gating, 'none');
  assert.deepEqual(frontier(res), [[0, 2, 1], [0.85, 1, 2]]); // pair 3 (0.85) now merges at tau 0, and ties at 0.85
});

test('sweep: consistent with the existing scorer at the run threshold', () => {
  const single = run().report;
  const point = sweep([0.8]).report.points[0];
  for (const k of ['overall', 'by_class', 'by_language', 'by_class_language', 'outcome_breakdown']) assert.deepEqual(point[k], single[k], k);
  assert.deepEqual(sweep([0.8]).report.decision_consistency, { scored_records: 4, agree: 4, disagree: 0 });
});

test('sweep: flags records where the rule disagrees with the system decision', () => {
  const recs = clone(records);
  setDecision(recs[1], 'merge'); // pair 2 merged by the system at 0.42 < 0.8
  const res = sweep([0.8], recs);
  assert.equal(res.ok, true);
  assert.deepEqual(res.report.decision_consistency, { scored_records: 4, agree: 3, disagree: 1 });
  assert.ok(res.warnings.some(w => /disagrees with the system's decision on 1\/4 .*synth_rec_02/.test(w)));
  assert.equal(run(recs).report.overall.FCR.numerator, 2);          // existing scorer: actual decisions
  assert.equal(res.report.points[0].overall.FCR.numerator, 1);      // sweep: re-derived rule
});

const sweepRejects = (name, mutate, pattern, man = manifest, thresholds = [0.5]) => test(`sweep rejects: ${name}`, () => {
  const recs = clone(records);
  mutate(recs);
  const res = sweep(thresholds, recs, man);
  assert.equal(res.ok, false);
  assert.equal(res.report, undefined);
  assert.ok(res.errors.some(e => pattern.test(e)), res.errors.join('\n'));
});
sweepRejects('missing similarity_score', r => { delete r[0].similarity_score; }, /missing required "similarity_score"/);
sweepRejects('similarity_score > 1', r => { r[0].similarity_score = 1.2; }, /similarity_score: 1\.2 > maximum 1/);
sweepRejects('similarity_score < 0', r => { r[0].similarity_score = -0.1; }, /similarity_score: -0\.1 < minimum 0/);
sweepRejects('similarity_score as string', r => { r[0].similarity_score = '0.9'; }, /similarity_score: expected number, got string/);
sweepRejects('similarity_score null', r => { r[0].similarity_score = null; }, /similarity_score: expected number, got null/);
sweepRejects('scored record without compatibility field', r => { delete r[1].compatibility; }, /no compatibility field .*synth_rec_02/);
sweepRejects('mixed null and non-null compatibility', r => { r[1].compatibility = null; }, /mixes null \(1\) and non-null \(3\) compatibility/);
sweepRejects('DK-Mem run with all-null compatibility', r => r.forEach(x => { x.compatibility = null; }), /DK-Mem variant but every scored record has compatibility null/);
const BAD_THRESHOLDS = /thresholds must be "breakpoints" or a non-empty list of numbers in \[0, 1\]/;
sweepRejects('threshold out of range (API)', () => {}, BAD_THRESHOLDS, manifest, [0.5, 1.5]);
sweepRejects('empty threshold list (API)', () => {}, BAD_THRESHOLDS, manifest, []);
test('sweep rejects: thresholds not given (API)', () => {
  const res = sweepRun({ manifest, pairwiseText: jsonl(records), keyText });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some(e => BAD_THRESHOLDS.test(e)), res.errors.join('\n'));
});
sweepRejects('thresholds as a string other than breakpoints (API)', () => {}, BAD_THRESHOLDS, manifest, '0.5');

test('sweep: parseThresholds accepts breakpoints and [0, 1] lists, rejects the rest', () => {
  assert.deepEqual(parseThresholds('breakpoints'), { thresholds: 'breakpoints' });
  assert.deepEqual(parseThresholds('0.9, 0,1,.5,0.9'), { thresholds: [0, 0.5, 0.9, 1] });
  for (const bad of ['1.5', '-0.1', 'abc', '', '0.5,', 'NaN', '1e-1', '0x1']) assert.ok(parseThresholds(bad).error, bad);
});

test('CLI sweep: frontier table; bad thresholds and --run exit 2; single-run unaffected', () => {
  const script = path.join(__dirname, 'score_tier1_eval.js');
  const args = ['--pairwise', path.join(FIX, 'pairwise_eval.jsonl'), '--manifest', path.join(FIX, 'run_manifest.json'),
    '--key', path.join(FIX, 'synthetic_answer_key.jsonl')];
  const out = execFileSync(process.execPath, [script, ...args, '--sweep', 'breakpoints'], { encoding: 'utf8' });
  assert.match(out, /rule reproduces the system's decision on 4\/4/);
  assert.match(out, /\n0\s+0\.667 \(2\/3\)\s+0\.667 \(2\/3\)\s+2\s+1\n/);
  assert.match(out, /\n0\.91\s+0\.000 \(0\/3\)\s+1\.000 \(3\/3\)\s+0\s+0\n/);
  const exit2 = (extra, pattern) => assert.throws(() => execFileSync(process.execPath, [script, ...extra], { stdio: 'pipe' }),
    e => e.status === 2 && pattern.test(e.stderr.toString()));
  exit2([...args, '--sweep', '2'], /--sweep takes "breakpoints"/);
  exit2([...args, '--sweep'], /--sweep needs a value/);
  exit2(['--run', `${args[1]},${args[3]}`, '--sweep', 'breakpoints', ...args.slice(4)], /usage:/);
  assert.doesNotMatch(execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' }), /sweep/);
});

// ---- --json output. Run files are copied into a temp tree so the output guard can be exercised
// without writing anywhere near the fixture: tmp/run/{pairwise_eval.jsonl,run_manifest.json},
// tmp/key/synthetic_answer_key.jsonl, tmp/seeds/sN/..., reports go to tmp/out/.
function jsonTree() {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tier1_json_'));
  const put = (rel, text) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
  const t = {
    dir,
    pw: put('run/pairwise_eval.jsonl', read('pairwise_eval.jsonl')),
    mf: put('run/run_manifest.json', read('run_manifest.json')),
    key: put('key/synthetic_answer_key.jsonl', keyText),
    out: path.join(dir, 'out'),
  };
  fs.mkdirSync(t.out);
  t.seedArgs = three().flatMap(r => ['--run',
    `${put(`seeds/s${r.manifest.seed}/pairwise_eval.jsonl`, r.pairwiseText)},${put(`seeds/s${r.manifest.seed}/run_manifest.json`, JSON.stringify(r.manifest))}`]);
  return t;
}
const SCRIPT = path.join(__dirname, 'score_tier1_eval.js');
const cli = args => execFileSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', stdio: 'pipe' });
const cliFails = (args, status, pattern) => assert.throws(() => cli(args),
  e => e.status === status && pattern.test(e.stderr.toString()) && !/\n\s+at /.test(e.stderr.toString()), args.join(' '));

test('--json: valid JSON equal to the API report in single-run, multi-seed and both sweep modes', () => {
  const t = jsonTree();
  try {
    const single = ['--pairwise', t.pw, '--manifest', t.mf, '--key', t.key];
    const cases = [
      ['single.json', single, run().report],
      ['seeds.json', [...t.seedArgs, '--key', t.key], seeds(...three()).report],
      ['sweep_explicit.json', [...single, '--sweep', '0,0.42,0.91,1'], sweep([0, 0.42, 0.91, 1]).report],
      ['sweep_breakpoints.json', [...single, '--sweep', 'breakpoints'], sweep('breakpoints').report],
    ];
    for (const [name, args, expected] of cases) {
      const out = path.join(t.out, name);
      cli([...args, '--json', out]);
      const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
      assert.deepEqual(parsed, expected, name);
      assert.doesNotMatch(JSON.stringify(parsed), /SYNTH_|ep_0000|ent_0000|"relation"/, name);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(t.out, 'sweep_explicit.json'), 'utf8')).points.length, 4);
    assert.equal(JSON.parse(fs.readFileSync(path.join(t.out, 'sweep_breakpoints.json'), 'utf8')).points.length, 5);
  } finally { fs.rmSync(t.dir, { recursive: true, force: true }); }
});

test('--json guard: never overwrites an input or writes into a run folder or the key folder', () => {
  const t = jsonTree();
  const snapshot = () => [t.pw, t.mf, t.key].map(p => fs.readFileSync(p, 'utf8'));
  const before = snapshot();
  try {
    const single = ['--pairwise', t.pw, '--manifest', t.mf, '--key', t.key];
    const blocked = [
      [single, t.pw],                                            // overwrite pairwise input
      [single, t.mf],                                            // overwrite manifest input
      [single, t.key],                                           // overwrite key
      [single, path.join(t.dir, 'run', 'report.json')],          // into the run folder
      [single, path.join(t.dir, 'run', 'sub', 'report.json')],   // below the run folder
      [single, path.join(t.dir, 'key', 'report.json')],          // into the key folder
      [[...single, '--sweep', 'breakpoints'], path.join(t.dir, 'run', 'report.json')],
      [[...t.seedArgs, '--key', t.key], path.join(t.dir, 'seeds', 's2', 'report.json')],
    ];
    if (process.platform === 'win32') blocked.push([single, t.pw.toUpperCase()], [single, path.join(t.dir, 'RUN', 'report.json')]);
    for (const [args, out] of blocked) cliFails([...args, '--json', out], 2, /--json must not overwrite an input or be written into/);
    assert.deepEqual(snapshot(), before);
    assert.equal(fs.existsSync(path.join(t.dir, 'run', 'report.json')), false);
    assert.equal(fs.existsSync(path.join(t.dir, 'run', 'sub')), false);
    // A sibling folder is fine, and a folder as the target fails cleanly (exit 1, no stack trace).
    cli([...single, '--json', path.join(t.out, 'ok.json')]);
    cliFails([...single, '--json', t.out], 1, /cannot write --json report/);
  } finally { fs.rmSync(t.dir, { recursive: true, force: true }); }
});

test('CLI: unreadable key or run files are rejected cleanly', () => {
  const t = jsonTree();
  try {
    cliFails(['--pairwise', t.pw, '--manifest', t.mf, '--key', path.join(t.dir, 'missing_key.jsonl')], 1, /REJECTED: cannot read answer key/);
    cliFails(['--pairwise', path.join(t.dir, 'missing.jsonl'), '--manifest', t.mf, '--key', t.key], 1, /REJECTED: cannot read run/);
  } finally { fs.rmSync(t.dir, { recursive: true, force: true }); }
});

test('CLI: scores fixture and exits 0; rejects and exits 1', () => {
  const script = path.join(__dirname, 'score_tier1_eval.js');
  const args = ['--pairwise', path.join(FIX, 'pairwise_eval.jsonl'), '--manifest', path.join(FIX, 'run_manifest.json'),
    '--key', path.join(FIX, 'synthetic_answer_key.jsonl')];
  const out = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.match(out, /all\s+6\s+0\.333 \(1\/3\)\s+0\.667 \(2\/3\)\s+indicative/);
  const bad = path.join(require('os').tmpdir(), `tier1_bad_manifest_${process.pid}.json`);
  fs.writeFileSync(bad, JSON.stringify({ ...manifest, run_id: 'mismatch' }));
  try {
    assert.throws(() => execFileSync(process.execPath, [script, ...args.slice(0, 2), '--manifest', bad, ...args.slice(4)], { stdio: 'pipe' }),
      e => e.status === 1 && /REJECTED/.test(e.stderr.toString()));
  } finally { fs.unlinkSync(bad); }
});
