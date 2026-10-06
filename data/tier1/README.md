# Tier 1 candidate dataset

Candidate minimal-pair probes for the cross-lingual false-consolidation study (research plan §6,
Tier 1). Built from the class definitions and worked examples in
[`data/distinction_taxonomy.json`](../distinction_taxonomy.json).

## Status: candidates, not validated

**These 226 records are candidates: 186 machine-generated from templates (`t1_0001`-`t1_0186`)
and 40 hand-authored (`t1_0187`-`t1_0226`, see "Hand-authored supplement" below). None has been
reviewed by a native speaker of any of the four languages, and are NOT the hand-authored, cross-validated Tier 1 set
the research plan calls for (κ pilot, second-speaker sign-off).** Do not report results against
this file as the final Tier 1 benchmark. Treat it as a draft pool to filter, correct, and annotate
with inter-annotator agreement before use.

A self-audit pass (2026-09-22) fixed a handful of concrete generator bugs -- a missing Hindi
ergative marker, a gender-agreement error, and unnatural German filler combinations -- and reduced
same-template filler repetition; see "Audit notes" below. This does not constitute native-speaker
validation.

## How it was generated

`generate_candidates.js` expands a small number of hand-written, grammatical sentence-pair
templates (one per taxonomy minimal pair) by substituting a single shared filler -- a city, a
name, or a time adverb -- into both sides of the pair identically. Fillers sit in closed-class
slots chosen so substitution doesn't change agreement or morphology (e.g. swapping the city in
"meri chachi {LOC} mein rehti hai" doesn't affect verb agreement, so both variants stay
grammatical). This buys lexical variety without hand-writing 200 sentences, at the cost of the
sentences being formulaic/repetitive within a template family -- another reason this is a
candidate pool, not a finished probe set.

Regenerate with:

```
node generate_candidates.js
```

This overwrites `candidates.jsonl` deterministically (no randomness). Template records are
written first, then the hand-authored supplement is appended (below), so editing the supplement
never shifts template `pair_id`s.

## Hand-authored supplement (2026-09-23)

`hand_authored_candidates.jsonl` holds 40 hand-written pairs. `generate_candidates.js` appends
them after the template block as `t1_0187`-`t1_0226`, with `source_type: "hand_authored"`.

**Why:** in the LLM annotation pass, every template `honorific_register` (hi, de) and
`politeness_relationship` (hi, ko) item came out `ambiguous` and was excluded from
`tier1_eval.jsonl` (see `README_eval.md`). As a result, those two classes, and German and Korean
entirely, had no evaluable items. The template items change only the register marker, and a bare
`tu`/`aap` or `du`/`Sie` sentence says nothing about who is being addressed. The supplement keeps
each pair minimal but adds shared context, identical on both sides, that pins the referent down.

**What varies and what is held constant** (a description of construction only, not a label):

| Class / lang | n | Varied | Held constant on both sides |
|---|---|---|---|
| honorific_register / hi | 8 | `tu` / `tum` / `aap` (+ forced verb agreement) | a vocative kin anchor (`Maa`, `Papa`, `Nani`, `Didi`) and the full proposition |
| honorific_register / de | 8 | `du` / `Sie` (+ forced verb/possessive agreement) | a vocative anchor (`Chef`, `Chefin`, a first name) and the full proposition |
| politeness_relationship / ko | 6 | speech level only (`-어` / `-어요`, + forced `내`/`제`) | subject noun, subject-honorific marking, proposition |
| politeness_relationship / ko | 6 | plain vs honorific kin/spouse noun (`아들`/`아드님`, `딸`/`따님`, `아내`/`부인`) + forced `-시-` | speech level (`-어요`), proposition |
| politeness_relationship / hi | 6 | honorific `ji` on a kin term (`Dadi ji` / `Dadi`) | kin term, proposition |
| politeness_relationship / hi | 6 | generation-graded fictive-kin term (`uncle`/`bhaiya`, `aunty`/`didi`) | family surname, proposition |

**Unlabeled by design.** Hand-authored records have `gold_relation: null`. No relation is
asserted and nothing was copied from the template `gold_relation`. The relation is left to
annotators under `docs/tier1_annotation_protocol.md`. The validator enforces the null.

**Known limitations, for native-speaker review:**
- honorific_register items all anchor the addressee. A minimal T-V pair can't pin down two
  *distinct* addressees, because a bare register switch doesn't say who is being spoken to. This
  class's coverage is therefore one-sided by construction.
- Some items use register combinations that are regional or style-dependent: German first name
  + `Sie` ("Hamburger Sie"), `Chefin` as a vocative, Korean `아빠` without `-시-` in `-어요`, and
  `부인` for a spouse (prescriptively someone else's wife, sometimes used for one's own). Treat
  grammaticality/naturalness flags on these as expected, not as generator bugs.
- The Korean `-어`/`-어요` pairs differ by a single syllable. Annotators should confirm they count
  as minimal and aren't trivially identical after normalization.

## Record schema

One JSON object per line:

| Field | Meaning |
|---|---|
| `pair_id` | Unique ID, e.g. `t1_0001`. |
| `language` | BCP-47 tag: `hi` (Hindi/Hinglish), `de` (German), `tr` (Turkish), `ko` (Korean). |
| `distinction_class` | One of the 7 taxonomy classes (matches `distinction.class` in `docs/schemas/pairwise_eval.schema.json`). |
| `utterance_a` / `utterance_b` | The two source-language utterances. Differ only in the distinguishing marker. |
| `distinction_value_a` / `distinction_value_b` | The specific marker each utterance carries. |
| `english_gloss` | The single coarse English gloss both utterances risk normalizing to -- the shared string that makes the pair a false-consolidation risk. |
| `gold_relation` | Template records: `"same"` or `"different"`, a generation-time default for whether utterance_a and utterance_b refer to the same real-world entity/fact. `"different"` items test False Consolidation Rate; `"same"` items (script variants, hearsay-vs-witnessed) test Missed Consolidation Rate / evidential integrity. Hand-authored records: always `null` (unlabeled; see "Hand-authored supplement"). |
| `source_type` | `"template_generated"` (`t1_0001`-`t1_0186`) or `"hand_authored"` (`t1_0187`-`t1_0226`). |

Example record:

```json
{"pair_id":"t1_0001","language":"hi","distinction_class":"kinship","utterance_a":"meri chachi Pune mein rehti hai","utterance_b":"meri mausi Pune mein rehti hai","distinction_value_a":"chachi","distinction_value_b":"mausi","english_gloss":"user's aunt lives in Pune","gold_relation":"different","source_type":"template_generated"}
```

(`pair_id` values are reassigned sequentially on every regeneration, so exact IDs are not stable
across *template* edits -- match on content, not ID, if diffing across versions. Hand-authored
records always follow the template block, so supplement edits never shift template IDs.)

## Coverage (current run)

226 records: 177 Hindi/Hinglish (main language), 49 non-Indic (15 German, 10 Turkish, 24 Korean).
186 template-generated, 40 hand-authored. All 7 required classes present. Exact counts by class and by class x language are printed by the
validator (below) and are the authoritative numbers -- they will shift slightly if the generator
is edited or re-run with different filler sizes.

## Audit notes (2026-09-22)

A quality pass before human annotation found and fixed:

- **Missing ergative marker (Hindi).** `name_variant` generated `"Priya call kiya"` -- Hindi
  transitive perfective verbs require the `ne` ergative marker on the subject. Fixed to
  `"Priya ne call kiya"` (8 records affected).
- **Gender-agreement error (Hindi).** The "same name, two different people" `name_variant` items
  applied the feminine verb form `"aa rahi hai"` to the male name `Rahul`. Fixed by generating that
  sub-template only with female names (2 records affected; the male-name variant was dropped
  rather than given a separate masculine template, to keep the fix minimal).
- **Unnatural filler combinations (German).** `honorific_register` reused one time-adverb list for
  both `"Wie geht es dir/Ihnen ___?"` (well-being) and `"Kommst du/Kommen Sie ___?"` (coming),
  producing pragmatically odd pairs like `"Wie geht es dir nächste Woche?"`. Split into two
  per-template time lists so each keeps only adverbs that read naturally with that verb.
- **Near-duplicate template redundancy.** Several templates (`kinship`, `honorific_register` hi)
  varied 2 filler dimensions (time x city) at 3-4 values each, producing many records differing
  only in a swapped filler with no added linguistic signal. Capped filler combinations per
  template (evenly sampled across both dimensions via `takeSpread()`, not a lexicographic prefix,
  so cutting the count doesn't collapse back to single-dimension variation). Net effect: 197 -> 186
  records.

Reviewed and kept as-is (no bug found): classifier_measure ergative marking and
plural/singular-classifier agreement, Turkish evidential suffixes (subject-invariant, so free name
substitution is safe), Korean honorific verb forms, and the temporal (`kal`)/spatial (`yeh`/`woh`)
deixis items -- both genuinely hinge on the deictic ambiguity rather than an unrelated lexical
difference. `gold_relation` labels for `honorific_register` and `politeness_relationship` remain
"different" throughout: whether a register/relationship shift implies a different addressee is a
plausible-not-certain signal (already flagged as such in `distinction_taxonomy.json`'s notes), not
a labeling error to fix -- native-speaker review should judge these case by case rather than the
generator asserting more certainty than the phenomenon supports.

## Validation

```
node validate_candidates.js
```

Checks: all 10 fields present on every record, and non-empty except `gold_relation` on
hand-authored records, which must be `null`; `source_type` is `template_generated`/`hand_authored`;
`distinction_class` is one of the 7 taxonomy classes; template `gold_relation` is
`same`/`different`; all hand-authored records come after the template block;
`utterance_a != utterance_b`; no duplicate `pair_id`; no duplicate
`(language, utterance_a, utterance_b)`; every class has >=1 record; Hindi and at least one
non-Indic language are present. Exits non-zero and prints every violation if any check fails;
otherwise prints counts by class, language, class x language, source_type, and
class x language x source_type.

**Downstream note:** `annotations_template.jsonl`, `annotator_A.jsonl` and `annotator_B.jsonl`
now cover all 226 candidates (`t1_0001`–`t1_0226`); `validate_annotations.js` passes 226/226.
`annotator_A.jsonl` and `annotator_B.jsonl` are still blank: no human judgment has been entered.
The LLM annotation files in `annotations/` cover all 226 between them: `llm_baseline*.jsonl` and
`llm_adjudicated.jsonl` cover `t1_0001`–`t1_0186` (template-generated), and `llm_new_*.jsonl`
cover `t1_0187`–`t1_0226` (hand-authored). `ANNOTATION_GUIDE.md` has been updated to 226 pairs.

## Next steps (out of scope here)

Filter for genuine minimal-pair quality, deduplicate near-paraphrases across templates, get a
second native speaker per language to sign off (Hindi, German, Turkish, Korean), compute Cohen's
kappa, and only then promote a reviewed subset to the actual Tier 1 probe set the paper reports on.
