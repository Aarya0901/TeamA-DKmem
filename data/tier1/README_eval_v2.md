# Provisional Tier 1 evaluation set, v2 (`tier1_eval_v2.jsonl`)

## Status: LLM-annotated and LLM-adjudicated, NOT human gold

**Every `relation` label in this file comes from LLM annotators, not from human native speakers.**
Each candidate was labelled by two independent LLM annotation passes, and an LLM adjudicator
resolved their disagreements. No native speaker of any language has reviewed these labels. This
is **not** the hand-validated Tier 1 set the research plan calls for (κ pilot with native-speaker
annotators, second-speaker sign-off; see
[`docs/tier1_annotation_protocol.md`](../../docs/tier1_annotation_protocol.md)).

Use it for pipeline development and provisional numbers only. Do not report results against it
as a validated benchmark, and label any numbers from it as "LLM-annotated, provisional". It should
be replaced once human annotation (`annotator_A.jsonl` / `annotator_B.jsonl`) is complete.

`gold_relation` from `candidates.jsonl` was **not** used to build, filter, or label this set. It
is dropped as soon as candidates are read. The `relation` field is the LLM-annotated label and is
intentionally not named `gold_relation`.

## What changed from v1

v1 ([`tier1_eval.jsonl`](tier1_eval.jsonl), [`README_eval.md`](README_eval.md)) covered only the
186 template-generated candidates, and every `honorific_register` and `politeness_relationship`
item was excluded as `ambiguous`. v2 adds the 40 hand-authored candidates (`t1_0187`–`t1_0226`),
which were written to fill those two classes.

- All 136 v1 records are in v2, and their language, class, utterances and relation are
  unchanged (checked field by field).
- 37 of the 40 new candidates pass the filter, so the two classes now have items.
- v1 is left in place and has not been modified.

## How it was built

Built by [`scripts/build_tier1_eval_v2.js`](scripts/build_tier1_eval_v2.js)
(`node data/tier1/scripts/build_tier1_eval_v2.js`) from:

| batch | source file | pair_ids | annotators | agreement (relation) |
|---|---|---|---|---|
| `original_186` | [`annotations/llm_adjudicated.jsonl`](annotations/llm_adjudicated.jsonl) | t1_0001–t1_0186 (`template_generated`) | `llm_baseline`, `llm_baseline_B` | 159/186, κ = 0.775 ([`llm_agreement.json`](annotations/llm_agreement.json)) |
| `new_40` | [`annotations/llm_new_adjudicated.jsonl`](annotations/llm_new_adjudicated.jsonl) | t1_0187–t1_0226 (`hand_authored`) | `llm_new_A`, `llm_new_B` | 37/40, κ = 0.865 ([`llm_new_agreement.json`](annotations/llm_new_agreement.json)) |

Records were kept only if they met the protocol's final inclusion rule:

1. `grammaticality == "grammatical"`
2. `minimal_pair == "yes"`
3. `relation` is `same` or `different` (**not** `ambiguous`)

`language`, `distinction_class`, utterances and distinction values were joined from
`candidates.jsonl` by `pair_id`. The script fails if a pair_id is duplicated, is missing from
`candidates.jsonl`, or if the two sources together do not cover all 226 candidates.

### Adjudication in the new batch

- **Relation:** 3 disagreements. Two German items were adjudicated to `ambiguous` and excluded
  (t1_0195, t1_0199). One Korean item was adjudicated to `same` and kept (t1_0212). t1_0212 is
  the only kept record whose relation was adjudicated rather than agreed.
- **Grammaticality:** `llm_new_A` marked all 40 `grammatical`. `llm_new_B` marked 4 as
  `unnatural_but_grammatical` (t1_0198 de; t1_0222, t1_0224, t1_0226 hi). All 4 were adjudicated
  to `grammatical` and kept. They have `provenance.grammaticality_status == "adjudicated"`. The
  three Hindi rulings rest on surname + *didi* being a normal address form, and they are flagged
  for native-speaker confirmation.

## Record schema

Same as v1, with three new provenance fields (`batch`, `source_type`, `grammaticality_status`).

| Field | Description |
|---|---|
| `pair_id` | Candidate ID, same as in `candidates.jsonl` |
| `language` | `hi` / `tr` / `de` / `ko` |
| `distinction_class` | Taxonomy class |
| `utterance_a`, `utterance_b` | The two utterances, copied from `candidates.jsonl` |
| `distinction_value_a`, `distinction_value_b` | The distinguishing feature values |
| `relation` | `same` / `different`: **LLM-annotated, not human gold** |
| `provenance.label_source` | Always `llm_adjudicated_not_human_gold` |
| `provenance.batch` | `original_186` or `new_40` |
| `provenance.source_type` | `template_generated` or `hand_authored` (from `candidates.jsonl`) |
| `provenance.adjudicated_file` | Source file for the label |
| `provenance.adjudication_status` | Relation: `agreed` (both LLM annotators gave the same label) or `adjudicated` |
| `provenance.annotators` | Each LLM annotator's ID and raw relation label |
| `provenance.grammaticality`, `provenance.minimal_pair` | Final values that passed the filter |
| `provenance.grammaticality_status` | `new_40` only: `agreed` or `adjudicated` |

Full annotator records, including notes and adjudication rationales, are in the two
`adjudicated_file`s.

## Counts (173 of 226 candidates kept)

172 records are `agreed` on relation, and 1 is `adjudicated` (t1_0212).

### By relation

| relation | count |
|---|---|
| different | 98 |
| same | 75 |
| **total** | **173** |

### By class

| distinction_class | same | different | total |
|---|---|---|---|
| evidentiality | 34 | 0 | 34 |
| kinship | 0 | 32 | 32 |
| name_variant | 20 | 4 | 24 |
| classifier_measure | 0 | 24 | 24 |
| politeness_relationship | 14 | 10 | 24 |
| spatial_temporal_deixis | 0 | 22 | 22 |
| honorific_register | 7 | 6 | 13 |

### By language

| language | same | different | total |
|---|---|---|---|
| hi (Hindi/Hinglish) | 57 | 88 | 145 |
| ko (Korean) | 8 | 4 | 12 |
| tr (Turkish) | 10 | 0 | 10 |
| de (German) | 0 | 6 | 6 |

### By class × language

| distinction_class | hi | de | ko | tr |
|---|---|---|---|---|
| evidentiality | 24 same | – | – | 10 same |
| kinship | 32 diff | – | – | – |
| name_variant | 20 same / 4 diff | – | – | – |
| classifier_measure | 24 diff | – | – | – |
| spatial_temporal_deixis | 22 diff | – | – | – |
| honorific_register | 7 same | 6 diff | – | – |
| politeness_relationship | 6 same / 6 diff | – | 8 same / 4 diff | – |

### By batch

| batch | same | different | total kept | excluded |
|---|---|---|---|---|
| original_186 | 54 | 82 | 136 | 50 |
| new_40 | 21 | 16 | 37 | 3 |

### Exclusions (53)

All 53 were excluded because `relation == "ambiguous"`. No items were excluded as ungrammatical
or non-minimal.

| class | hi | de | ko | total |
|---|---|---|---|---|
| honorific_register | 17 (t1_0033–0048, t1_0190) | 9 (t1_0049–0055, t1_0195, t1_0199) | – | 26 |
| politeness_relationship | 15 (t1_0138–0152) | – | 12 (t1_0153–0164) | 27 |

## Limitations (read before using)

- **Not human gold.** All labels come from LLMs, including adjudication. The grammaticality and
  minimal-pair judgments were never checked by a native speaker. For the `new_40` batch, the same
  model family that wrote the candidates also annotated and adjudicated them.
- **Class and relation are still confounded, now within language too.** Apart from
  `name_variant`, `politeness_relationship` and the hi/ko split of `honorific_register`, each
  class has a single relation. `honorific_register` is all `same` in Hindi and all `different` in
  German, so a model could score well by learning class + language. Report per-class and
  per-language results, not just overall accuracy.
- **Language coverage is still narrow.** 145/173 items (84%) are Hindi. German is 6 items (all
  `honorific_register` / `different`), Korean 12 (all `politeness_relationship`), and Turkish 10
  (all `evidentiality` / `same`). Per-language numbers outside Hindi are indicative only.
- **Small new cells.** `honorific_register` has 13 items and `politeness_relationship` 24. Many
  class × language cells have fewer than the ~20 items the protocol suggests for a meaningful
  estimate.
- **Items are templated or closely patterned.** The 186 original items come from a small number
  of templates, and the hand-authored items reuse a few frames (e.g. surname + aunty/didi,
  first name + du/Sie). The effective number of independent probes is much smaller than 173.
