# Team B: Tier 1 v2 run intake checklist

**Use when:** Team A delivers Tier 1 v2 runs for scoring. **Governing documents:**
[`tier1_eval_contract.md`](tier1_eval_contract.md), [`teamA_tier1_run_instructions.md`](teamA_tier1_run_instructions.md),
[`experiment_output_spec.md`](experiment_output_spec.md), [`schemas/run_manifest.schema.json`](schemas/run_manifest.schema.json),
[`schemas/pairwise_eval.schema.json`](schemas/pairwise_eval.schema.json). If this checklist and the contract disagree,
the contract wins. Scorer: [`data/tier1/scripts/score_tier1_eval.js`](../data/tier1/scripts/score_tier1_eval.js).

Each item is marked **[scorer]** if `score_tier1_eval.js` checks it, or **[manual]** if you must check it
yourself. **BLOCK** = do not score or report the run until it's fixed. **WARN** = score it, but
record the warning with the results.

> Every number is "Tier 1 v2, LLM-annotated, provisional". The labels are not human gold.

## 1. Delivery and manifest

- [ ] **[manual] BLOCK** One directory per run, where a run is one `strategy` × one seed over all
      173 episodes. The directory holds exactly two files, `run_manifest.json` and
      `pairwise_eval.jsonl`.
- [ ] **[scorer] BLOCK** `run_manifest.json` validates against `run_manifest.schema.json`, with
      required `run_id`, `strategy`, `dataset_tier` and `seed` (integer). `backbone` and
      `created_at` are optional; `created_at` must be an RFC 3339 date-time if present.
- [ ] **[scorer] BLOCK** `dataset_tier` is `"tier1_minimal_pairs"`.
- [ ] **[scorer] BLOCK** `strategy` is one of the `PairwiseEvalRecord.strategy` values: `mem0`,
      `a-mem`, `lightmem`, `flat-dense-rag`, `store-surface-only`, `trag`, `crossrag`,
      `dk-mem-lexicon`, `dk-mem-lexicon-llm`.
- [ ] **[manual] BLOCK** `run_id` is unique across all delivered runs.
- [ ] **[manual]** `backbone` names the model for the LLM-assisted stages. It is `null` only for
      strategies with no LLM stage.

## 2. Dataset version and blinded-input integrity

- [ ] **[manual] BLOCK** Team A confirms they used `data/tier1/eval_input/teamA_tier1_v2.jsonl` with
      sha256 `eab5dcb23375eb2e744c72a98cb31c25da0171b2ba3297a0843574ed9a34cd07`, 173 records, unmodified
      (no filtering, selection by order, edits or re-translation). The scorer can't see which input
      Team A used.
- [ ] **[manual] BLOCK** On Team B's side, `data/tier1/tier1_eval_v2.jsonl` still has sha256
      `3310956620bd4205e13fcb61fd622330a322dbad9c93a38c37de2309d5b604cb`, and the Team A input
      still has the hash above (e.g. `sha256sum <file>`). The answer key's hash isn't recorded in
      the docs, so only use the key produced by `data/tier1/scripts/build_tier1_eval_inputs.js`
      for that input.
- [ ] **[manual] BLOCK** The inputs have not been rebuilt with `--regenerate` since Team A received
      them. Doing that draws new IDs and makes existing outputs unscoreable.
- [ ] **[manual] BLOCK** Team A attests that no pipeline component, prompt or person running it
      accessed `data/tier1/candidates.jsonl` or any other `data/tier1/` file besides their input,
      `data/tier1/annotations/`, `tier1_eval.jsonl`, `tier1_eval_v2.jsonl` or
      `teamB_answer_key.jsonl`.
- [ ] **[manual] BLOCK** Team A attests that memory was reset before each of the 173 episodes, each
      episode ingested `utterance_a` then `utterance_b`, and no gold, relation, class or distinction
      hints were given to the system.

## 3. Pairwise records, completeness, IDs and pair matching

- [ ] **[scorer] BLOCK** Every line of `pairwise_eval.jsonl` is valid JSON and validates against
      `pairwise_eval.schema.json`. This includes:
  - `similarity_score` and `threshold` are numbers in [0, 1];
  - `decision` ∈ {`merge`, `no_merge`, `supersede`, `underdetermined_link`};
  - `predicted_entity_id` is non-null for `merge` / `supersede` and null otherwise;
  - each entry has `entry_id`, `language`, `gloss` and `gold_entity_id`.
- [ ] **[scorer] BLOCK** Every record's `run_id` and `strategy` equal the manifest's.
- [ ] **[scorer] BLOCK** `record_id` is unique within the run.
- [ ] **[scorer] BLOCK** One `entry_id` is never used for entries from different
      `source_utterance_id`s. `entry_id` must be globally unique within the run (contract §3).
- [ ] **[scorer] BLOCK** Each entry's `gold_entity_id` matches its `source_utterance_id` in the key.
- [ ] **[scorer] WARN** An entry's `language` differs from the input `language` for its utterance.
- [ ] **[scorer] WARN** A `supersede` record's `superseded_entry_id` is not `entry_a` or `entry_b`.
- [ ] **[scorer] ignored, not blocked** (contract §3), with counts shown in the report:
  - records with a `source_utterance_id` not in the key;
  - cross-episode records (two different `eval_pair_id`s);
  - same-utterance records.

  A high count suggests a mapping or ID bug, so ask Team A about it.
- [ ] **[manual]** Completeness: records exist only for comparisons actually made. Missing records
      are scored as not compared or no entry, both of which count as not merged. Check the outcome
      breakdown: a very large `no_entry` count can mean skipped episodes. The scorer can't tell
      those apart from utterances that produced no entries.
- [ ] **[manual]** `similarity_score` is raw and pre-gating on every record, including blocked and
      non-merged ones. The scorer can check the range but not whether the score is raw.

## 4. Multi-seed consistency

- [ ] **[scorer] BLOCK** At least 3 distinct seeds for the strategy, with no duplicate `seed` and no
      duplicate `run_id`.
- [ ] **[scorer] BLOCK** Every run has the same `strategy`, `dataset_tier` and `backbone` (a missing
      `backbone` counts as `null`), plus any other manifest key present in all runs. Only `run_id`,
      `seed` and `created_at` may differ.
- [ ] **[scorer] WARN** A manifest key that only some runs have is not compared.
- [ ] **[manual] BLOCK** Strategies compared in one table use the same backbone and model settings
      (contract §8). The manifest schema has no settings field, so get the settings from Team A,
      and write any unavoidable difference next to every table comparing those strategies.
- [ ] **[scorer]** Every run is validated on its own first. One invalid run blocks the whole
      summary. The mean ± sample SD is taken over per-seed rates, never pooled counts.

## 5. Threshold sweep (FCR–MCR frontier)

- [ ] **[scorer] BLOCK** Everything in §1 and §3 passes; the sweep runs the same checks first.
- [ ] **[scorer] BLOCK** Every scored (cross-utterance) record has a `compatibility` field, set to
      `null` or a value.
- [ ] **[scorer] BLOCK** A run doesn't mix `null` and non-null `compatibility` across scored records.
- [ ] **[scorer] BLOCK** A DK-Mem run (`dk-mem-lexicon`, `dk-mem-lexicon-llm`) doesn't have
      `compatibility: null` on every scored record.
- [ ] **[scorer] BLOCK** Thresholds are `breakpoints` or a comma-separated list of numbers in [0, 1].
- [ ] **[scorer] WARN** At each record's own `threshold`, the re-derived rule disagrees with the
      system's `decision`. The frontier then shows the spec's rule, not the system's own behavior.
      This is expected for LLM-judged strategies.
- [ ] **[manual]** Rule used, from `experiment_output_spec.md` and DK-Mem gating:
  - merged at τ ⇔ `similarity_score > τ` (strict);
  - for gated runs, `compatibility == "compatible"` is also required, so `incompatible` and
    `underdetermined` never merge.

  Not-compared and no-entry pairs are a constant MCR term at every τ.

## 6. Private answer key

- [ ] `data/tier1/eval_input/teamB_answer_key.jsonl` never goes to Team A, is never copied into a run
      directory, and is never referenced in anything shared with Team A. The same applies to
      `tier1_eval_v2.jsonl`, `candidates.jsonl` and `data/tier1/annotations/`.
- [ ] The scorer reads the key by default; pass `--key` only to point at a different key.
- [ ] Reports hold totals only (no `pair_id`, relation or per-pair rows), but they come from the
      key. Keep them on Team B's side. `--json` refuses to overwrite an input or to write into
      (or below) a run folder or the key's folder (`eval_input/`, which also holds the Team A input).
      Write reports to a separate folder.
- [ ] Share results only as the report tables, labeled "Tier 1 v2, LLM-annotated, provisional".

## 7. Commands

Run from the repo root. Replace `<...>` with real paths, and keep the report directory outside
every run folder and outside `data/tier1/eval_input/`. Exit codes: 0 = scored, 1 = rejected
(errors printed) or unreadable file, 2 = bad arguments or blocked `--json` path.

Single run:

```
node data/tier1/scripts/score_tier1_eval.js --pairwise <run_dir>/pairwise_eval.jsonl --manifest <run_dir>/run_manifest.json --json <report_dir>/<run_id>.json
```

Multi-seed summary (one `--run` per seed, at least 3; a path can't contain a comma):

```
node data/tier1/scripts/score_tier1_eval.js --run <seed1_dir>/pairwise_eval.jsonl,<seed1_dir>/run_manifest.json --run <seed2_dir>/pairwise_eval.jsonl,<seed2_dir>/run_manifest.json --run <seed3_dir>/pairwise_eval.jsonl,<seed3_dir>/run_manifest.json --json <report_dir>/<strategy>_seeds.json
```

Threshold sweep for one run, at every breakpoint or at an explicit grid (use the same grid for
every seed and strategy you plan to compare):

```
node data/tier1/scripts/score_tier1_eval.js --pairwise <run_dir>/pairwise_eval.jsonl --manifest <run_dir>/run_manifest.json --sweep breakpoints --json <report_dir>/<run_id>_sweep.json
node data/tier1/scripts/score_tier1_eval.js --pairwise <run_dir>/pairwise_eval.jsonl --manifest <run_dir>/run_manifest.json --sweep <t1,t2,...> --json <report_dir>/<run_id>_sweep.json
```

Scorer self-test (synthetic data only; doesn't read the real key):

```
node --test data/tier1/scripts/test_score_tier1_eval.js
```

## 8. Known scorer limitations to note with results

- Not-compared and no-entry pairs can't be fully told apart, because entries are only visible
  through records.
- `language` mismatches and manifest keys that only some runs have only produce warnings.
- The sweep covers one run at a time; there's no mean ± sd across seeds at each τ. It only moves
  pairs that were compared, and ignores merge-order effects.
- Whether `trag` / `crossrag` gate isn't documented; the sweep rule follows `compatibility`
  (`null` vs. a value).
- Breakpoint sweeps can repeat a row for scores that never merge.
- The sweep's text output shows overall figures only; per-class and per-language frontiers are
  in `--json`.
- Report per class, per language and class × language, and flag cells with n < 20 as indicative.
  Never headline overall FCR/MCR alone (contract §8).
