# Tier 2 PI decision brief: blockers to data construction

**For:** short PI review. **Sources:** [`tier2_decision_log.md`](tier2_decision_log.md) (sections
A–C) and [`tier2_eval_design.md`](tier2_eval_design.md). Section numbers (§), requirements (R) and
dependency numbers refer to the design. This brief makes **no decisions** and adds no options.
Every item is `OPEN`. "None given" means the sources list no options.

**Needs the PI:**
- **As a named co-owner:** Q1, Q2, Q8, Q10 (each "Team B + PI").
- **PI alone:** Q15, flagged below.
- Every other item is owned by Team B, Team A, or nobody named.

## 1. Open questions that block data construction

| ID | Question | Options listed in the sources | Owner | Downstream dependency |
|---|---|---|---|---|
| **Q1** | Skeleton source and licence | LongMemEval-S, LoCoMo, or both. Splits: none given. Licence (modification and release): to be checked. | **Team B + PI** | "Everything": conversation structure (§5), input format (§7), Team A blinding from public skeletons (§8, dependency 7) |
| **Q2** | What each language condition means (Hindi / Hinglish / native-script / English control), their `language` tags, and the English control for a distinction English doesn't lexicalize | Schema tags `'hi'`, `'hi-Latn'`. None other given. | **Team B + PI** | Q3, `language` values in the input format (§7), per-condition breakdown (§6) |
| Q3 | Do derived script and code-mixing variants keep the source gold relation? | Keep, or re-annotate. Named resources: indic-transliteration, IndicTrans2 / NLLB. | Team B annotators | Gold relation in the answer key (§7), derived items (§5) |
| Q4 | Code-mixing ratio: metric and levels | None given | Team B | Key factor levels (§7), breakdown (§6), Q8 |
| Q5 | Injection form, and must the fact fit the skeleton's topic? | Standalone turn (the design's proposal) or embedded in a skeleton turn. Topic fit: yes or no. | Team B | The `source_utterance_id` join (§5), input format (§7) |
| Q6 | Session distance: unit and levels | Unit: sessions between the two injected turns. Levels: none given. | Team B | Placement (§5), key factor levels (§7), breakdown (§6), Q8 |
| **Q8** | Allocation of ~60 conversations over 4 language conditions × distance × code-mixing levels, and pairs per conversation | Pairs per conversation: "one or more". Allocation: none given; a full crossing won't fit in 60 at useful n. | **Team B + PI** | The conversation set, Q11. Needs Q2, Q4 and Q6 first. |
| **Q10** | Re-annotate labels in context? Require native-speaker κ > 0.7 before Tier 2 labels are used? | Re-annotate: yes or no. κ > 0.7 gate: yes or no. | **Team B + PI** | Gold relations in the key; whether results carry "LLM-annotated, provisional" (§4) |
| Q13 | Downstream QA: question source, answer format, scoring | Skeleton QA, or new questions about injected facts. Format and scoring: none given. | Team B + Team A | QA items, QA output schema or spec amendment (§7), Team A QA output (§8, dependency 5) |

## 2. Formats and proposals that also block construction

| ID | Item | Options listed in the sources | Owner | Downstream dependency |
|---|---|---|---|---|
| F1 | Tier 2 blinded input format | Content listed; format and field names open | Not specified | Running Tier 2; Team A harness (§8, dependency 1). Needs Q1, Q2 and Q5. |
| F2 | Tier 2 answer key format | Content listed; field names open | Team B | Scoring, breakdowns, bloat. Needs Q2, Q3, Q4, Q6 and Q10. |
| F3 | Tier 2 eval contract | None given beyond "new document" | Not specified | Team A and Team B sign-off |
| P1 | Unit of evaluation: one injected pair | Proposal as written only | Not specified | F2, FCR/MCR (§6), Q8 |
| P2 | Opaque per-turn token for `gold_entity_id` on every turn | Proposal as written only | Not specified | F1, Team A dependency 2 |
| P3 | Tier 1-style blinding | Proposal as written only | Not specified | F1, F2, Team A dependency 7 |
| P4 | Injected pairs from Tier 1 Hindi items and `data/distinction_taxonomy.json`; derived variants need validation | Proposal as written only | Not specified | Q3, Q10, Q8 |

## 3. Flagged: Q15 (contamination)

**Status unchanged.** The decision log files Q15 under "not needed before data construction" (log
section D). This brief doesn't move it or decide it.

- **Question (design §9):** "public skeletons may be in backbone training data. Is it acceptable,
  and does it need a disclosure?" Owner: **PI**. The design's "why it matters": validity claims.
- **Why it may affect source selection:**
  - Q1 chooses the skeleton source from LongMemEval-S and LoCoMo, which are public benchmarks.
    Design §8 (dependency 7) notes that "skeletons come from public benchmarks, and Team A's
    pipelines may have seen them before."
  - Q15 asks whether that exposure is acceptable. Its answer may bear on which skeleton source Q1
    selects, or on whether any is usable without a disclosure.
  - So the two may need to be considered together. Neither source doc states that they must be.

## 4. Decision record

Fill in as decisions are made, then update `tier2_decision_log.md` and `tier2_eval_design.md`.

| Decision | Choice | Decider | Date |
|---|---|---|---|
| Q1 Skeleton source and licence | | | |
| Q2 Language conditions and tags | | | |
| Q3 Derived variants: keep label or re-annotate | | | |
| Q4 Code-mixing metric and levels | | | |
| Q5 Injection form and topic fit | | | |
| Q6 Session-distance unit and levels | | | |
| Q8 Allocation and pairs per conversation | | | |
| Q10 Re-annotation in context and κ > 0.7 gate | | | |
| Q13 Downstream QA design | | | |
| F1 Input format | | | |
| F2 Answer key format | | | |
| F3 Eval contract | | | |
| P1 Unit of evaluation | | | |
| P2 Per-turn opaque tokens | | | |
| P3 Blinding | | | |
| P4 Source of injected pairs | | | |
| Q15 Contamination (flagged; status unchanged) | | | |
