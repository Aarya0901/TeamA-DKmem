# Tier 1 v2 results: presentation draft (12 slides)

**Status: DRAFT, with provisional results for two strategies only** (audited 2026-10-02). Team A
delivered 6 runs: `dk-mem-lexicon` and `dk-mem-lexicon-llm`, 3 seeds each. All 6 pass the scorer's
contract validation, and their numbers are filled in below. No baseline strategy has been
delivered, so everything that depends on a baseline is still **`[PENDING TEAM A RUNS]`**, and H1
and H2 cannot be evaluated yet.

Every number in this deck is **"Tier 1 v2, LLM-annotated, provisional"**. None is human-validated,
and none is a final or gold evaluation.

**Sources:**
- [`tier1_teamB_final_eval_report.md`](tier1_teamB_final_eval_report.md) (scored results; "final"
  there means the scoring of the delivered runs is complete, not that the labels are final)
- `data/tier1/teamB_eval_output/` (scorer JSON reports the numbers below are copied from)
- [`research_idea_context.md`](../research_idea_context.md) (research notes)
- [`data/tier1/README_eval_v2.md`](../data/tier1/README_eval_v2.md) (dataset)
- [`tier1_annotation_protocol.md`](tier1_annotation_protocol.md)
- [`tier1_eval_contract.md`](tier1_eval_contract.md) (contract)
- [`teamA_tier1_run_instructions.md`](teamA_tier1_run_instructions.md)
- [`teamB_tier1_run_intake_checklist.md`](teamB_tier1_run_intake_checklist.md)
- [`data/tier1/scripts/score_tier1_eval.js`](../data/tier1/scripts/score_tier1_eval.js) (scorer)

> **Label on every slide that shows a number:** "Tier 1 v2, LLM-annotated, provisional". Tier 1 v2
> labels are LLM-annotated/adjudicated, **not human gold**. No native speaker has reviewed them.

---

## Slide 1: Title and research question

**Cross-lingual false consolidation in LLM memory systems: Tier 1 v2 minimal-pair probe (provisional)**

- **Research question:** when a memory system normalizes a non-English utterance to English at write
  time, does a distinction English doesn't lexicalize get lost before the merge decision that
  depends on it, so that distinct entities are wrongly consolidated?
- **Scope of this talk:** Tier 1 only (173 minimal pairs). Tier 2 and Tier 3 are designed but not
  built.
- Presenter / date: `[FILL IN]`

> *Speaker note:* Frame this as a measurement study still in progress. Say up front that the
> labels are LLM-produced, that only two DK-Mem variants have been run, and that no baseline
> results exist yet.

---

## Slide 2: Why cross-lingual distinction loss matters

- **Mechanism (research notes §3):**
  1. an utterance in language L carries a distinction D;
  2. write-side extraction normalizes to English, and D is destroyed;
  3. a later fact becomes string-identical or embedding-adjacent;
  4. consolidation merges them, or treats one as a supersession.
- **Consequence:** a true fact is deleted. "No read-side technique can recover it — it is not in the
  store."
- **Not the same as "translation is lossy":** the harm is memory-store corruption, not only degraded
  answer quality.
- **Examples from the taxonomy:** *chachi / mausi* → "aunt"; *tu / tum / aap* → "you"; Turkish
  *-dı / -mış* evidentiality → dropped.

> *Speaker note:* This is the motivation from the research notes, not an observed result. Use the
> *chachi/mausi* example; it's the running example throughout the docs.

---

## Slide 3: Hypotheses (neutral, testable)

Both hypotheses are tested on Tier 1 v2, with provisional labels.

- **H1 (the failure occurs):** baseline memory systems merge some gold-`different` minimal pairs,
  i.e. FCR > 0.
  - *Null:* FCR = 0 for the baselines.
- **H2 (gating helps):** DK-Mem's FCR–MCR frontier lies below the baselines' frontiers, i.e. lower
  FCR at matched MCR. This is the research notes' central claim, stated here as a hypothesis.
  - *Null:* no frontier dominance.
- **Outcomes:** H1 `[PENDING TEAM A RUNS]`. H2 `[PENDING TEAM A RUNS]`.
  - Both hypotheses are about baselines, and no baseline run has been delivered. The two DK-Mem
    variants on slide 8 don't test either one.
- **Decision criterion from the research notes (C1):** "if FCR < 10% for baselines, the premise is
  too weak for a method paper". It was stated for the 30-example pilot. Whether it applies to Tier 1
  v2 is `[PI DECISION]`.

> *Speaker note:* Both hypotheses can fail. A system that never merges has FCR = 0, which is why
> H2 is about the frontier, not a single FCR number.

---

## Slide 4: Tier 1 dataset design and composition

- **Item:** two utterances that differ only in one distinction feature, with a gold relation
  `same` or `different` (LLM-labelled) and a distinction class.
- **Candidates:** 226 in total.
  - by origin: 186 template-generated and 40 hand-authored;
  - by language: 177 `hi`, 15 `de`, 10 `tr`, 24 `ko`.
- **Kept in v2: 173.** 53 were excluded, all as `ambiguous`: `honorific_register` hi 17 / de 9, and
  `politeness_relationship` hi 15 / ko 12.

| Relation | n |
|---|---|
| different | 98 |
| same | 75 |
| **total** | **173** |

| distinction_class | same | different | | language | same | different |
|---|---|---|---|---|---|---|
| evidentiality | 34 | 0 | | hi | 57 | 88 |
| kinship | 0 | 32 | | ko | 8 | 4 |
| name_variant | 20 | 4 | | tr | 10 | 0 |
| classifier_measure | 0 | 24 | | de | 0 | 6 |
| politeness_relationship | 14 | 10 | | | | |
| spatial_temporal_deixis | 0 | 22 | | | | |
| honorific_register | 7 | 6 | | | | |

- **Hindi share:** 145 of 173 pairs are Hindi (84%).
- **Class × language:** only 10 of the 28 possible cells are populated, and 5 of those have
  n < 20.

> *Speaker note:* Point out the confound. Most classes have a single relation: evidentiality is all
> `same`; kinship, classifier_measure and spatial_temporal_deixis are all `different`.
> honorific_register is all `same` in Hindi and all `different` in German.

---

## Slide 5: Annotation process and label status

- **Pipeline:**
  1. two independent LLM annotation passes per candidate (grammaticality, minimality, relation);
  2. LLM adjudication of disagreements;
  3. inclusion only if grammatical, minimal, and the relation is `same` or `different`.
- **Agreement between the two LLM passes on relation:**
  - `original_186` batch: 159/186, κ = 0.775;
  - `new_40` batch: 37/40, κ = 0.865.
- **Adjudication:** 172 of the 173 kept labels were agreed; 1 was adjudicated.
- **Status: LLM-annotated/adjudicated, NOT human gold.**
  - No native speaker has reviewed any label.
  - For `new_40`, the same model family wrote, annotated and adjudicated the items.
  - These κ values are **LLM-vs-LLM** agreement. The research plan requires native-speaker κ > 0.7
    before labels count as reliable, and that hasn't been done (`tier1_annotation_protocol.md`).

> *Speaker note:* Don't present κ = 0.775 / 0.865 as label reliability. It's agreement between two
> LLM passes. Human annotation is pending (`annotator_A.jsonl` / `annotator_B.jsonl`).

---

## Slide 6: Experimental setup and Team A run protocol

- **Blinded input:** `data/tier1/eval_input/teamA_tier1_v2.jsonl`, 173 records, sha256
  `eab5dcb2…4cd07`.
  - random IDs; no relation, class or original `pair_id`;
  - Team A may not read the source, annotation or key files.
- **Episode:** each record is independent: reset memory, ingest `utterance_a`, then `utterance_b`,
  then consolidate as the strategy normally would.
- **Output per run** (one strategy × one seed): `run_manifest.json` plus `pairwise_eval.jsonl`.
  - one record per comparison actually made;
  - raw, pre-gating `similarity_score` on every record.
- **Strategies:** `mem0`, `a-mem`, `lightmem`, `flat-dense-rag`, `store-surface-only`, `trag`,
  `crossrag`, `dk-mem-lexicon`, `dk-mem-lexicon-llm`.
  - **actually run so far:** `dk-mem-lexicon` and `dk-mem-lexicon-llm`, seeds 0, 1, 2 each
    (6 runs);
  - the seven others, including every baseline: `[PENDING TEAM A RUNS]`.
- **Seeds and settings:**
  - at least 3 seeds per strategy;
  - the same backbone and model settings across compared strategies;
  - unavoidable differences are documented;
  - no-LLM strategies are exempt from the backbone rule only.
- **Backbone(s) used** (from the run manifests):
  - `dk-mem-lexicon`: `null` (no LLM stage);
  - `dk-mem-lexicon-llm`: `Qwen/Qwen2.5-3B-Instruct`.
  - Every record in all 6 runs carries `threshold = 0.85`.
- **Similarity score:** Team A reports that `similarity_score` in these runs comes from a
  deterministic string-similarity implementation, not an embedding model. This is Team A's
  statement; the run files don't record it.
- **Other model settings** (decoding parameters, quantization for the Qwen runs): not recorded
  anywhere in the repository. `[PENDING TEAM A]`
- **Intake:** Team B validates each delivery against the intake checklist (BLOCK / WARN) before
  scoring.
  - Scorer-checked items: all pass for all 6 runs, with 0 errors and 0 warnings.
  - Manual BLOCK items (input-hash confirmation, blinding attestation, memory-reset attestation,
    model settings): no record of them in the repository. `[PENDING TEAM A]`
  - Team B's copy of the blinded input still has the sha256 above.

> *Speaker note:* Emphasize blinding and completeness. Missing records are scored as "not
> compared", and fabricated records would be misleading.

---

## Slide 7: Metric definitions

**Pair outcome (contract §4):**
- Team B builds clusters by union-find over `entry_id` on `merge` / `supersede` records.
- It first drops same-utterance, cross-episode and unknown-utterance records.
- Each pair then counts as **merged**, **compared-not-merged**, **not compared** or **no entry**.
  Only **merged** counts as merged; `underdetermined_link` counts as not merged.

**The two rates:**

```
FCR = #{relation == "different" pairs that are merged} / #{relation == "different" pairs}   (n = 98)
MCR = #{relation == "same" pairs that are not merged}  / #{relation == "same" pairs}        (n = 75)
```

- **Denominators:** all gold pairs of that relation, including not-compared and no-entry pairs. For
  both rates, lower is better.
- **Excluded items:** the 53 ambiguous items appear in no numerator or denominator.

**Threshold frontier (output spec, contract §6):**
- Team B re-sweeps τ offline: merged(τ) ⇔ `similarity_score > τ` (strict).
- For gated runs, `compatibility == "compatible"` is also required.
- Not-compared and no-entry pairs are a constant MCR term at every τ.

**Seeds:** mean ± sample SD (n − 1) of the per-seed rates. Pair counts are never pooled across seeds.

> *Speaker note:* FCR and MCR must be reported together. Never merging gives FCR = 0 and MCR = 1.

---

## Slide 8: Results tables and figures

**Every number on this slide is "Tier 1 v2, LLM-annotated, provisional".** The labels are not human
gold, and this is not a validated benchmark result.

Read these three points before any table:

- **Only two strategies, both DK-Mem variants.** No baseline has been run:
  `[PENDING TEAM A RUNS]`.
- **SD = 0.000 for both strategies, in every cell.** Within each strategy the three seed files
  are identical in every field except `run_id`. The seeds add no information about run-to-run
  variance, and each mean equals the single-seed rate.
- **`dk-mem-lexicon-llm` is missing 35 of 173 episodes** (16 gold-`different`, 19 gold-`same`):
  neither utterance appears in any record. They are scored as no entry, so not merged, and stay
  in the denominators. Nothing is imputed. `dk-mem-lexicon` covers all 173.

**Backbone differs between the two rows of every table below:** `dk-mem-lexicon` has
`backbone: null` (no LLM stage, exempt from the backbone rule only); `dk-mem-lexicon-llm` uses
`Qwen/Qwen2.5-3B-Instruct`. Team A reports a deterministic string-similarity score, not an
embedding model. Other model settings are not recorded.

**Table A: overall, per strategy** (mean ± sample SD over 3 seeds; per-seed counts in brackets,
identical in all 3 seeds)

| strategy | backbone | FCR (n = 98) | MCR (n = 75) | episodes covered |
|---|---|---|---|---|
| `dk-mem-lexicon` | null | 0.133 ± 0.000 (13/98) | 0.813 ± 0.000 (61/75) | 173/173 |
| `dk-mem-lexicon-llm` | Qwen/Qwen2.5-3B-Instruct | 0.051 ± 0.000 (5/98) | 0.760 ± 0.000 (57/75) | 138/173 (35 missing) |
| baselines and other strategies | | `[PENDING TEAM A RUNS]` | `[PENDING TEAM A RUNS]` | |

Per-seed values (seeds 0 / 1 / 2):

| strategy | FCR | MCR |
|---|---|---|
| `dk-mem-lexicon` | 13/98, 13/98, 13/98 | 61/75, 61/75, 61/75 |
| `dk-mem-lexicon-llm` | 5/98, 5/98, 5/98 | 57/75, 57/75, 57/75 |

**Table B: by distinction_class** (SD = 0.000 in every cell)

| class | `dk-mem-lexicon` FCR | `dk-mem-lexicon` MCR | `dk-mem-lexicon-llm` FCR | `dk-mem-lexicon-llm` MCR | flag |
|---|---|---|---|---|---|
| evidentiality | n/a (n = 0) | 1.000 (34/34) | n/a (n = 0) | 1.000 (34/34) | |
| kinship | 0.000 (0/32) | n/a (n = 0) | 0.000 (0/32) | n/a (n = 0) | |
| name_variant | 0.000 (0/4) | 1.000 (20/20) | 0.250 (1/4) | 0.500 (10/20) | |
| classifier_measure | 0.000 (0/24) | n/a (n = 0) | 0.000 (0/24) | n/a (n = 0) | |
| politeness_relationship | 0.100 (1/10) | 0.143 (2/14) | 0.200 (2/10) | 0.500 (7/14) | |
| spatial_temporal_deixis | 0.273 (6/22) | n/a (n = 0) | 0.045 (1/22) | n/a (n = 0) | |
| honorific_register | 1.000 (6/6) | 0.714 (5/7) | 0.167 (1/6) | 0.857 (6/7) | indicative (13) |

**Table C: by language** (SD = 0.000 in every cell)

| language | `dk-mem-lexicon` FCR | `dk-mem-lexicon` MCR | `dk-mem-lexicon-llm` FCR | `dk-mem-lexicon-llm` MCR | flag |
|---|---|---|---|---|---|
| hi | 0.080 (7/88) | 0.860 (49/57) | 0.023 (2/88) | 0.754 (43/57) | |
| ko | 0.000 (0/4) | 0.250 (2/8) | 0.500 (2/4) | 0.500 (4/8) | indicative |
| tr | n/a (n = 0) | 1.000 (10/10) | n/a (n = 0) | 1.000 (10/10) | indicative |
| de | 1.000 (6/6) | n/a (n = 0) | 0.167 (1/6) | n/a (n = 0) | indicative |

**Table D: class × language** (all 10 populated cells; SD = 0.000 in every cell)

| class × language | n | `dk-mem-lexicon` FCR | `dk-mem-lexicon` MCR | `dk-mem-lexicon-llm` FCR | `dk-mem-lexicon-llm` MCR | flag |
|---|---|---|---|---|---|---|
| classifier_measure × hi | 24 | 0.000 (0/24) | n/a | 0.000 (0/24) | n/a | |
| evidentiality × hi | 24 | n/a | 1.000 (24/24) | n/a | 1.000 (24/24) | |
| evidentiality × tr | 10 | n/a | 1.000 (10/10) | n/a | 1.000 (10/10) | indicative |
| honorific_register × de | 6 | 1.000 (6/6) | n/a | 0.167 (1/6) | n/a | indicative |
| honorific_register × hi | 7 | n/a | 0.714 (5/7) | n/a | 0.857 (6/7) | indicative |
| kinship × hi | 32 | 0.000 (0/32) | n/a | 0.000 (0/32) | n/a | |
| name_variant × hi | 24 | 0.000 (0/4) | 1.000 (20/20) | 0.250 (1/4) | 0.500 (10/20) | |
| politeness_relationship × hi | 12 | 0.167 (1/6) | 0.000 (0/6) | 0.000 (0/6) | 0.500 (3/6) | indicative |
| politeness_relationship × ko | 12 | 0.000 (0/4) | 0.250 (2/8) | 0.500 (2/4) | 0.500 (4/8) | indicative |
| spatial_temporal_deixis × hi | 22 | 0.273 (6/22) | n/a | 0.045 (1/22) | n/a | |

**Table E: outcome breakdown** (per seed; identical in all 3 seeds)

| strategy | gold relation | merged | compared-not-merged | not compared | no entry |
|---|---|---|---|---|---|
| `dk-mem-lexicon` | different (n = 98) | 13 | 85 | 0 | 0 |
| `dk-mem-lexicon` | same (n = 75) | 14 | 61 | 0 | 0 |
| `dk-mem-lexicon-llm` | different (n = 98) | 5 | 77 | 0 | 16 |
| `dk-mem-lexicon-llm` | same (n = 75) | 18 | 38 | 0 | 19 |

**Table F: the 35 missing `dk-mem-lexicon-llm` episodes, by cell** (same 35 in every seed)

| class × language | gold `different` missing | gold `same` missing |
|---|---|---|
| evidentiality × hi | | 11 |
| politeness_relationship × hi | 4 | 2 |
| kinship × hi | 4 | |
| classifier_measure × hi | 4 | |
| honorific_register × hi | | 3 |
| honorific_register × de | 2 | |
| name_variant × hi | | 2 |
| spatial_temporal_deixis × hi | 2 | |
| politeness_relationship × ko | | 1 |
| **total** | **16** | **19** |

- The scorer treats each one as the contract defines "no entry": not merged, and still in the
  denominator. None of the 35 is a merge decision of either kind.
- A missing gold-`different` pair can't be a false merge, so it lowers FCR without any decision
  having been made. A missing gold-`same` pair is always a miss: 19 of the 57 MCR misses are
  missing episodes, not decisions.
- The scorer can't tell a skipped episode from one whose utterances produced no entries. Which it
  was: `[PENDING TEAM A]`.

**Figure 1: FCR–MCR frontier per strategy**
- x = MCR, y = FCR, swept over τ, one curve per strategy.
- Not drawn. Per-run breakpoint sweeps exist for the 6 runs, and the sweep rule reproduces the
  system's own decision on every scored record (173/173 and 138/138). The figure still needs the
  baseline curves `[PENDING TEAM A RUNS]`, and the seed aggregation is `[PENDING DECISION]` (see
  slide 11).

**Table G: the same runs on human-annotated labels** (reserved; no human annotation exists yet)

| strategy | human κ gate met? | FCR | MCR |
|---|---|---|---|
| `dk-mem-lexicon` | `[PENDING HUMAN ANNOTATION]` | `[PENDING HUMAN ANNOTATION]` | `[PENDING HUMAN ANNOTATION]` |
| `dk-mem-lexicon-llm` | `[PENDING HUMAN ANNOTATION]` | `[PENDING HUMAN ANNOTATION]` | `[PENDING HUMAN ANNOTATION]` |

- Tables A–F stay as the LLM-label record. Human-label results go here, from re-scoring the same
  six runs against a human-label key; the runs themselves don't need repeating.
- Denominators may differ from 98 / 75 if the kept set changes.

> *Speaker note:* Say the three caveats at the top of the slide out loud before showing Table A.
> Cells flagged indicative have fewer than 20 gold pairs. Some unflagged cells still have a small
> denominator for one relation: name_variant FCR is n = 4, politeness_relationship FCR is n = 10.

---

## Slide 9: How to interpret results without overstating them

- **Always report FCR with MCR,** and the frontier with both. Never headline overall FCR/MCR alone
  (contract §8).
- **Class and relation are confounded:** a per-class FCR is really a per-class merge rate on
  single-relation items. Don't compare classes as if they were balanced.
- **Language:** 84% of pairs are Hindi. Numbers for `de` (6), `ko` (12) and `tr` (10) are
  indicative only.
- **The frontier re-derives decisions** from `similarity_score` using the spec's rule. For
  LLM-judged strategies, the rule can disagree with the system's actual decisions; the scorer
  reports the agreement rate. It only covers compared pairs.
- **Effective sample size** is well below 173, because items come from a few templates or frames.
- **Wording:** every number is "Tier 1 v2, LLM-annotated, provisional", not a validated benchmark
  result.
- **SD = 0.000 is not evidence of stability.** The three seed files per strategy are identical
  apart from `run_id`, so the seed had no effect on the delivered output. Read each mean as one
  run.
- **Don't read the two rows of Table A as a clean comparison.** The backbone differs, the model
  settings aren't recorded, and `dk-mem-lexicon-llm` is missing 35 episodes, which lowers its FCR
  and raises its MCR independently of any merge decision.
- **No comparison against a baseline is possible yet,** so nothing here says whether gating helps.
- Significance / CIs: `[PENDING DECISION]` (see slide 11). Don't claim significance.

> *Speaker note:* If someone asks whether DK-Mem "works", the honest answer is:
> `[PENDING TEAM A RUNS]`. There is no baseline to compare against, and even then the answer
> would be provisional, on LLM labels.

---

## Slide 10: Limitations and threats to validity

- **Labels:**
  - LLM-annotated and LLM-adjudicated, with no native-speaker review;
  - for `new_40`, one model family authored, annotated and adjudicated the items;
  - three Hindi grammaticality rulings are flagged for native-speaker confirmation.
- **Construct:** class ↔ relation confound; honorific_register flips relation by language
  (hi all `same`, de all `different`).
- **Coverage:**
  - 145/173 pairs are Hindi;
  - German is 6 items (all honorific_register / `different`), Korean 12 (all
    politeness_relationship), Turkish 10 (all evidentiality / `same`).
- **Small cells:** honorific_register has 13 items, and 5 of the 10 populated class × language cells
  have n < 20.
- **Templated items:** few independent probes.
- **Exclusions:** 53 ambiguous items were removed from exactly the two register classes. That may
  bias what those classes measure.
- **Measurement:**
  - not-compared pairs are a retrieval gap, which a threshold sweep can't recover;
  - an utterance whose entries were never compared is counted as no entry, so the two can't be told
    apart (scorer);
  - the sweep is one run at a time.
- **Delivered runs:**
  - only `dk-mem-lexicon` and `dk-mem-lexicon-llm`; no baseline;
  - zero seed variance: the seed files are identical apart from `run_id`, so SD = 0.000
    everywhere and three seeds carry the information of one;
  - `dk-mem-lexicon-llm` has 35 of 173 episodes missing (16 gold-`different`, 19 gold-`same`),
    scored as no entry;
  - model settings and the Team A attestations are not recorded in the repository.
- **Scope:** Tier 1 is isolated pairs. Generalization to conversations (Tier 2) and other languages
  (Tier 3) isn't shown.

> *Speaker note:* These come straight from the dataset README, the contract and the scorer's
> documented limitations. State them before showing any number.

---

## Slide 11: Pending work and open decisions

**Team A:**
- delivered: `dk-mem-lexicon` and `dk-mem-lexicon-llm`, 3 seeds each;
- runs for the remaining strategies × ≥3 seeds, including every baseline `[PENDING TEAM A RUNS]`;
- the decoding and quantization settings for the Qwen runs (backbones are in the manifests, and
  Team A has reported the similarity-score method) `[PENDING TEAM A]`;
- the input-hash confirmation and the attestations (intake-checklist BLOCK items)
  `[PENDING TEAM A]`;
- why the three seeds of each strategy are identical, and whether the seed is actually used
  `[PENDING TEAM A]`;
- why 35 episodes are missing from `dk-mem-lexicon-llm`: skipped, or no entries extracted
  `[PENDING TEAM A]`.

**Team B:**
- done for the 6 delivered runs: scorer validation, single-run and multi-seed scoring, per-run
  sweeps;
- slides 6 and 8 are filled in for the two delivered strategies; slides 3 and 12 wait on
  baselines.

**Human annotation:**
- native-speaker annotation and the κ > 0.7 gate: not started, both annotator files are blank
  `[PENDING HUMAN ANNOTATION]`;
- once done, replace or supplement v2 labels and re-score the same six runs into slide 8,
  Table G (final report §15).

**Open decisions:**

| # | Decision | Owner |
|---|---|---|
| D1 | Does the C1 criterion (FCR < 10% for baselines) apply to Tier 1 v2? | PI |
| D2 | Statistics: the research plan asks for a paired bootstrap with 95% CIs, but the scorer only reports mean ± sd | PI + Team B |
| D3 | Frontier across seeds: per-seed curves, or an aggregate? The scorer sweeps one run at a time. | Team B |
| D4 | Whether sweep-only intake failures block ordinary scoring (the checklist is ambiguous) | Team B |
| D5 | Report the separate merge-rate diagnostic on the 53 ambiguous items? The contract allows it only as a separate descriptive number. | PI |
| D6 | Which strategies appear in the headline frontier figure | PI |

> *Speaker note:* None of these are decided. Owners are proposed roles for discussion, not
> assignments recorded in any source.

---

## Slide 12: Takeaways (provisional, not conclusions)

- **H1 (does the failure occur in baselines?):** `[PENDING TEAM A RUNS]`, no baseline delivered.
- **H2 (does DK-Mem's frontier dominate?):** `[PENDING TEAM A RUNS]`, no baseline delivered.
- **What was measured** (Tier 1 v2, LLM-annotated, provisional; mean ± SD over 3 identical seeds):
  - `dk-mem-lexicon`: FCR 0.133 ± 0.000 (13/98), MCR 0.813 ± 0.000 (61/75), 173/173 episodes;
  - `dk-mem-lexicon-llm`: FCR 0.051 ± 0.000 (5/98), MCR 0.760 ± 0.000 (57/75), 138/173 episodes,
    35 missing.
- **Most affected classes and languages vs. baselines:** `[PENDING TEAM A RUNS]`
- **Store-surface-only vs DK-Mem:** `[PENDING TEAM A RUNS]`
- **What this does *not* show:** results on human-validated labels; any comparison with a
  baseline; run-to-run variance; conversational settings (Tier 2); non-Indic generalization beyond
  28 items (Tier 3).
- Every takeaway is labeled "Tier 1 v2, LLM-annotated, provisional".

> *Speaker note:* The measured numbers describe two DK-Mem variants on LLM labels. Don't turn them
> into a claim about H1 or H2. Keep those as placeholders until baselines are scored and the
> slide 11 decisions are made.

---

## Fill-in checklist

Status as of the 2026-10-02 audit of the 6 delivered runs. `[x]` = done for the two delivered
strategies; the item reopens when more runs arrive.

- [ ] Every run passed intake: no BLOCK, and WARNs recorded (`teamB_tier1_run_intake_checklist.md`).
      *Scorer-checked items pass for all 6 runs (0 errors, 0 warnings). The manual BLOCK items
      (input-hash confirmation, attestations, model settings) have no record in the repository.*
- [ ] Slide 1: presenter and date.
- [ ] Slide 3: H1 and H2 outcomes; D1 decided. *Needs baseline runs.*
- [ ] Slide 6: strategies actually run, seeds per strategy, backbone(s) and settings, and any
      documented setting differences. *Strategies, seeds and backbones filled in; settings
      missing.*
- [x] Slide 8, Table A: mean ± sd per strategy (FCR n = 98, MCR n = 75).
- [x] Slide 8, Tables B–D: per class, per language, class × language, keeping `n/a` and the
      indicative flags exactly as pre-filled.
- [x] Slide 8, Table E: outcome breakdown per strategy.
- [x] Slide 8: SD = 0 stated for both strategies, and the 35 missing `dk-mem-lexicon-llm`
      episodes stated and broken down (Table F).
- [ ] Slide 8, Figure 1: frontier curves; D3 decided; sweep consistency (rule vs. system decision)
      noted per strategy. *Consistency noted; curves need baselines and D3.*
- [ ] Slide 9: CIs or significance only if D2 is decided and implemented.
- [ ] Slide 12: replace the placeholders with results-supported statements only. *Measured numbers
      added; H1 / H2 remain placeholders.*
- [x] Every number carries "Tier 1 v2, LLM-annotated, provisional".
- [ ] Search this file for `[PENDING`, `[PI DECISION]` and `[FILL IN]`: none should remain before
      presenting.
