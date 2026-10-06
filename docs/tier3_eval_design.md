# Tier 3 Evaluation Design: cross-lingual generalization probe (draft)

**Status:** design draft. No Tier 3 data, answer key, contract or scorer mode exists. Owner:
Team B (dataset and evaluation). Consumer: Team A.

Labels used in this document:
- **Confirmed**: stated in an existing doc, schema or data file. The source is cited.
- **Proposed**: follows existing Tier 1 practice, and needs sign-off before it's built.
- **Open**: not decided anywhere. Listed in §8.

No items, labels, results, or counts beyond the plan's "~30 items" are defined here.

## 1. Sources inspected

| Source | Tier 3 content |
|---|---|
| `research_idea_context.md` §6 | The Tier 3 definition (quoted in §2). |
| `research_idea_context.md` §3 | "Include at least one non-Indic language"; the class table with the Japanese, Turkish and Korean examples. |
| `research_idea_context.md` §9 (C3, C4), §10 | Why Tier 3 exists, lexicon coverage reporting, and schedule (week 6). |
| `docs/schemas/run_manifest.schema.json` | Reserved `dataset_tier` value `"tier3_crosslingual_probe"`. |
| `docs/schemas/pairwise_eval.schema.json` | Tier-neutral records. `language` examples include `'de'`, `'ja'`, `'tr'`; `distinction.value` examples include `'-san'`, `'-mis_evidential'`; the `distinction.class` enum has 7 classes. |
| `data/distinction_taxonomy.json` (v0.1) | Non-Indic entries: `de` `honorific_register` (T-V, `du`/`Sie`), `tr` `evidentiality`, `ko` `politeness_relationship`. **No Japanese entry.** |
| `data/tier1/` (v2 set, READMEs) and `docs/tier1_*.md` | Existing non-Indic Tier 1 items, the annotation protocol, tooling, and the known limitations. |
| `docs/tier2_eval_design.md` | "Tier 2 does not cover German, Japanese or Turkish; those are Tier 3" |

## 2. Goal and scope (Confirmed)

> **Tier 3 — Cross-lingual generalization probe (~30 items).** German T-V, Japanese honorifics,
> Turkish evidentiality. Small, but it converts "a Hindi finding" into "a normalization finding."
> — `research_idea_context.md` §6

> **Include at least one non-Indic language** (German T-V, Japanese honorifics, or Turkish
> evidentiality). This costs you ~30 probe items and buys you the claim that the phenomenon is not
> an Indic quirk. — `research_idea_context.md` §3

- **Why it exists:** it answers C4, "Two languages is thin. Mitigated by Tier 3. Be explicit in
  limitations about what you have and haven't shown."
- **Schedule:** "Tier 3 cross-lingual probe" in week 6, alongside the ablations and bloat
  measurement (research §10).
- **Tension in the source:** research §6 lists all three languages, while research §3 asks for "at least one"
  (German, Japanese *or* Turkish). Which applies is open (T1).

## 3. Confirmed requirements

| # | Requirement | Source |
|---|---|---|
| R1 | About 30 items. | research §3, §6 |
| R2 | Named phenomena: German T-V, Japanese honorifics, Turkish evidentiality. | research §3, §6 |
| R3 | Purpose: show the phenomenon is "not an Indic quirk", i.e. a normalization finding. | research §3, §6 |
| R4 | English collapse per the class table: Japanese `-san/-sama` under Honorific / register (collapse: all → "you"); Turkish `-mış` under Evidentiality / hearsay (collapse: "dropped entirely"). The taxonomy records German T-V as `honorific_register` ("second-person pronoun register (T-V distinction)"). | research §3, taxonomy |
| R5 | Runs are tagged `run_manifest.dataset_tier = "tier3_crosslingual_probe"`. | run manifest schema |
| R6 | Output is the standard `run_manifest.json` + `pairwise_eval.jsonl`, with raw pre-gating `similarity_score` and passthrough `source_utterance_id` / `gold_entity_id` ("Tier 1/2/3"). | output spec, pairwise schema |
| R7 | Metrics: FCR and MCR with the FCR–MCR frontier. Statistics: paired bootstrap, 95% CIs, at least 3 seeds, Cohen's κ on gold labels. | research §8 |
| R8 | Gold relations are `same` / `different`; `ambiguous` items are excluded. κ > 0.7 gates label reliability, and κ is reported per language at minimum. | annotation protocol |
| R9 | Report DK-Mem lexicon coverage honestly: "what fraction of real distinctions it catches, and performance on the uncovered remainder". | research §9, C3 |

## 4. Existing non-Indic material (Confirmed facts, not a design decision)

- **Tier 1 v2** already has 28 non-Indic items, all LLM-annotated, not human gold
  (`README_eval_v2.md`):
  - `de`: 6 items, all `honorific_register` / `different`;
  - `tr`: 10 items, all `evidentiality` / `same`;
  - `ko`: 12 items, all `politeness_relationship` (8 `same`, 4 `different`).
- **Candidates:** `candidates.jsonl` has 49 non-Indic candidates (15 German, 10 Turkish, 24 Korean;
  `data/tier1/README.md`). **No Japanese** candidate, taxonomy entry or annotation exists.
- **Known limitations** already documented for these languages:
  - Class and relation are confounded within a language: German `honorific_register` is all
    `different` and Turkish `evidentiality` all `same` (`README_eval_v2.md`).
  - "A minimal T-V pair can't pin down two *distinct* addressees", so `honorific_register`
    coverage is "one-sided by construction" (`data/tier1/README.md`).
  - Some German and Korean register combinations are regional or style-dependent
    (`data/tier1/README.md`).
- The annotation protocol covers "four candidate languages (Hindi/Hinglish, German, Turkish,
  Korean)". Japanese isn't among them.

## 5. Proposed item format and pipeline

- **Item:** the Tier 1 minimal-pair format. The research notes describe each Tier 1 item as "two
  utterances, a gold label (same entity / different entity), and the distinction feature
  responsible". Tier 3 items reuse that, with the Tier 1 candidate fields and the taxonomy's class
  IDs. Each item is **one independent episode**, as in Tier 1.
- **Pipeline:** the same stages as Tier 1, in the same order:
  1. candidates;
  2. two native-speaker annotators per language under the Tier 1 protocol;
  3. adjudication and the κ gate;
  4. the promoted eval set;
  5. blinded Team A input plus a Team B answer key, with random IDs;
  6. scoring.
- **Separate reporting:** Tier 3 is scored and reported under its own `dataset_tier`, never pooled
  into Tier 1 numbers.
- **Reporting:** results per language and per class × language. With about 30 items, every cell
  is under the ~20-item level the protocol and contract treat as meaningful, so all cells are
  flagged indicative and shown with CIs (R7).

## 6. What can reuse Tier 1 tooling, and what needs something new

| Component | Reuse as is? | What's needed for Tier 3 |
|---|---|---|
| `pairwise_eval.schema.json`, `run_manifest.schema.json` | **Yes** | Nothing, if the Tier 3 classes stay within the 7-class enum. The tier value already exists. A class outside the enum would need a schema change (T4). |
| Output spec, completeness contract, sweep rule | **Yes** | Nothing. |
| Candidate record fields (`data/tier1/README.md`) | **Yes** | Nothing new. |
| `data/distinction_taxonomy.json` | Partly | A **Japanese entry** if Japanese is included (it's a data file, not a schema). German and Turkish entries exist. |
| `validate_candidates.js` | **No** | It fails unless all 7 classes and some `hi` records are present. A Tier 3-only set needs a parameterized or separate validator. |
| Annotation protocol (`tier1_annotation_protocol.md`) | Mostly | The procedure and κ gate apply. It needs extending to Japanese, and native annotators for each Tier 3 language. |
| `annotate.html` / `annotate_server.js`, `generate_annotations_template.js`, `validate_annotations.js` | Logic only | They're tied to `data/tier1/` paths and `candidates.jsonl`. They need path parameters or copies. |
| `build_tier1_eval_v2.js` | Logic only | Hard-coded source files and Tier 1 batch IDs. |
| `build_tier1_eval_inputs.js` (blinding, random IDs, key) | Logic only | Hard-coded paths and `EXPECTED_N = 173`. |
| `score_tier1_eval.js` | Logic only | The one-pair-per-episode scoring, breakdowns, multi-seed mode and sweep all apply, and `--key` accepts another key. But `DATASET_TIER` is hard-coded to `tier1_minimal_pairs`, so Tier 3 needs a parameter or a separate mode (T8). |
| `tier1_eval_contract.md`, `teamA_tier1_run_instructions.md`, `teamB_tier1_run_intake_checklist.md` | Template only | Tier 3 versions with Tier 3 file names, hashes and counts. |

## 7. Team A dependencies

1. The Tier 1 episode harness runs unchanged if the item format stays the same (§5).
2. Extraction and consolidation must handle the chosen languages. `language` tags are passed
   through as given in the input.
3. **DK-Mem lexicon coverage** for the chosen languages and classes. Per C3, coverage and
   performance on uncovered distinctions must be reported, so Team A needs to state which Tier 3
   distinctions its lexicon covers.
4. The same backbone and settings across compared strategies, and at least 3 seeds (contract §8).

## 8. Open questions

| # | Question | Why it matters |
|---|---|---|
| T1 | **Language set:** all three of research §6 (German, Japanese, Turkish), or "at least one" per research §3? Does Korean, already in Tier 1 and the taxonomy but not named for Tier 3, count? | Scope, annotators, R2 |
| T2 | **Relation to Tier 1's non-Indic items:** reuse them in Tier 3, move them from Tier 1 to Tier 3, or keep them separate? The same items shouldn't be counted in both tiers' results. | Double counting, the Tier 1 contract's denominators |
| T3 | **Allocation of ~30 items** across languages and classes, and the `same` / `different` balance per language. Existing items are single-relation per language (§4). | Confound, n per cell |
| T4 | **Japanese honorifics:** the research table places `-san/-sama` under Honorific / register. Confirm it maps to the existing `honorific_register` class, and define the taxonomy values and minimal pairs. | Taxonomy, schema enum |
| T5 | **T-V `different` pairs:** Tier 1 documents that a bare T-V switch can't pin down two distinct addressees. How are Tier 3 T-V pairs built, and how is `ambiguous` handled? | Label validity for German, and possibly Japanese |
| T6 | **Annotators and κ:** native speakers for each language, including Japanese. κ > 0.7 on roughly 10 items per language gives an unstable estimate. Is a per-language κ gate still required, and at what minimum n? | R8 |
| T7 | **Script conventions:** Japanese script (kana/kanji or romanized) and its `language` tag. The schema's `distinction.script` examples are only `'deva'` and `'latn'`. | Input format, lexicon matching |
| T8 | **Scoring:** parameterize `score_tier1_eval.js` by tier, or write a separate Tier 3 scorer? Report Tier 3 in its own table or next to Tier 1? | Tooling, paper tables |
| T9 | **Item source:** hand-authored or template-generated? Tier 1 documents that templated items are "closely patterned". | Diversity, reviewer objections |
| T10 | **Who decides T1–T9:** no owner is named in the sources beyond Team B owning the dataset. | Sign-off |

## 9. Known limitations to carry into the paper

- About 30 items spread over up to three languages: every per-language and per-class estimate is
  indicative; the source itself calls Tier 3 "Small". State this explicitly, per C4.
- If Tier 1's LLM-annotated non-Indic items are reused, their labels stay provisional until
  native-speaker validation.
- Within-language class/relation confounds (§4) mean per-language FCR and MCR can't be compared
  across languages unless T3 balances relations.
