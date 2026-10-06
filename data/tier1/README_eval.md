# Provisional Tier 1 evaluation set (`tier1_eval.jsonl`)

## Status: LLM-annotated and LLM-adjudicated, NOT human gold

**Every `relation` label in this file comes from LLM annotators, not from human native speakers.**
Two independent LLM baselines (`llm_baseline`, `llm_baseline_B`) annotated all 186
template-generated candidates (`candidates.jsonl` now also holds 40 hand-authored ones, 226 in
total; they are covered by v2, [`README_eval_v2.md`](README_eval_v2.md), which is the set the
Team A runs were scored against), and
an LLM adjudicator resolved their disagreements. No native speaker of any language has reviewed
these labels. This is **not** the hand-validated Tier 1 set the research plan calls for (κ pilot
with native-speaker annotators, second-speaker sign-off; see
[`docs/tier1_annotation_protocol.md`](../../docs/tier1_annotation_protocol.md)).

Use it for pipeline development and provisional numbers only. Do not report results against it
as a validated benchmark, and label any numbers from it as "LLM-annotated, provisional". It should
be replaced once human annotation (`annotator_A.jsonl` / `annotator_B.jsonl`) is complete.

`gold_relation` from `candidates.jsonl` (the generation-time default) was **not** used to build,
filter, or label this set. The `relation` field here is the LLM-annotated label and is
intentionally not named `gold_relation`.

## How it was built

Source: [`annotations/llm_adjudicated.jsonl`](annotations/llm_adjudicated.jsonl) (186 records).
Records were kept only if they met the protocol's final inclusion rule:

1. `grammaticality == "grammatical"`
2. `minimal_pair == "yes"`
3. `relation` is `same` or `different` (**not** `ambiguous`)

`language`, `distinction_class`, utterances and distinction values were joined from
`candidates.jsonl` by `pair_id`. `gold_relation` was dropped when the file was read.

Pipeline: `annotations/llm_baseline.jsonl` + `annotations/llm_baseline_B.jsonl` ->
`annotations/llm_agreement.json` (relation: 159/186 exact agreement, Cohen's κ = 0.775;
grammaticality and minimal_pair 186/186, κ undefined because only one label was used) ->
`annotations/llm_adjudicated.jsonl` (27 disagreements adjudicated, all to `ambiguous`) -> this
file.

## Record schema

| Field | Description |
|---|---|
| `pair_id` | Candidate ID, same as in `candidates.jsonl` |
| `language` | `hi` / `tr` (see coverage below) |
| `distinction_class` | Taxonomy class |
| `utterance_a`, `utterance_b` | The two utterances, copied from `candidates.jsonl` |
| `distinction_value_a`, `distinction_value_b` | The distinguishing feature values |
| `relation` | `same` / `different`: **LLM-annotated, not human gold** |
| `provenance.label_source` | Always `llm_adjudicated_not_human_gold` |
| `provenance.adjudicated_file` | Source file for the label |
| `provenance.adjudication_status` | `agreed` (both LLM annotators gave the same relation) or `adjudicated` |
| `provenance.annotators` | Each LLM annotator's ID and raw relation label |
| `provenance.grammaticality`, `provenance.minimal_pair` | Final values that passed the filter |

Full annotator records, including notes and the adjudication rationale, are in
`annotations/llm_adjudicated.jsonl`.

## Counts (136 of the 186 template-generated candidates kept)

All 136 kept records are `agreed`: both LLM annotators independently gave the same relation.
Every adjudicated item was resolved to `ambiguous`, so none are in this set.

### By relation

| relation | count |
|---|---|
| different | 82 |
| same | 54 |
| **total** | **136** |

### By class

| distinction_class | same | different | total |
|---|---|---|---|
| evidentiality | 34 | 0 | 34 |
| kinship | 0 | 32 | 32 |
| name_variant | 20 | 4 | 24 |
| classifier_measure | 0 | 24 | 24 |
| spatial_temporal_deixis | 0 | 22 | 22 |
| honorific_register | – | – | 0 (all 23 excluded) |
| politeness_relationship | – | – | 0 (all 27 excluded) |

### By language

| language | same | different | total |
|---|---|---|---|
| hi (Hindi/Hinglish) | 44 | 82 | 126 |
| tr (Turkish) | 10 | 0 | 10 |
| de (German) | – | – | 0 (all 7 excluded) |
| ko (Korean) | – | – | 0 (all 12 excluded) |

### Exclusions (50)

All 50 were excluded because `relation == "ambiguous"`. No items were excluded as ungrammatical
or non-minimal (the LLM annotators marked all 186 grammatical and minimal).

| class | hi | de | ko | total |
|---|---|---|---|---|
| honorific_register | 16 | 7 | – | 23 |
| politeness_relationship | 15 | – | 12 | 27 |

## Limitations (read before using)

- **Not human gold.** All labels come from LLMs, including the adjudication. The 186/186
  grammatical and minimal-pair judgments were never checked by a native speaker, and Hindi,
  German, Turkish and Korean are all affected.
- **Two classes are missing.** `honorific_register` and `politeness_relationship` have zero
  items. The set cannot measure false consolidation on register or politeness distinctions.
- **Language coverage is very narrow.** 126/136 items are Hindi. German and Korean only appeared
  in the two excluded classes, so they are absent. Turkish is 10 items, all `evidentiality` /
  `same`.
- **Class and relation are confounded.** Apart from `name_variant`, every class has a single
  relation (e.g. kinship is always `different`, evidentiality always `same`). A model can score
  well by learning the class rather than judging the pair. Report per-class results, not just
  overall accuracy.
- **Items are templated.** Items come from a small number of templates with filler substitution
  (see [`README.md`](README.md)), so the effective number of independent probes is much smaller
  than 136.
