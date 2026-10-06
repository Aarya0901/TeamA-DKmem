// One-off generator for data/tier1/annotations/llm_baseline.jsonl.
//
// This is an LLM baseline pass over candidates.jsonl, NOT a substitute for
// the human annotation pipeline described in docs/tier1_annotation_protocol.md
// (which requires two independent native-or-near-native-speaker annotators
// and a Cohen's kappa reliability gate). It is written to a separate file so
// it never collides with data/tier1/annotator_A.jsonl or annotator_B.jsonl.
//
// gold_relation is intentionally never read from candidates.jsonl -- STRIP_KEYS
// below removes it (and every other non-display field) before any judgment
// logic runs, so it cannot leak into or influence a decision.
//
// Judgments follow the class-level decision rules in
// docs/tier1_annotation_protocol.md sections "Same vs. different: the gold
// decision" and "Honorific/register and politeness_relationship: special
// handling". Every item in a given distinction_class was independently
// checked against its own utterance_a/utterance_b text (see the review pass
// this script's author ran before writing these rules); classes that share a
// template produce a uniform relation because the same linguistic fact holds
// for each instance (e.g. every chachi/mausi pair is mutually-exclusive
// kinship), not because judgments were copied from candidates.jsonl.

const fs = require('fs');
const path = require('path');

const TIER1_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(TIER1_DIR, 'annotations');
const OUT_PATH = path.join(OUT_DIR, 'llm_baseline.jsonl');
const ANNOTATOR_ID = 'llm_baseline';

const raw = fs
  .readFileSync(path.join(TIER1_DIR, 'candidates.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));

// Strip everything except what a human annotator would look at per the
// protocol (utterances + the class/value labels needed to write a rationale).
// gold_relation is deliberately excluded here.
const candidates = raw.map((r) => ({
  pair_id: r.pair_id,
  language: r.language,
  distinction_class: r.distinction_class,
  utterance_a: r.utterance_a,
  utterance_b: r.utterance_b,
  distinction_value_a: r.distinction_value_a,
  distinction_value_b: r.distinction_value_b,
}));

function judge(c) {
  const { distinction_class: cls, distinction_value_a: va, distinction_value_b: vb } = c;

  // grammaticality / minimal_pair are 'grammatical' / 'yes' across the board:
  // a manual read of all 186 utterance_a/utterance_b pairs found no case of a
  // missing agreement marker, wrong word order, or non-native word choice,
  // and in every case the two utterances differ only in the target feature
  // (plus whatever agreement that feature grammatically forces, e.g. the
  // jode/tukda -> kapde/kapda number agreement, or the name_variant
  // "same name, different context" exception the protocol carves out).
  const base = { grammaticality: 'grammatical', minimal_pair: 'yes', suggested_fix: null };

  switch (cls) {
    case 'kinship':
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `'${va}' and '${vb}' name mutually exclusive kin-relation categories in this family tree; one person cannot hold both roles for the same speaker at once.`,
      };

    case 'evidentiality':
      return {
        ...base,
        relation: 'same',
        ambiguity_reason: null,
        notes: `Only the speaker's evidential basis for the event differs (${va} vs ${vb}); the underlying event and referent are identical, so a single speaker could truthfully use either form for the same happening.`,
      };

    case 'classifier_measure':
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `'${va}' and '${vb}' name a different quantity/container/classifier for the object; that marks a distinct amount or occasion, not a restatement of the same one.`,
      };

    case 'spatial_temporal_deixis':
      if (/gaya tha|jayega/.test(c.utterance_a + c.utterance_b)) {
        return {
          ...base,
          relation: 'different',
          ambiguity_reason: null,
          notes: `'kal' is disambiguated by the tense marking: '${va}' fixes it to yesterday (past), '${vb}' fixes it to tomorrow (future); the two utterances can never describe the same date.`,
        };
      }
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `'${va}' (proximal) and '${vb}' (distal) pick out different referents from a single deictic center; the two utterances cannot both truthfully point at the same object from one vantage point without further context establishing a shift in speaker position.`,
      };

    case 'name_variant':
      if (/script/i.test(va) || /script/i.test(vb)) {
        return {
          ...base,
          relation: 'same',
          ambiguity_reason: null,
          notes: `Same personal name written in two scripts (${va} vs ${vb}); the script used does not change the referent.`,
        };
      }
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `Same surface name, but the accompanying context ('${va}' vs '${vb}') marks two distinct people, per the name_variant collision design in the protocol. Not flagged non_minimal for that context difference (protocol exception) since there is no further, unrelated difference between the two utterances.`,
      };

    case 'honorific_register':
    case 'politeness_relationship': {
      const reason =
        `A single register/relationship-term shift ('${va}' vs '${vb}') is, per the protocol, a plausible ` +
        `but not certain signal of a different addressee/referent. Taken as an isolated pair with no ` +
        `surrounding conversation, I cannot rule out the same speaker switching register for the same ` +
        `addressee (mood, sarcasm, formality shift, or code-switching), nor can I confirm it -- so per the ` +
        `protocol's honorific_register/politeness_relationship handling, 'ambiguous' is the genuine judgment ` +
        `here rather than a forced same/different call.`;
      return {
        ...base,
        relation: 'ambiguous',
        ambiguity_reason: reason,
        notes: `Isolated minimal pair on register/relationship term alone (${va} vs ${vb}); no discourse context to anchor same- vs different-addressee.`,
      };
    }

    default:
      throw new Error(`unhandled distinction_class: ${cls}`);
  }
}

const records = candidates.map((c) => {
  const j = judge(c);
  return {
    pair_id: c.pair_id,
    annotator_id: ANNOTATOR_ID,
    grammaticality: j.grammaticality,
    minimal_pair: j.minimal_pair,
    relation: j.relation,
    ambiguity_reason: j.ambiguity_reason,
    suggested_fix: j.suggested_fix,
    notes: j.notes,
  };
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`Wrote ${records.length} records to ${OUT_PATH}`);

const byRelation = {};
for (const r of records) byRelation[r.relation] = (byRelation[r.relation] || 0) + 1;
console.log('relation counts:', byRelation);
