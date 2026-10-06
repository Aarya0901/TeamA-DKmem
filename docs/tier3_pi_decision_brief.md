# Tier 3 PI decision brief

**For:** PI review. **Sources:** [`tier3_eval_design.md`](tier3_eval_design.md) (§8, and the §2 / §6
lines that refer to an item) and [`tier3_decision_log.md`](tier3_decision_log.md). Section (§) and
requirement (R) numbers refer to the design unless marked "research". This brief makes **no
decisions**; every item is `OPEN`.

> **Flag: no decider is named.** The sources name no owner or decider for any of T1–T10. The design
> only says Team B owns the dataset and evaluation. T10 asks who decides T1–T9. This brief doesn't
> assign anyone.

"None given" means the sources name no options. "Why it matters" is copied from design §8.
"Downstream work blocked" lists only what the sources state. Where they state nothing beyond "why
it matters", the brief says so.

## Open decisions

| ID | Question | Options stated in the sources | Why it matters | Downstream work blocked |
|---|---|---|---|---|
| T1 | Language set: all three of research §6, or "at least one" per research §3? Does Korean, already in Tier 1 and the taxonomy but not named for Tier 3, count? | All three (German, Japanese, Turkish), or "at least one". Korean: counts, or doesn't. | Scope, annotators, R2 | None stated beyond "why it matters". §2 notes the source tension is unresolved. |
| T2 | Relation to Tier 1's non-Indic items. The same items shouldn't be counted in both tiers' results. | Reuse them in Tier 3; move them from Tier 1 to Tier 3; or keep them separate. | Double counting, the Tier 1 contract's denominators | None stated beyond "why it matters" |
| T3 | Allocation of ~30 items across languages and classes, and the `same` / `different` balance per language | None given | Confound, n per cell | None stated beyond "why it matters" |
| T4 | Japanese honorifics: confirm they map to the existing `honorific_register` class, and define the taxonomy values and minimal pairs | Existing `honorific_register`, or a class outside the 7-class enum. Values and minimal pairs: none given. | Taxonomy, schema enum | Design §6: "A class outside the enum would need a schema change (T4)." |
| T5 | How are Tier 3 T-V `different` pairs built, and how is `ambiguous` handled? (A bare T-V switch can't pin down two distinct addressees.) | None given | Label validity for German, and possibly Japanese | None stated beyond "why it matters" |
| T6 | Is a per-language κ gate still required, and at what minimum n? (κ > 0.7 on roughly 10 items per language gives an unstable estimate.) | κ gate: required, or not. Minimum n: none given. | R8 | None stated beyond "why it matters" |
| T7 | Japanese script conventions and `language` tag | Script: kana/kanji, or romanized. Tag: none given. | Input format, lexicon matching | None stated beyond "why it matters" |
| T8 | Scoring approach, and where Tier 3 is reported | Parameterize `score_tier1_eval.js` by tier, or a separate Tier 3 scorer. Reporting: its own table, or next to Tier 1. | Tooling, paper tables | Design §6: `DATASET_TIER` is hard-coded to `tier1_minimal_pairs`, "so Tier 3 needs a parameter or a separate mode (T8)." |
| T9 | Item source. Tier 1 documents that templated items are "closely patterned". | Hand-authored, or template-generated. | Diversity, reviewer objections | None stated beyond "why it matters" |
| T10 | Who decides T1–T9 | None given | Sign-off | Per its question, the decisions on T1–T9 |

## Decision record (blank)

When filled in, also update `tier3_decision_log.md` (Status → `DECIDED`) and `tier3_eval_design.md`.

| ID | Decision | Choice | Decider | Date |
|---|---|---|---|---|
| T1 | Language set; Korean | | | |
| T2 | Relation to Tier 1's non-Indic items | | | |
| T3 | Allocation and relation balance | | | |
| T4 | Japanese class mapping, values, pairs | | | |
| T5 | T-V `different` pairs; `ambiguous` handling | | | |
| T6 | Per-language κ gate; minimum n | | | |
| T7 | Japanese script; `language` tag | | | |
| T8 | Scoring approach; table placement | | | |
| T9 | Item source | | | |
| T10 | Decider for T1–T9 | | | |
