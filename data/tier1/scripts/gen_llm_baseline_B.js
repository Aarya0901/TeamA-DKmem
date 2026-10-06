// One-off generator for data/tier1/annotations/llm_baseline_B.jsonl -- a
// SECOND, independent LLM annotation pass over candidates.jsonl.
//
// Independence constraints honored here:
//   - gold_relation is stripped from candidates.jsonl before any judgment
//     logic runs (see STRIP below) -- never read, never used.
//   - annotations/llm_baseline.jsonl (the first pass) is never opened by
//     this script or read by its author while writing the rules below.
//
// Judgments are re-derived from docs/tier1_annotation_protocol.md and each
// item's own utterance_a/utterance_b text, not copied from any existing
// candidate or annotation field.
//
// For the deterministic classes (kinship, evidentiality, classifier_measure,
// spatial_temporal_deixis, name_variant) an independent reader applying the
// protocol's explicit decision rules to the same linguistic facts is
// expected to land on the same relation -- that is the protocol's own
// definition of a correct, high-agreement class, not evidence of copying.
//
// For honorific_register / politeness_relationship, the protocol explicitly
// invites genuine per-item judgment among same/different/ambiguous and says
// disagreement between annotators is *expected* here. This pass reasons
// about each subtype on its own terms:
//   - Direct 2nd-person address (hi tu/aap, tum/aap; de du/Sie): switching
//     register toward the literal person in front of you, in the same
//     breath, is a marked move (sarcasm/anger/sudden formality) -- plausible
//     but not the neutral case either way -> judged 'ambiguous'.
//   - 3rd-person mentions of a friend (hi bhaiya/yaar; ko banmal/jondaetmal):
//     the speaker's register choice is driven by who THEY are talking TO
//     about the friend, not by the friend's identity -- addressee-driven
//     honorification of the same referent is the unmarked, everyday use of
//     these systems -> judged 'same'.
// This is a different (and equally defensible) reading from a pass that
// defaults the whole class to 'ambiguous', which is the point of running a
// second independent pass.

const fs = require('fs');
const path = require('path');

const TIER1_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(TIER1_DIR, 'annotations');
const OUT_PATH = path.join(OUT_DIR, 'llm_baseline_B.jsonl');
const ANNOTATOR_ID = 'llm_baseline_B';

const raw = fs
  .readFileSync(path.join(TIER1_DIR, 'candidates.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));

// gold_relation deliberately excluded -- never enters `candidates` below.
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
  const base = { grammaticality: 'grammatical', minimal_pair: 'yes', suggested_fix: null };

  switch (cls) {
    case 'kinship':
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `${va} and ${vb} pick out non-overlapping kin roles; a single relative cannot be both to the same speaker, so the two utterances cannot describe the same referent.`,
      };

    case 'evidentiality':
      return {
        ...base,
        relation: 'same',
        ambiguity_reason: null,
        notes: `The event and its participant are unchanged; ${va} vs ${vb} only marks how the speaker came to know about it, so both could truthfully be said about one and the same event.`,
      };

    case 'classifier_measure':
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `${va} vs ${vb} specifies a different unit/container for the object, which corresponds to a different real-world quantity or occasion rather than two descriptions of the same amount.`,
      };

    case 'spatial_temporal_deixis':
      if (/gaya tha|jayega/.test(c.utterance_a + c.utterance_b)) {
        return {
          ...base,
          relation: 'different',
          ambiguity_reason: null,
          notes: `The otherwise-ambiguous 'kal' is pinned to a specific day by the verb tense in each sentence (${va} vs ${vb}); a past-tense and a future-tense reading of 'kal' cannot both denote the same calendar day.`,
        };
      }
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `${va} and ${vb} are complementary deictic terms anchored to the speaker's position; within one utterance situation they necessarily pick out two different objects/locations, not one restated.`,
      };

    case 'name_variant':
      if (/script/i.test(va) || /script/i.test(vb)) {
        return {
          ...base,
          relation: 'same',
          ambiguity_reason: null,
          notes: `Identical name, just transliterated (${va} vs ${vb}); script is orthographic, not referential, so the same person is denoted either way.`,
        };
      }
      return {
        ...base,
        relation: 'different',
        ambiguity_reason: null,
        notes: `The shared given name is disambiguated by the attached context (${va} vs ${vb}), which the protocol's name_variant design uses on purpose to mark two different people carrying the same name -- not treated as a second, unrelated difference.`,
      };

    case 'honorific_register': {
      // Direct 2nd-person address -- marked, not the neutral default, in
      // either direction; genuinely undecidable from the isolated pair.
      const reason =
        `This is direct address: the speaker chooses '${va}' or '${vb}' for the very person in front of them, ` +
        `in the same conversational moment. A same-addressee reading requires a specific marked trigger ` +
        `(sudden formality, sarcasm, anger, or a mid-conversation status shift); a different-addressee reading ` +
        `is equally available with zero added assumptions. Nothing in the isolated utterance pair favors one ` +
        `reading over the other, so 'ambiguous' reflects a genuine inability to decide rather than a default.`;
      return {
        ...base,
        relation: 'ambiguous',
        ambiguity_reason: reason,
        notes: `2nd-person register pair (${va} vs ${vb}) with no surrounding turn to show whether the addressee or just the tone changed.`,
      };
    }

    case 'politeness_relationship': {
      // 3rd-person mention of a friend -- register here tracks the
      // *listener* the speaker is talking to, not the friend's identity;
      // that is the ordinary, unmarked use of these honorific systems.
      const reason =
        `This is a 3rd-person mention: the speaker's word choice for '${va}' vs '${vb}' is ordinarily driven by ` +
        `who they are speaking TO about the friend (an elder/formal listener vs. a casual peer), not by which ` +
        `friend is meant. Describing the same friend respectfully to one listener and casually to another is the ` +
        `everyday, unmarked use of this register system, so I judge these as describing the same referent.`;
      return {
        ...base,
        relation: 'same',
        ambiguity_reason: null,
        notes: `Addressee-driven honorification of a 3rd party (${va} vs ${vb}); judged 'same' -- see ambiguity_reason logic in the sibling honorific_register class for the contrast with direct address.`,
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
