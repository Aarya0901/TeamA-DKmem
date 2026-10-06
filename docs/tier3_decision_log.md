# Tier 3 decision log

Extracted from [`tier3_eval_design.md`](tier3_eval_design.md) §8, which remains the source of truth.
This log records **no decisions**; every item is `OPEN`.

- **Options** lists only what the design names. "None given" means the design names no options.
- **Owner:** the design names no decider for T1–T10 (see T10). It only states that Team B owns the
  dataset and evaluation.
- **Downstream work:** comes from the design's "Why it matters" column, plus places where the
  design points back to the item as "(Tn)".
- Section (§) and requirement (R) numbers refer to the design unless marked "research".

When a decision is made, fill in Choice, Decider and Date, set Status to `DECIDED`, and update the
design.

| ID | Question | Options named in the design | Owner / decider | Downstream work affected | Status | Choice | Decider | Date |
|---|---|---|---|---|---|---|---|---|
| T1 | Language set for Tier 3; and does Korean count? | All three of research §6 (German, Japanese, Turkish), or "at least one" per research §3. Korean: counts, or doesn't. | Not named | Scope, annotators, R2; the source tension noted in §2 | OPEN | | | |
| T2 | Relation to Tier 1's non-Indic items | Reuse them in Tier 3; move them from Tier 1 to Tier 3; or keep them separate. | Not named | Double counting; the Tier 1 contract's denominators | OPEN | | | |
| T3 | Allocation of ~30 items across languages and classes, and the `same` / `different` balance per language | None given | Not named | Confound; n per cell | OPEN | | | |
| T4 | Japanese honorifics: class mapping, taxonomy values and minimal pairs | Class: the existing `honorific_register` (the question asks to confirm this), or a class outside the 7-class enum, which would need a schema change (§6). Values and minimal pairs: none given. | Not named | Taxonomy; schema enum (§6, schema row) | OPEN | | | |
| T5 | How Tier 3 T-V `different` pairs are built, and how `ambiguous` is handled | None given | Not named | Label validity for German, and possibly Japanese | OPEN | | | |
| T6 | Annotators and κ: is a per-language κ gate still required, and at what minimum n? | κ gate: required, or not. Minimum n: none given. | Not named | R8 | OPEN | | | |
| T7 | Japanese script conventions and `language` tag | Script: kana/kanji, or romanized. Tag: none given. | Not named | Input format; lexicon matching | OPEN | | | |
| T8 | Scoring approach and table placement | Parameterize `score_tier1_eval.js` by tier, or write a separate Tier 3 scorer. Reporting: its own table, or next to Tier 1. | Not named | Tooling; paper tables (§6, scorer row) | OPEN | | | |
| T9 | Item source | Hand-authored, or template-generated. | Not named | Diversity; reviewer objections | OPEN | | | |
| T10 | Who decides T1–T9 | None given | Not named | Sign-off | OPEN | | | |
