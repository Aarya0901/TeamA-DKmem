# Tier 2 Evaluation Design: injected multi-session conversations (draft)

**Status:** design draft. No Tier 2 data, input files, answer key or scorer exist yet. Owner of the
dataset and the evaluation: Team B. Consumer: Team A.

This document turns the Tier 2 plan in [`research_idea_context.md`](../research_idea_context.md)
into a design. Each section below is labeled:

- **Confirmed**: stated in an existing doc or schema. The source is cited.
- **Proposed**: a design choice that follows existing Tier 1 practice, and so needs sign-off
  before it's built.
- **Open**: not decided anywhere. Listed in §9 with who needs to decide.

It doesn't define new field names, labels, conversations or results. Where a new field or file is
needed, §7 says so and leaves the name to whoever owns the schema.

## 1. Sources inspected

| Source | Tier 2 content |
|---|---|
| `research_idea_context.md` §6 | The Tier 2 definition (quoted in §2). |
| `research_idea_context.md` §8, §9 (C5), §10 | Metrics, statistics, why Tier 2 exists, and when it's built. |
| `docs/schemas/run_manifest.schema.json` | Reserved `dataset_tier` value `"tier2_injected_sessions"`. |
| `docs/schemas/pairwise_eval.schema.json` | Tier-neutral record format; `source_utterance_id` "as assigned by Team B's dataset (Tier 1/2/3)"; `language` examples include `'hi-Latn'` for romanized Hinglish; `distinction.script` examples `'deva'`, `'latn'`. |
| `docs/experiment_output_spec.md` | Tier-neutral output contract; memory bloat defined per conversation and grouped by `dataset_tier`. |
| `docs/tier1_eval_contract.md`, `docs/teamA_tier1_run_instructions.md`, `docs/tier1_annotation_protocol.md` | Tier 1 practice that Tier 2 can reuse (blinding, ID mapping, scoring join, κ gate). |
| `data/distinction_taxonomy.json`, `data/tier1/` | Distinction classes and the Tier 1 minimal pairs. |
| `data/` | **No Tier 2 folder, data or scripts.** |

## 2. Goal and scope (Confirmed)

> **Tier 2 — Injected multi-session conversations (~60 conversations).** Take LongMemEval-S / LoCoMo
> session skeletons, inject minimal-pair facts across distant sessions, and vary: language (Hindi /
> Hinglish / native-script / English control), session distance, and code-mixing ratio. This gives
> you a realistic setting and lets you measure false consolidation _in situ_ rather than in isolation.
> — `research_idea_context.md` §6

- **Why it exists:** it answers challenge C5, "Constructed data can be accused of being contrived",
  by "injection into real benchmark conversation structures" (§9).
- **Schedule:** "Tier 2 injection pipeline" in week 4. Main experiments (frontier, downstream QA,
  backbone sweep) in week 5, and bloat measurement in week 6 (§10).
- **Scale:** about 60 conversations. Tier 2 does not cover German, Japanese or Turkish; those are
  Tier 3 (§6).

## 3. Confirmed requirements

| # | Requirement | Source |
|---|---|---|
| R1 | About 60 conversations built on LongMemEval-S / LoCoMo session skeletons. | research §6 |
| R2 | Minimal-pair facts are injected **across distant sessions**. | research §6 |
| R3 | Three factors vary: **language** (Hindi / Hinglish / native-script / English control), **session distance**, **code-mixing ratio**. | research §6 |
| R4 | Runs are tagged `run_manifest.dataset_tier = "tier2_injected_sessions"`. | run manifest schema |
| R5 | Output is the standard pair of files, `run_manifest.json` and `pairwise_eval.jsonl`, under the same completeness contract: one record per comparison actually made, none for comparisons not made. | output spec |
| R6 | `similarity_score` is raw and pre-gating, so Team B can re-sweep τ offline. `compatibility` is `null` for strategies without gating. | output spec |
| R7 | `source_utterance_id` and `gold_entity_id` come from Team B's Tier 2 dataset and are passed through verbatim. Team A never computes them. | output spec, pairwise schema |
| R8 | Primary metrics are FCR and MCR, with the FCR–MCR frontier swept over τ. FCR counts pairs the system "merges or treats as a supersession", so `merge` and `supersede` both count as merged. Clusters are built by union-find over `entry_id`. | research §8, output spec |
| R9 | Secondary metrics are downstream QA accuracy "on questions whose answers were destroyed by false consolidation", memory bloat per conversation, and the ablations and backbone sweep. | research §8, output spec |
| R10 | Statistics: paired bootstrap over pairs, 95% CIs, at least 3 seeds. Report Cohen's κ on gold labels, and treat κ > 0.7 as the reliability gate. | research §8, annotation protocol |
| R11 | Baselines: Mem0, A-Mem, LightMem, flat dense RAG, store-surface-only, tRAG / CrossRAG, DK-Mem (lexicon-only), DK-Mem (lexicon + LLM). These map to the schema's `strategy` values. | research §7, pairwise schema |
| R12 | Gold relations are `same` / `different`. Items judged `ambiguous` are excluded, not forced into a label. | annotation protocol |

## 4. What carries over from Tier 1 (Proposed)

These follow the Tier 1 contract and need no schema change:

- **Blinding:** Team A gets a blinded input file with random IDs. A separate Team B answer key maps
  those IDs to the gold relation, the distinction class and the factor levels. Team A must not read
  the source or annotation files. This follows `tier1_eval_contract.md` §1–2.
- **ID mapping:** every stored entry carries its source turn's `source_utterance_id`, and a
  `gold_entity_id` copied from an opaque per-turn token Team B supplies. The schema **requires**
  `gold_entity_id` on every entry, so skeleton turns need a token too, not just injected ones.
- **`entry_id`:** globally unique within a run, and stable across records (contract §3).
- **Comparable runs:** the same backbone and model settings across compared strategies, with
  unavoidable differences documented (contract §8). At least 3 seeds per strategy.
- **Reporting labels:** if injected pairs come from Tier 1 v2, their labels are "LLM-annotated,
  provisional" (`data/tier1/README_eval_v2.md`), and Tier 2 results inherit that label until humans
  validate them.

## 5. Proposed conversation and item structure

This is described only in terms of existing concepts. The file format and field names are open
(§7, §9).

- **Unit of evaluation:** one **injected pair**, i.e. two injected turns that form a minimal pair
  with a gold `same` / `different` relation. FCR and MCR are computed over injected pairs, exactly
  as over Tier 1 pairs.
- **Conversation:** a LongMemEval-S or LoCoMo session skeleton: an ordered list of sessions, each
  an ordered list of turns. One or more injected pairs are added, with the two utterances of a pair
  placed in different sessions (R2).
- **Injected turn:** the minimal-pair utterance as its **own user turn with its own utterance ID**.
  That way the Tier 1 join (`source_utterance_id` → key) identifies exactly the entries extracted
  from injected text. Whether the utterance may be embedded in a longer turn is open (Q5).
- **Episode:** one conversation. Memory is reset before each conversation, not between its
  sessions, since persistence across sessions is the point of the setting. Turns are ingested in
  order as separate writes, and consolidation runs as the strategy normally would. When
  consolidation runs relative to session boundaries is open (Q7).
- **Factors per injected pair:** language condition, session distance and code-mixing level (R3).
  Distinction class and language come from the source minimal pair.
- **Where pairs come from:** Hindi items from the Tier 1 set and `data/distinction_taxonomy.json`.
  Tier 1 v2 has 145 Hindi items, 20 of which contain Devanagari. Variants in other scripts or
  code-mixing levels are **derived** items, and need their own validation (Q3).

## 6. Proposed scoring

- **Join:** same as Tier 1. Output `source_utterance_id` → key → injected pair → gold relation.
- **Union-find over all of a conversation's records.** This is a **deliberate change** from the
  Tier 1 scorer, which ignores records containing an utterance not in the key. In Tier 2, an injected
  entry can be merged with an injected entry of opposite gold relation *through* skeleton entries,
  e.g. injected A ↔ skeleton X ↔ injected B. That chain is exactly the "in situ" false consolidation
  Tier 2 exists to measure. So skeleton-turn records must count as edges. Only injected pairs are
  scored as outcomes.
- **Outcomes per injected pair:** the Tier 1 categories (merged / compared-not-merged /
  not-compared / no-entry). A merge path through skeleton entries counts as merged. How to report
  indirect merges separately from direct ones is open (Q9).
- **Breakdowns:**
  - overall;
  - by language condition;
  - by session-distance level;
  - by code-mixing level;
  - by distinction class;
  - class × condition where n allows.

  Cells with small n are flagged as indicative, as in Tier 1, but Tier 2's threshold isn't set (Q11).
- **Frontier:** the Tier 1 sweep rule applies unchanged (R6, R8).
- **Memory bloat:** the spec defines it as the count of `underdetermined_link` decisions per
  conversation, computable from `pairwise_eval.jsonl` once the key maps utterances to
  conversations. The research plan's wording, "entries retained per conversation", is a different
  quantity and can't be computed from the pairwise file (Q12).
- **Downstream QA:** no QA items, answer format or prediction output exist yet (§7, Q13).

## 7. Schema, artifact and scorer changes needed

| Change | Needed for | Existing schema affected? |
|---|---|---|
| **Tier 2 blinded input format** (conversation → sessions → turns, with turn text, utterance IDs, per-turn opaque entity tokens and language). No Team A input schema exists for any tier; Tier 1's is defined in prose in the contract. | Running Tier 2 at all | New document or schema; no existing file changes |
| **Tier 2 answer key format:** maps utterance IDs to conversation, session and turn position; marks injected turns and their pair; carries the gold relation, distinction class and the factor levels. | Scoring, breakdowns, bloat per conversation | New file; Team B only |
| **Tier 2 eval contract** (like `tier1_eval_contract.md`) | Sign-off between teams | New document |
| **Downstream QA:** question items per conversation, a Team A prediction output, and a scoring rule. `experiment_output_spec.md` says its outputs let Team B compute downstream QA accuracy, but neither schema has a QA field. | R9 (QA accuracy) | **Yes:** needs a new output schema, or a spec amendment explaining how QA is delivered |
| **Store snapshot per conversation** (entries retained), only if bloat uses the research plan's definition. | R9 (bloat), if Q12 goes that way | **Yes:** a new output artifact |
| **Scorer:** `dataset_tier` is hard-coded to Tier 1; records with unknown utterances are dropped; Tier 1 assumes one pair per episode. Tier 2 needs a new key loader, union-find over each conversation's records including skeleton edges (§6), per-factor breakdowns and bloat. | Scoring | No schema change; new code or a new scorer |
| **Statistics:** the paired bootstrap and 95% CIs (R10) aren't in the Tier 1 scorer either. | R10 | No schema change |

No change to `pairwise_eval.schema.json` or `run_manifest.schema.json` is needed for FCR, MCR, the
frontier or `underdetermined_link` bloat. Conversation and session membership are recovered through
`source_utterance_id` via the key, the same way `eval_pair_id` is recovered in Tier 1.

## 8. Team A dependencies

1. **A multi-session ingestion harness** for every strategy: sessions and turns fed in order, memory
   reset only between conversations, and consolidation per the strategy's normal behaviour (timing:
   Q7).
2. **IDs on every entry,** skeleton turns included: `source_utterance_id` and `gold_entity_id` copied
   verbatim. Without them, skeleton-mediated merges (§6) can't be traced.
3. **Completeness at scale:** records for every comparison made across the whole conversation, not
   just between injected entries. Raw `similarity_score` and the right `compatibility` on each.
4. **Backbone and settings parity** with Tier 1 runs of the same strategy, if results are compared
   across tiers (Q14).
5. **QA answering and output** once the QA format exists (§7).
6. **A store snapshot**, if bloat is defined as entries retained (Q12).
7. **Blinding:** no access to Tier 2 source skeletons, injection manifests, annotations or the key.
   Note that skeletons come from public benchmarks, and Team A's pipelines may have seen them before.

## 9. Open questions (unresolved decisions)

| # | Question | Why it matters | Decides |
|---|---|---|---|
| Q1 | **Skeleton source and licence:** LongMemEval-S, LoCoMo or both; which splits; whether their licences allow modification and release. Neither dataset is in the repo. | Everything | Team B + PI |
| Q2 | **What each language condition means.** Hindi / Hinglish / native-script / English control need exact definitions and `language` tags. The schema only shows `'hi'` and `'hi-Latn'`. In particular, what is the **English control** for a distinction English doesn't lexicalize? | R3, labels | Team B + PI |
| Q3 | **Deriving script and code-mixing variants:** the plan lists indic-transliteration and IndicTrans2 / NLLB as resources. Do derived variants keep the source item's gold relation, or need re-annotation? (For `name_variant`, script can itself be the distinction.) | Label validity | Team B annotators |
| Q4 | **Measuring code-mixing ratio:** no metric or levels are defined. | R3 | Team B |
| Q5 | **Injection form:** a standalone turn (proposed, §5), or embedded in a skeleton turn? Must the injected fact fit the skeleton's topic? | Join and realism | Team B |
| Q6 | **Session-distance levels:** the unit (sessions between the two injected turns) and the levels. | R3 | Team B |
| Q7 | **Consolidation timing:** after each write, at session end, or at conversation end? It must be fixed per strategy and stated. | Comparability | Team A + Team B |
| Q8 | **Allocation:** how ~60 conversations are spread over 4 language conditions × distance × code-mixing levels, and how many injected pairs each conversation holds. A full crossing won't fit in 60 at useful n. | Power, n < 20 cells | Team B + PI |
| Q9 | **Indirect merges:** count a merge via skeleton entries as merged (proposed), and report it separately? | Headline FCR | Team B |
| Q10 | **Labels in context:** Tier 1 marks some honorific/register pairs `ambiguous` "from the isolated pair alone". Surrounding context may resolve or change them, so re-annotate in context? And is a native-speaker κ > 0.7 required before Tier 2 labels are used, given Tier 1 v2 is LLM-annotated? | R10, R12 | Team B + PI |
| Q11 | **Indicative-cell threshold and minimum n per factor level.** | Reporting | Team B |
| Q12 | **Memory bloat definition:** `underdetermined_link` count per conversation (spec), or entries retained per conversation (research plan)? The second needs a new artifact. | R9, schema | PI + Team B |
| Q13 | **Downstream QA design:** question source (skeleton QA vs. new questions about injected facts), answer format and scoring. Nothing exists yet. | R9 | Team B + Team A |
| Q14 | **Cross-tier comparability:** must a strategy use the same backbone and settings in Tier 1 and Tier 2? | Tables across tiers | PI |
| Q15 | **Contamination:** public skeletons may be in backbone training data. Is it acceptable, and does it need a disclosure? | Validity claims | PI |

## 10. Known limitations to carry into the paper

- If injected pairs reuse Tier 1 v2 items, their labels are LLM-annotated and provisional until
  native-speaker validation (R10).
- As in Tier 1, the frontier re-derives decisions from scores and only reaches compared pairs.
  Pairs never compared form a constant MCR term.
- About 60 conversations spread over three factors will leave many cells indicative. Per-factor
  results need CIs (R10), not point estimates alone.
