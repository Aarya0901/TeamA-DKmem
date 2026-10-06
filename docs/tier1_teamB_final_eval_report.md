# Team B — Tier 1 Final Evaluation Report

> **CRITICAL LABEL:** Every FCR/MCR number in this document is **"Tier 1 v2, LLM-annotated, provisional."**
> The relation labels in tier1_eval_v2.jsonl come from two LLM annotation passes plus LLM adjudication;
> no native speaker has reviewed them. Do not present these numbers as a validated benchmark result.
> (Contract §1 notice.)
>
> **"Final" in the title** means Team B's scoring of the six delivered runs is complete. It does
> not mean a final or gold evaluation: the labels are not human-validated, and only two DK-Mem
> variants have been run (no baseline).

**Status of each part of this report** (2026-10-02):

| Part | Status |
|---|---|
| Scoring of the 6 delivered Team A runs | Complete and verified |
| Every FCR/MCR number | Provisional: LLM-annotated labels |
| Re-score on human-annotated labels (§15) | Not started: no human annotation exists |
| Baselines, H1 / H2, frontier figure | Waiting on Team A runs and PI decisions (§16) |

---

## 1. Evaluation Setup

| Item | Value |
|---|---|
| Evaluation contract | docs/tier1_eval_contract.md |
| Answer key (LLM-annotated labels, not human gold) | data/tier1/eval_input/teamB_answer_key.jsonl |
| Scorer | data/tier1/scripts/score_tier1_eval.js |
| Scorer test suite | data/tier1/scripts/test_score_tier1_eval.js — **53/53 pass** |
| Cohen's κ test suite | data/tier1/scripts/test_cohens_kappa.js — **10/10 pass** |
| Total gold pairs | 173 (98 gold-different, 75 gold-same) |
| Ambiguous/excluded pairs | 53 — not scored, not in denominators (Contract §7) |
| Output directory (new, Team B side) | data/tier1/teamB_eval_output/ |

The scorer joins Team A entries to the answer key via source_utterance_id, builds union-find
clusters over entry_id for decision in {merge, supersede}, and determines per-pair outcomes
per Contract §4. FCR and MCR denominators are **all** gold pairs (98 and 75 respectively),
including pairs with no entry or no comparison.

---

## 2. Strategies and Seeds

| Strategy | Backbone | Seeds |
|---|---|---|
| dk-mem-lexicon | null (lexicon-only, no LLM stage) | 0, 1, 2 |
| dk-mem-lexicon-llm | Qwen/Qwen2.5-3B-Instruct | 0, 1, 2 |

**Backbone comparability note (Contract §8):** dk-mem-lexicon has no LLM stage (backbone: null)
and is exempt from the backbone comparability rule. dk-mem-lexicon-llm uses
Qwen/Qwen2.5-3B-Instruct. This difference must be noted in every table comparing the two strategies.

**Similarity score (reported by Team A):** Team A states that `similarity_score` in these runs
comes from a deterministic string-similarity implementation, not an embedding model. Team B has
not verified this independently; the run files don't record how the score is computed. Decoding
and quantization settings for the Qwen runs are not recorded.

---

## 3. Validation Status

All 6 runs passed every scorer-enforced contract check before scoring. **No run was rejected.**
Re-verified on 2026-10-02 by re-scoring all 6 runs in memory: the stored reports in
data/tier1/teamB_eval_output/ are identical to a fresh score.

The table covers what the scorer checks. The intake checklist's manual BLOCK items (Team A's
input-hash confirmation, the blinding and memory-reset attestations, and the model settings) have
no record in the repository; see §12.

| Check | dk-mem-lexicon (x3) | dk-mem-lexicon-llm (x3) |
|---|---|---|
| run_manifest.json present | pass | pass |
| pairwise_eval.jsonl present | pass | pass |
| Schema valid (manifest + records) | pass | pass |
| dataset_tier == tier1_minimal_pairs | pass | pass |
| strategy in schema enum | pass | pass |
| run_id matches manifest in every record | pass | pass |
| No duplicate record_id | pass | pass |
| No entry_id used for two different utterances | pass | pass |
| gold_entity_id matches key for every entry | pass | pass |
| 3 seeds: distinct seeds and run_ids | pass | pass |
| 3 seeds: same strategy/backbone/settings | pass | pass |
| Schema validation errors | 0 | 0 |
| Validation warnings | 0 | 0 |

---

## 4. Per-Run Results

### dk-mem-lexicon

| Run | Records total | Scored cross-utt | Ignored (unk/cross/same) | FCR num/denom | FCR rate | MCR num/denom | MCR rate |
|---|---|---|---|---|---|---|---|
| seed 0 | 173 | 173 | 0/0/0 | 13/98 | 0.133 | 61/75 | 0.813 |
| seed 1 | 173 | 173 | 0/0/0 | 13/98 | 0.133 | 61/75 | 0.813 |
| seed 2 | 173 | 173 | 0/0/0 | 13/98 | 0.133 | 61/75 | 0.813 |

### dk-mem-lexicon-llm (backbone: Qwen/Qwen2.5-3B-Instruct)

| Run | Records total | Scored cross-utt | Ignored (unk/cross/same) | FCR num/denom | FCR rate | MCR num/denom | MCR rate |
|---|---|---|---|---|---|---|---|
| seed 0 | 138 | 138 | 0/0/0 | 5/98 | 0.051 | 57/75 | 0.760 |
| seed 1 | 138 | 138 | 0/0/0 | 5/98 | 0.051 | 57/75 | 0.760 |
| seed 2 | 138 | 138 | 0/0/0 | 5/98 | 0.051 | 57/75 | 0.760 |

Note: 138 scored cross-utterance records means 35 episodes produced no_entry (see §8).

---

## 5. Overall FCR / MCR — Mean ± SD across 3 Seeds

*(Tier 1 v2, LLM-annotated, provisional. Backbone differs — see §2 note before comparing rows.)*

| Strategy | Backbone | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom |
|---|---|---|---|---|---|
| dk-mem-lexicon | null | 0.133 ± 0.000 | 13/98 | 0.813 ± 0.000 | 61/75 |
| dk-mem-lexicon-llm | Qwen/Qwen2.5-3B-Instruct | 0.051 ± 0.000 | 5/98 | 0.760 ± 0.000 | 57/75 |

SD = sample standard deviation (n−1) of per-seed rates. SD = 0.000 because all three seeds
within each strategy produced identical merge decisions (see §11 Seed Variance).

> **Do not headline overall FCR/MCR alone.** Class and language are largely confounded.
> honorific_register is all-same in Hindi and all-different in German. 145/173 pairs are Hindi.
> (Contract §8 reporting rule.)

---

## 6. Distinction-Class Breakdown

*(mean ± SD across 3 seeds; SD = 0.000 throughout; Tier 1 v2, LLM-annotated, provisional)*

### dk-mem-lexicon (backbone: null)

| distinction_class | n | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom | Flag |
|---|---|---|---|---|---|---|
| classifier_measure | 24 | 0.000 ± 0.000 | 0/24 | n/a | 0 gold-same | |
| evidentiality | 34 | n/a | 0 gold-diff | 1.000 ± 0.000 | 34/34 | |
| honorific_register | 13 | 1.000 ± 0.000 | 6/6 | 0.714 ± 0.000 | 5/7 | indicative |
| kinship | 32 | 0.000 ± 0.000 | 0/32 | n/a | 0 gold-same | |
| name_variant | 24 | 0.000 ± 0.000 | 0/4 | 1.000 ± 0.000 | 20/20 | |
| politeness_relationship | 24 | 0.100 ± 0.000 | 1/10 | 0.143 ± 0.000 | 2/14 | |
| spatial_temporal_deixis | 22 | 0.273 ± 0.000 | 6/22 | n/a | 0 gold-same | |

### dk-mem-lexicon-llm (backbone: Qwen/Qwen2.5-3B-Instruct)

| distinction_class | n | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom | Flag |
|---|---|---|---|---|---|---|
| classifier_measure | 24 | 0.000 ± 0.000 | 0/24 | n/a | 0 gold-same | |
| evidentiality | 34 | n/a | 0 gold-diff | 1.000 ± 0.000 | 34/34 | |
| honorific_register | 13 | 0.167 ± 0.000 | 1/6 | 0.857 ± 0.000 | 6/7 | indicative |
| kinship | 32 | 0.000 ± 0.000 | 0/32 | n/a | 0 gold-same | |
| name_variant | 24 | 0.250 ± 0.000 | 1/4 | 0.500 ± 0.000 | 10/20 | |
| politeness_relationship | 24 | 0.200 ± 0.000 | 2/10 | 0.500 ± 0.000 | 7/14 | |
| spatial_temporal_deixis | 22 | 0.045 ± 0.000 | 1/22 | n/a | 0 gold-same | |

Contract §8 n/a cells: FCR = n/a for evidentiality (0 gold-diff). MCR = n/a for kinship,
classifier_measure, spatial_temporal_deixis (0 gold-same). indicative = n < 20.

---

## 7. Language Breakdown

*(SD = 0.000 throughout; Tier 1 v2, LLM-annotated, provisional)*

### dk-mem-lexicon (backbone: null)

| language | n | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom | Flag |
|---|---|---|---|---|---|---|
| hi | 145 | 0.080 ± 0.000 | 7/88 | 0.860 ± 0.000 | 49/57 | |
| ko | 12 | 0.000 ± 0.000 | 0/4 | 0.250 ± 0.000 | 2/8 | indicative |
| tr | 10 | n/a | 0 gold-diff | 1.000 ± 0.000 | 10/10 | indicative |
| de | 6 | 1.000 ± 0.000 | 6/6 | n/a | 0 gold-same | indicative |

### dk-mem-lexicon-llm (backbone: Qwen/Qwen2.5-3B-Instruct)

| language | n | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom | Flag |
|---|---|---|---|---|---|---|
| hi | 145 | 0.023 ± 0.000 | 2/88 | 0.754 ± 0.000 | 43/57 | |
| ko | 12 | 0.500 ± 0.000 | 2/4 | 0.500 ± 0.000 | 4/8 | indicative |
| tr | 10 | n/a | 0 gold-diff | 1.000 ± 0.000 | 10/10 | indicative |
| de | 6 | 0.167 ± 0.000 | 1/6 | n/a | 0 gold-same | indicative |

Contract §8: FCR = n/a for tr (0 gold-diff). MCR = n/a for de (0 gold-same).
Every non-Hindi cell is indicative (de n=6, ko n=12, tr n=10).

---

## 8. Coverage

### dk-mem-lexicon — complete

All 173 episodes produced at least one scored cross-utterance record.
No episodes had no_entry. Coverage limitation: none.

### dk-mem-lexicon-llm — 138 of 173 episodes covered

| Metric | Value |
|---|---|
| Episodes expected | 173 |
| Episodes comparable (scored cross-utterance) | **138** |
| Episodes with no_entry (no cross-utterance record) | **35** |
| — gold-different no_entry | 16 |
| — gold-same no_entry | 19 |

The 35 missing episodes are scored exactly as Contract §4–§6 define a "no entry" pair: not
merged, and kept in the denominators. No merge decision exists for any of them.
- 16 gold-different no_entry: not merged, so they add 0 to the FCR numerator. They are not
  evidence that the system correctly kept the pair apart.
- 19 gold-same no_entry: not merged, so they add 19 to the MCR numerator (Contract §6 counts
  every not-merged outcome as a miss). They are not decisions against merging.

Results for missing episodes are **not fabricated or imputed**.

In all 35, neither utterance appears in any record, and the same 35 episodes are missing in every
seed. The scorer can't tell a skipped episode from one whose utterances produced no entries.

| class x language | gold-different missing | gold-same missing |
|---|---|---|
| evidentiality x hi | | 11 |
| politeness_relationship x hi | 4 | 2 |
| kinship x hi | 4 | |
| classifier_measure x hi | 4 | |
| honorific_register x hi | | 3 |
| honorific_register x de | 2 | |
| name_variant x hi | | 2 |
| spatial_temporal_deixis x hi | 2 | |
| politeness_relationship x ko | | 1 |
| **total** | **16** | **19** |

---

## 9. Outcome Counts (Contract §4 terminology, per seed)

Counts are identical across all 3 seeds within each strategy.

### dk-mem-lexicon — per seed

| gold relation | merged | compared_not_merged | not_compared | no_entry |
|---|---|---|---|---|
| different (n=98) | **13** (false merge) | 85 | 0 | 0 |
| same (n=75) | **14** (correct merge) | 61 | 0 | 0 |

Summary: correct merge=14, false merge=13, correct no-merge=85, missed merge=61.

### dk-mem-lexicon-llm — per seed

| gold relation | merged | compared_not_merged | not_compared | no_entry |
|---|---|---|---|---|
| different (n=98) | **5** (false merge) | 77 | 0 | 16 |
| same (n=75) | **18** (correct merge) | 38 | 0 | 19 |

Summary: correct merge=18, false merge=5. Gold-different not merged: 93, of which 77 were
compared and kept apart and 16 are no_entry (no decision). Gold-same not merged: 57, of which 38
were compared and not merged and 19 are no_entry (coverage gap, not a system decision).

---

## 10. Class × Language Breakdown

Full data: data/tier1/teamB_eval_output/dk-mem-lexicon_seeds.json and
data/tier1/teamB_eval_output/dk-mem-lexicon-llm_seeds.json.

### dk-mem-lexicon (all seeds identical)

| class x language | n | FCR (num/denom) | MCR (num/denom) | Flag |
|---|---|---|---|---|
| classifier_measure x hi | 24 | 0.000 (0/24) | n/a | |
| evidentiality x hi | 24 | n/a | 1.000 (24/24) | |
| evidentiality x tr | 10 | n/a | 1.000 (10/10) | indicative |
| honorific_register x de | 6 | 1.000 (6/6) | n/a | indicative |
| honorific_register x hi | 7 | n/a | 0.714 (5/7) | indicative |
| kinship x hi | 32 | 0.000 (0/32) | n/a | |
| name_variant x hi | 24 | 0.000 (0/4) | 1.000 (20/20) | |
| politeness_relationship x hi | 12 | 0.167 (1/6) | 0.000 (0/6) | indicative |
| politeness_relationship x ko | 12 | 0.000 (0/4) | 0.250 (2/8) | indicative |
| spatial_temporal_deixis x hi | 22 | 0.273 (6/22) | n/a | |

### dk-mem-lexicon-llm (all seeds identical)

| class x language | n | FCR (num/denom) | MCR (num/denom) | Flag |
|---|---|---|---|---|
| classifier_measure x hi | 24 | 0.000 (0/24) | n/a | |
| evidentiality x hi | 24 | n/a | 1.000 (24/24) | |
| evidentiality x tr | 10 | n/a | 1.000 (10/10) | indicative |
| honorific_register x de | 6 | 0.167 (1/6) | n/a | indicative |
| honorific_register x hi | 7 | n/a | 0.857 (6/7) | indicative |
| kinship x hi | 32 | 0.000 (0/32) | n/a | |
| name_variant x hi | 24 | 0.250 (1/4) | 0.500 (10/20) | |
| politeness_relationship x hi | 12 | 0.000 (0/6) | 0.500 (3/6) | indicative |
| politeness_relationship x ko | 12 | 0.500 (2/4) | 0.500 (4/8) | indicative |
| spatial_temporal_deixis x hi | 22 | 0.045 (1/22) | n/a | |

All cells with n < 20 are flagged indicative per Contract §8.

---

## 11. Seed Variance Observation

**Both strategies show SD = 0.000 in every cell across all three seeds.**

This is not a numerical artefact. Within each strategy, the three pairwise_eval.jsonl files are
identical in every field of every record except `run_id` (decisions, similarity scores,
compatibility, entries). The seed parameter introduced no variation in the submitted outputs.
The three per-seed rates are identical, so the sample SD (n−1) is 0; it is not suppressed. (The
scorer's JSON shows values around 1e-16 in a few cells, which is floating-point rounding.)

Consequence: the three seeds do not provide independent evidence of run-to-run stability.
The three-seed mean equals any individual seed's rate.

---

## 12. Warnings Required by the Contract

1. **Not human gold.** Every number is Tier 1 v2, LLM-annotated, provisional. Do not present
   as a validated benchmark result. (Contract §1)
2. **Do not headline overall FCR/MCR alone.** Class and language are largely confounded;
   145/173 pairs are Hindi. (Contract §8)
3. **Indicative cells.** de (n=6), ko (n=12), tr (n=10), honorific_register (n=13).
   Directional only. (Contract §8)
4. **Backbone differs.** dk-mem-lexicon (backbone: null) vs dk-mem-lexicon-llm
   (Qwen/Qwen2.5-3B-Instruct). Backbone-null is exempt per Contract §8, but the difference
   must appear in every comparison table. Model settings are not in the manifest.
5. **SD = 0.000** means the submitted seeds are deterministically identical, not that the
   system has zero variance in general.
6. **dk-mem-lexicon-llm coverage limitation.** 35/173 episodes (20%) have no_entry.
   They count as not-merged toward denominators. No results are fabricated.
7. **No baseline.** Only two DK-Mem variants were run. These results don't test H1 or H2 and
   support no comparison against a baseline.
8. **Manual intake items unrecorded.** The repository holds no record of Team A's input-hash
   confirmation, blinding attestation, memory-reset attestation or model settings (intake
   checklist §2 and §4, all BLOCK). Team B's copy of the blinded input still has sha256
   `eab5dcb2…4cd07`. The one setting Team A has reported is the similarity-score method (§2).

---

## 13. Interpretation / Limitations

**What is measured:** FCR measures the rate at which the system merges entity entries that
the LLM-annotated labels say should remain distinct. MCR measures the rate at which it fails to
merge entries those labels say are the same entity. "Gold" in this report always means these
LLM-annotated labels, not human gold. Denominators are fixed at 98 (FCR) and
75 (MCR) regardless of coverage.

**Label validity:** Gold labels come from LLM annotation plus LLM adjudication, without
native-speaker review. All FCR/MCR values inherit this uncertainty.

**Zero seed variance:** Both strategies submitted identical decisions across seeds 0, 1, 2.
No additional stability information can be extracted from the three-seed structure.

**Coverage gap (dk-mem-lexicon-llm):** 35 uncompared episodes are a structural submission
limitation. Of the 57 MCR misses, 19 are no_entry (not a decision, a coverage gap).
Results for these episodes are not imputed.

**Small cells:** Every non-Hindi language cell and honorific_register are indicative (n < 20)
and should not be used as primary evidence.

**Ambiguous pairs:** 53 excluded pairs are not scored and not in any denominator (Contract §7).

---

## 14. Files Created by This Evaluation

| File | Role |
|---|---|
| data/tier1/teamB_eval_output/dk-mem-lexicon_seed0.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon_seed1.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon_seed2.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon-llm_seed0.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon-llm_seed1.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon-llm_seed2.json | Scorer JSON output, single run |
| data/tier1/teamB_eval_output/dk-mem-lexicon_seeds.json | Multi-seed summary JSON (mean ± SD) |
| data/tier1/teamB_eval_output/dk-mem-lexicon-llm_seeds.json | Multi-seed summary JSON (mean ± SD) |
| data/tier1/teamB_eval_output/&lt;run_id&gt;_sweep.json (6 files) | Scorer JSON output, per-run threshold sweep (breakpoints) |
| data/tier1/teamB_eval_output/tier1_final_results.json | Machine-readable results summary (assembled from the scorer reports, not written by the scorer) |
| docs/tier1_teamB_final_eval_report.md | This document |

No Team A run file was modified. All scorer output listed above is in
data/tier1/teamB_eval_output/ or docs/, outside any Team A run directory.

An earlier set of scorer reports (including per-run sweeps) also sits in
data/tier1/tier1_results/reports/, beside the six run directories. Those files are derived from
the answer key, so that folder must not be shared with Team A as it stands.

---

## 15. Human-Annotation Re-Score (reserved, not started)

**No human-annotation result exists.** `data/tier1/annotator_A.jsonl` and `annotator_B.jsonl` are
blank (226 records each, every judgment `null`), so there is no human Cohen's κ and the protocol's
κ > 0.7 gate has not been met. Nothing in §4–§11 is a human-validated result.

This section is where the human-label results go. Sections §4–§11 stay as the LLM-label record.
The Team A run files don't need to be re-run: the same six runs are re-scored against a new key.

Steps once annotation is complete (`docs/tier1_annotation_protocol.md`):

1. Compute κ per language with `data/tier1/scripts/cohens_kappa.js` and fill in the κ table.
2. Adjudicate, apply the final inclusion rule, and build a human-label answer key.
3. Re-score the same six runs with `score_tier1_eval.js --key <human key>`, writing to a
   separate output folder.
4. Fill in the results table. Denominators may differ from 98 / 75 if the kept set changes.

Decisions these steps depend on are not made here: the null-label policy for κ
(`docs/tier1_null_label_decision.md`), and whether human labels replace or supplement the v2
labels.

**Human κ (relation, before adjudication)**

| language | n | n_unlabeled | p_o | κ | κ > 0.7 |
|---|---|---|---|---|---|
| hi | `[PENDING HUMAN ANNOTATION]` | | | | |
| de | `[PENDING HUMAN ANNOTATION]` | | | | |
| tr | `[PENDING HUMAN ANNOTATION]` | | | | |
| ko | `[PENDING HUMAN ANNOTATION]` | | | | |
| pooled | `[PENDING HUMAN ANNOTATION]` | | | | |

**Overall FCR / MCR on human labels** (mean ± SD across 3 seeds)

| Strategy | Backbone | FCR mean ± SD | FCR num/denom | MCR mean ± SD | MCR num/denom |
|---|---|---|---|---|---|
| dk-mem-lexicon | null | `[PENDING HUMAN ANNOTATION]` | | | |
| dk-mem-lexicon-llm | Qwen/Qwen2.5-3B-Instruct | `[PENDING HUMAN ANNOTATION]` | | | |

Per-class, per-language, class × language and outcome tables follow the layout of §6, §7, §10
and §9.

---

## 16. Open Dependencies

**Team A**
- Baseline runs (and the other strategies in the contract's list), ≥3 seeds each. Without them
  H1 and H2 can't be evaluated and the frontier figure can't be drawn.
- Written input-hash confirmation and the blinding and memory-reset attestations.
- Decoding and quantization settings for the Qwen runs.
- Why 35 episodes are missing from dk-mem-lexicon-llm: skipped, or no entries extracted.
- Whether the seed is used: the three seed files per strategy are identical apart from `run_id`.

**Human annotation**
- Native-speaker annotation of the 226 candidates, κ per language, adjudication (§15).

**PI decisions (all open; none is decided in this report)**
- D1–D6 in `docs/tier1_results_presentation.md`, slide 11.
- Null-label policy for κ (`docs/tier1_null_label_decision.md`).

---

## 17. Reproducibility

**Strategies and seeds:** dk-mem-lexicon and dk-mem-lexicon-llm, seeds 0, 1, 2 (6 runs).

**Inputs** (sha256)

| File | sha256 |
|---|---|
| data/tier1/eval_input/teamA_tier1_v2.jsonl (blinded input, 173 records) | `eab5dcb23375eb2e744c72a98cb31c25da0171b2ba3297a0843574ed9a34cd07` |
| data/tier1/tier1_eval_v2.jsonl (173 pairs) | `3310956620bd4205e13fcb61fd622330a322dbad9c93a38c37de2309d5b604cb` |
| data/tier1/eval_input/teamB_answer_key.jsonl | `0cfda04896950387bcd23fa3c59dc9e71befba9d84021d66fe65bb0fa9848fca` |
| data/tier1/scripts/score_tier1_eval.js | `9883a224169b93fbbc3769be26d0b1d47faa37864d71e831c9966d7c5c86afbb` |
| docs/schemas/pairwise_eval.schema.json | `93c5ddf78d6eacb3db3cbc21b90eb33ecb4eb4955381f753aa1df3294bf5f9bf` |
| docs/schemas/run_manifest.schema.json | `52daa1f45b2a755df503788806fd16aaa62a17fd73e230158f8878644eb271e1` |

**Runs** (each in data/tier1/tier1_results/&lt;run_id&gt;/; identical to data/tier1/tier1_results.zip)

| run_id | seed | records | manifest `created_at` | pairwise_eval.jsonl sha256 |
|---|---|---|---|---|
| dk-mem-lexicon_seed0 | 0 | 173 | 2026-09-30T18:04:15Z | `e4953e52a37bb41250b2ac75c6152d8bcd23855829840327b9db3347bad817bf` |
| dk-mem-lexicon_seed1 | 1 | 173 | 2026-09-30T18:04:16Z | `ce51a23ddb80187c4342e26b419be5f54b79afc8624358515133767c6840d5ac` |
| dk-mem-lexicon_seed2 | 2 | 173 | 2026-09-30T18:04:16Z | `efe8ec85a206e17552883ebb47a9750b408b62a95d8c0a1f74ab64c61b2e9177` |
| dk-mem-lexicon-llm_seed0 | 0 | 138 | 2026-09-30T18:12:06Z | `cee44b724fb81458792be1f4322213232181c576fe1a5c454d9f9e6c4e6ec6ea` |
| dk-mem-lexicon-llm_seed1 | 1 | 138 | 2026-09-30T18:18:47Z | `6fdb478e49582a4fc07ac2050afeb43183c2538779ec2e4400f83ccae1ed2a86` |
| dk-mem-lexicon-llm_seed2 | 2 | 138 | 2026-09-30T18:25:35Z | `dfbf54bb1ccb9e6b1ef305951cc1ef21623e6cefe064187ddb08da57b755bbdf` |

**Commands** (from the repo root; all exited 0 with no errors or warnings on 2026-10-02)

```
# single run, once per run_id
node data/tier1/scripts/score_tier1_eval.js --pairwise data/tier1/tier1_results/<run_id>/pairwise_eval.jsonl --manifest data/tier1/tier1_results/<run_id>/run_manifest.json --json data/tier1/teamB_eval_output/<run_id>.json

# multi-seed, once per strategy
node data/tier1/scripts/score_tier1_eval.js --run <seed0 pairwise>,<seed0 manifest> --run <seed1 pairwise>,<seed1 manifest> --run <seed2 pairwise>,<seed2 manifest> --json data/tier1/teamB_eval_output/<strategy>_seeds.json

# threshold sweep, once per run_id
node data/tier1/scripts/score_tier1_eval.js --pairwise ... --manifest ... --sweep breakpoints --json data/tier1/teamB_eval_output/<run_id>_sweep.json
```

**Validation checks that matter for these numbers**
- Schema validation of every manifest and every record: pass, 0 errors, 0 warnings (§3).
- Record counts: 173 per dk-mem-lexicon seed, 138 per dk-mem-lexicon-llm seed.
- Ignored records (unknown utterance / cross-episode / same-utterance): 0 / 0 / 0 in every run.
- Multi-seed checks: 3 distinct seeds and run_ids, same strategy and backbone within a strategy.
- Sweep: the re-derived rule reproduces the system's own decision on every scored record
  (173/173 and 138/138) at the runs' threshold of 0.85.
- Re-running the scorer reproduces the stored reports byte for byte.

**Tests**
- `node --test data/tier1/scripts/test_score_tier1_eval.js`: 53/53 pass.
- `node --test data/tier1/scripts/test_cohens_kappa.js`: 10/10 pass.
