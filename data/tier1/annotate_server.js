// Minimal local server for the Tier-1 annotation UI (annotate.html).
// No third-party dependencies. Reads data/tier1/candidates.jsonl (read-only,
// gold_relation is stripped before it ever reaches the browser) and
// reads/writes data/tier1/annotator_A.jsonl.
//
// Usage: node annotate_server.js [port]   (defaults to 5175)
// Then open http://localhost:<port>/ in a browser.

const http = require('http');
const fs = require('fs');
const path = require('path');

const TIER1_DIR = __dirname;
const CANDIDATES_PATH = path.join(TIER1_DIR, 'candidates.jsonl');
const ANNOTATIONS_PATH = path.join(TIER1_DIR, 'annotator_A.jsonl');
const HTML_PATH = path.join(TIER1_DIR, 'annotate.html');

const REQUIRED_FIELDS = [
  'pair_id', 'annotator_id', 'grammaticality', 'minimal_pair',
  'relation', 'ambiguity_reason', 'suggested_fix', 'notes',
];
const ENUMS = {
  grammaticality: ['grammatical', 'ungrammatical', 'unnatural_but_grammatical'],
  minimal_pair: ['yes', 'no'],
  relation: ['same', 'different', 'ambiguous'],
};
const EDITABLE_FIELDS = ['grammaticality', 'minimal_pair', 'relation', 'ambiguity_reason', 'suggested_fix', 'notes'];

function readJsonl(p) {
  return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function loadCandidates() {
  // Only the fields the UI needs to display -- gold_relation (and anything
  // else) never leaves this file.
  return readJsonl(CANDIDATES_PATH).map((r) => ({
    pair_id: r.pair_id,
    language: r.language,
    distinction_class: r.distinction_class,
    utterance_a: r.utterance_a,
    utterance_b: r.utterance_b,
  }));
}

function loadAnnotations() {
  return readJsonl(ANNOTATIONS_PATH);
}

function writeAnnotations(records) {
  const body = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(ANNOTATIONS_PATH, body, 'utf8');
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function validateSavePayload(p) {
  if (!p || typeof p !== 'object') return 'payload must be an object';
  if (typeof p.pair_id !== 'string' || !p.pair_id) return 'pair_id missing';
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = p[field];
    if (v !== null && v !== undefined && !allowed.includes(v)) {
      return `${field} must be null or one of [${allowed.join(', ')}]`;
    }
  }
  for (const field of ['ambiguity_reason', 'suggested_fix', 'notes']) {
    const v = p[field];
    if (v !== null && v !== undefined && typeof v !== 'string') return `${field} must be a string or null`;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/annotate.html')) {
    fs.readFile(HTML_PATH, (err, data) => {
      if (err) return sendJson(res, 500, { error: 'could not read annotate.html' });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    try {
      const candidates = loadCandidates();
      const annotations = loadAnnotations();
      sendJson(res, 200, { candidates, annotations });
    } catch (e) {
      sendJson(res, 500, { error: String(e.message || e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/save') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        return sendJson(res, 400, { error: 'invalid JSON body' });
      }
      const err = validateSavePayload(payload);
      if (err) return sendJson(res, 400, { error: err });

      let records;
      try {
        records = loadAnnotations();
      } catch (e) {
        return sendJson(res, 500, { error: String(e.message || e) });
      }
      const idx = records.findIndex((r) => r.pair_id === payload.pair_id);
      if (idx === -1) return sendJson(res, 404, { error: `unknown pair_id '${payload.pair_id}'` });

      const updated = { ...records[idx] };
      for (const field of EDITABLE_FIELDS) {
        if (field in payload) {
          const v = payload[field];
          updated[field] = v === '' ? null : v;
        }
      }
      // Keep exactly the required 8 keys, in case of schema drift upstream.
      const clean = {};
      for (const f of REQUIRED_FIELDS) clean[f] = updated[f] !== undefined ? updated[f] : null;
      records[idx] = clean;

      try {
        writeAnnotations(records);
      } catch (e) {
        return sendJson(res, 500, { error: String(e.message || e) });
      }
      sendJson(res, 200, { ok: true, record: clean });
    });
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

const port = Number(process.argv[2]) || 5175;
server.listen(port, () => {
  console.log(`Tier-1 annotation UI running at http://localhost:${port}/`);
  console.log(`Reading candidates from ${CANDIDATES_PATH}`);
  console.log(`Reading/writing annotations at ${ANNOTATIONS_PATH}`);
});
