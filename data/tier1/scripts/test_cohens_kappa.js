// Tests for cohens_kappa.js. Reads the LLM annotation files read-only; writes only to a temp dir.
// Usage: node --test data/tier1/scripts/test_cohens_kappa.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { kappa, computeAgreement } = require('./cohens_kappa.js');

const TIER1 = path.join(__dirname, '..');
const SCRIPT = path.join(__dirname, 'cohens_kappa.js');
const read = f => fs.readFileSync(path.join(TIER1, f), 'utf8');
const jsonl = rows => rows.map(r => JSON.stringify(r)).join('\n') + '\n';
const ann = (annotator_id, labels, ids = labels.map((_, i) => `p${i}`)) =>
  jsonl(labels.map((relation, i) => ({ pair_id: ids[i], annotator_id, relation })));
const cands = (langs) => jsonl(langs.map((language, i) => ({ pair_id: `p${i}`, language })));
const agree = (a, b, langs = a.map(() => 'hi')) => computeAgreement({ aText: ann('A', a), bText: ann('B', b), candidatesText: cands(langs) });

test('protocol worked example: kappa = (0.9 - 0.54) / (1 - 0.54)', () => {
  // The item-level labels from the protocol's table: they disagree only on item 7.
  const a = 'DDDDDDDSSS', b = 'DDDDDDSSSS';
  const label = { D: 'different', S: 'same' };
  const r = kappa([...a].map((x, i) => ({ a: label[x], b: label[b[i]] })));
  assert.equal(r.n, 10);
  assert.equal(r.agreements, 9);
  assert.deepEqual(r.label_counts_a, { different: 7, same: 3 });
  assert.deepEqual(r.label_counts_b, { different: 6, same: 4 });
  assert.ok(Math.abs(r.p_o - 0.9) < 1e-12);
  assert.ok(Math.abs(r.p_e - 0.54) < 1e-12);
  assert.ok(Math.abs(r.kappa - 0.36 / 0.46) < 1e-12);
  assert.equal(r.kappa.toFixed(3), '0.783');
});

test('reproduces pooled relation kappa in llm_agreement.json (0.7753)', () => {
  const ref = JSON.parse(read('annotations/llm_agreement.json')).fields.relation;
  const { errors, report } = computeAgreement({
    aText: read('annotations/llm_baseline.jsonl'), bText: read('annotations/llm_baseline_B.jsonl'), candidatesText: read('candidates.jsonl'),
  });
  assert.deepEqual(errors, []);
  const p = report.pooled;
  assert.equal(p.n, ref.n);
  assert.equal(p.agreements, ref.agreements);
  assert.equal(p.n_unlabeled, 0);
  assert.equal(Number(p.kappa.toFixed(4)), ref.cohens_kappa);
  assert.deepEqual(p.label_counts_a, ref.label_counts_A);
  assert.deepEqual(p.label_counts_b, ref.label_counts_B);
  assert.equal(Object.values(report.by_language).reduce((s, r) => s + r.n, 0), ref.n);
});

test('reproduces pooled relation kappa in llm_new_agreement.json (0.8649)', () => {
  const ref = JSON.parse(read('annotations/llm_new_agreement.json')).fields.relation;
  const { errors, report } = computeAgreement({
    aText: read('annotations/llm_new_A.jsonl'), bText: read('annotations/llm_new_B.jsonl'), candidatesText: read('candidates.jsonl'),
  });
  assert.deepEqual(errors, []);
  assert.equal(report.pooled.n, ref.n);
  assert.equal(Number(report.pooled.kappa.toFixed(4)), ref.cohens_kappa);
});

test('ambiguous is its own category, not dropped', () => {
  const { report } = agree(['same', 'ambiguous', 'different', 'ambiguous'], ['same', 'same', 'different', 'ambiguous']);
  assert.equal(report.pooled.n, 4);
  assert.equal(report.pooled.agreements, 3);
  assert.equal(report.pooled.label_counts_a.ambiguous, 2);
  // p_e = (1/4)(2/4) + (1/4)(1/4) + (2/4)(1/4) = 5/16
  assert.ok(Math.abs(report.pooled.p_e - 5 / 16) < 1e-12);
});

test('per-language rows and pooled row', () => {
  const { errors, report } = agree(['same', 'different', 'same', 'same'], ['same', 'different', 'different', 'same'], ['hi', 'hi', 'tr', 'tr']);
  assert.deepEqual(errors, []);
  assert.deepEqual(Object.keys(report.by_language), ['hi', 'tr']);
  assert.equal(report.by_language.hi.kappa, 1);
  assert.equal(report.by_language.tr.n, 2);
  assert.equal(report.pooled.n, 4);
});

test('null (missing) labels are excluded and counted as unlabeled', () => {
  const { errors, report } = agree(['same', null, 'different', 'same'], ['same', 'same', null, 'different']);
  assert.deepEqual(errors, []);
  assert.equal(report.pooled.n, 2);
  assert.equal(report.pooled.n_unlabeled, 2);
});

test('all-unlabeled template gives n = 0 and kappa null, not an error', () => {
  const { errors, report } = agree([null, null], [null, null]);
  assert.deepEqual(errors, []);
  assert.equal(report.pooled.n, 0);
  assert.equal(report.pooled.kappa, null);
  assert.equal(report.pooled.n_unlabeled, 2);
});

test('p_e = 1 gives kappa null with a note', () => {
  const { report } = agree(['same', 'same'], ['same', 'same']);
  assert.equal(report.pooled.kappa, null);
  assert.match(report.pooled.note, /p_e = 1/);
});

test('rejects malformed input', () => {
  const c2 = cands(['hi', 'hi']);
  const cases = [
    [{ aText: 'not json\n', bText: ann('B', ['same']), candidatesText: c2 }, /invalid JSON/],
    [{ aText: ann('A', ['same', 'maybe']), bText: ann('B', ['same', 'same']), candidatesText: c2 }, /"maybe" not in/],
    [{ aText: jsonl([{ pair_id: 'p0', annotator_id: 'A' }]), bText: ann('B', ['same']), candidatesText: c2 }, /no relation field/],
    [{ aText: jsonl([{ annotator_id: 'A', relation: 'same' }]), bText: ann('B', ['same']), candidatesText: c2 }, /missing pair_id/],
    [{ aText: ann('A', ['same', 'same'], ['p0', 'p0']), bText: ann('B', ['same']), candidatesText: c2 }, /duplicate pair_id p0/],
    [{ aText: ann('A', ['same', 'same']), bText: ann('B', ['same']), candidatesText: c2 }, /p1 is only in a/],
    [{ aText: ann('A', ['same'], ['zz']), bText: ann('B', ['same'], ['zz']), candidatesText: c2 }, /zz is not in candidates/],
    [{ aText: ann('A', ['same']), bText: ann('A', ['same']), candidatesText: c2 }, /same annotator_id/],
    [{ aText: ann('', ['same']), bText: ann('B', ['same']), candidatesText: c2 }, /annotator_id is empty/],
    [{ aText: ann('A', ['same']), bText: jsonl([{ pair_id: 'p0', annotator_id: 'adj', relation: 'same', adjudication_status: 'x' }]), candidatesText: c2 }, /adjudication_status/],
    [{ aText: ann('A', ['same']), bText: ann('B', ['same']), candidatesText: jsonl([{ pair_id: 'p0' }]) }, /has no language/],
    [{ aText: '', bText: ann('B', ['same']), candidatesText: c2 }, /a: no records/],
  ];
  for (const [input, re] of cases) {
    const { errors, report } = computeAgreement(input);
    assert.equal(report, undefined);
    assert.ok(errors.some(e => re.test(e)), `expected ${re} in ${JSON.stringify(errors)}`);
  }
});

test('CLI: prints table, writes --json, exits 1 on rejection and 2 on bad usage', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kappa-'));
  const w = (f, t) => { fs.writeFileSync(path.join(dir, f), t); return path.join(dir, f); };
  const a = w('a.jsonl', ann('A', ['same', 'different']));
  const b = w('b.jsonl', ann('B', ['same', 'different']));
  const c = w('c.jsonl', cands(['hi', 'hi']));
  const out = path.join(dir, 'r.json');
  const stdout = execFileSync(process.execPath, [SCRIPT, '--a', a, '--b', b, '--candidates', c, '--json', out], { encoding: 'utf8' });
  assert.match(stdout, /pooled\s+2\s+2\s+1\.0000/);
  assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).pooled.kappa, 1);
  const bad = w('bad.jsonl', ann('B', ['same']));
  const status = args => { try { execFileSync(process.execPath, [SCRIPT, ...args], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  assert.equal(status(['--a', a, '--b', bad, '--candidates', c]), 1);
  assert.equal(status(['--a', a, '--b', b]), 2);
  fs.rmSync(dir, { recursive: true, force: true });
});
