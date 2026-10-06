# Tier 1 Human Annotation Protocol

**Purpose:** turn the unvalidated machine-generated candidates in `data/tier1/candidates.jsonl`
into the hand-validated Tier 1 probe set the research plan requires (κ pilot, second-speaker
sign-off, §6/§9 of the research plan). This document is language-agnostic; the decision rules
apply the same way regardless of which of the four candidate languages (Hindi/Hinglish, German,
Turkish, Korean) an item is in. It does not modify `candidates.jsonl` -- annotations are recorded
in separate per-annotator files (see "Recording judgments" below) and merged only at promotion
time.

## Materials

- `data/tier1/candidates.jsonl` -- the items to annotate.
- `data/distinction_taxonomy.json` -- the class definitions, feature glosses, and rationale each
  item was generated from. Read the relevant class entry before annotating items from it.
- Two annotators per language, each a native or near-native speaker of that language.

## Annotator instructions

For each record, in this order:

1. Read `utterance_a` and `utterance_b` in the source language. **Do not read `english_gloss`
   first** -- form your grammaticality and gold-relation judgment from the source-language text
   alone, then check `english_gloss` only to confirm it plausibly collapses both utterances (a
   sanity check, not evidence for your judgment). Reading the gloss first anchors you toward the
   answer the record was generated to demonstrate.
2. Judge **grammaticality** (see below).
3. Judge **minimality** (see below).
4. Judge **gold_relation**: `same` or `different` (see below), or `ambiguous` for the honorific
   register/politeness classes only (see below).
5. Record your judgment and a one-line rationale, even when the answer feels obvious -- the
   rationale is what an adjudicator reads on disagreement, and what later research-team review
   uses to catch systematic annotator bias.

## Same vs. different: the gold decision

**Same**: `utterance_a` and `utterance_b` could both truthfully describe the identical
real-world entity/event at the same time, with no contradiction.

**Different**: the two utterances make claims that cannot both be true of a single entity/event
at once -- they necessarily or overwhelmingly likely refer to two distinct referents.

Decision procedure: *could one speaker truthfully say both sentences about the same referent,
right now, without contradicting themselves?* If yes → `same`. If the two `distinction_value`s are
mutually exclusive category memberships (a person cannot simultaneously be your `chachi` and your
`mausi` -- they name different, non-overlapping kin relations) → `different`.

| Class | Example (a / b) | Gold | Why |
|---|---|---|---|
| kinship | `meri chachi ... rehti hai` / `meri mausi ...` | different | chachi and mausi name mutually exclusive kin categories; one person can't be both. |
| evidentiality | `Ali geldi` / `Ali gelmiş` | same | same person, same arrival event -- only the speaker's evidence for it differs, not the event itself. |
| name_variant (script) | `Priya aa rahi hai` / `प्रिया आ रही है` | same | same name, same script-independent referent. |
| name_variant (collision) | `Priya office se aa rahi hai` / `Priya college se aa rahi hai` | different | same surface name, but the context marks two distinct people. |
| classifier/measure | `ek botal doodh laaya` / `ek gilaas doodh laaya` | different | different quantity/container of milk -- two distinct occasions, not one restated. |
| spatial/temporal deixis | `kal ... gaya tha` / `kal ... jayega` | different | one is past (yesterday), one is future (tomorrow) -- never the same date. |

## Flagging ungrammatical or unnatural pairs

Mark each item `grammatical`, `ungrammatical`, or `unnatural-but-grammatical`, with a one-line
note on what's wrong (missing case/agreement marker, wrong word order, a word no native speaker
would use here). `unnatural-but-grammatical` is for phrasing a speaker would avoid but wouldn't
call wrong (e.g. an odd but valid combination of verb and time adverb) -- it doesn't disqualify an
item by itself, but flag it so the research team can decide whether to keep or reword it.
`ungrammatical` items are excluded by default. If the fix is a single obvious correction (e.g. an
omitted case marker), you may propose it in a `suggested_fix` field instead of only excluding --
the second annotator or adjudicator must independently confirm the fix before the corrected item
can be promoted.

## Flagging non-minimal pairs

A **minimal pair** differs *only* in the target distinguishing feature (the two
`distinction_value`s) and whatever agreement changes that feature grammatically forces (e.g. a
pronoun-register change forcing a verb-ending change is fine; it's a consequence of the one
change, not a second independent one). If `utterance_a` and `utterance_b` differ in any other
lexical content -- a different object, a different time, a different location that isn't shared
between the two sides -- flag it `non_minimal` and name the extra difference.

**Exception:** the `name_variant` "same name, different people" items (e.g. `Priya office se aa
rahi hai` / `Priya college se aa rahi hai`) are *designed* to differ in a second piece of content
(the disambiguating context) -- that's the phenomenon under test, not a flaw. Do not flag these
`non_minimal` solely for the context difference; only flag them if there's a *third*, unrelated
difference beyond the name and its context.

## Honorific/register and politeness_relationship: special handling

For these two classes only, whether a register or relationship-marker shift implies a different
real-world addressee/referent is a **plausible, not certain**, signal -- the same speaker can
switch `tu`/`aap`, `bhaiya`/`yaar`, or Korean speech level for the same addressee depending on
mood, sarcasm, or code-switching. `candidates.jsonl` labels all of these `different` by design
(see `data/tier1/README.md`, Audit notes), but that is a generation-time default, not a claim the
annotator must defer to.

For every honorific_register / politeness_relationship item, choose one of three labels:
- `different` -- you judge the register/relationship shift as a real signal of a different
  addressee/referent, with no strong reason to doubt it in isolation.
- `same` -- you can construct a natural scenario where one person plausibly switches register
  for the same addressee (state it in your rationale).
- `ambiguous` -- you genuinely cannot decide either way from the isolated pair alone, with no
  surrounding conversation.

`ambiguous` is a valid, expected outcome for this class, not a failure to decide. Items where both
annotators (or the adjudicator) land on `ambiguous` are excluded from the promoted set and logged
separately as "context-dependent, excluded" -- they are not forced into `same` or `different`.

## Recording judgments

Each annotator writes one JSON line per item to their own file (`data/tier1/annotator_A.jsonl` /
`data/tier1/annotator_B.jsonl`, copies of `annotations_template.jsonl`), keyed by the source
`pair_id`. The record schema is defined in `data/tier1/README_annotations.md` and enforced by
`data/tier1/validate_annotations.js`:

```json
{"pair_id": "t1_0001", "annotator_id": "A", "grammaticality": "grammatical", "minimal_pair": "yes", "relation": "different", "ambiguity_reason": null, "suggested_fix": null, "notes": "chachi and mausi are mutually exclusive kin categories"}
```

Field names and values in the files differ from the wording used elsewhere in this protocol:

| This protocol says | In the annotation file |
|---|---|
| gold_relation (the annotator's judgment) | `relation` |
| minimality: minimal / `non_minimal` | `minimal_pair`: `yes` / `no` |
| `unnatural-but-grammatical` | `unnatural_but_grammatical` |
| rationale | `notes` (and `ambiguity_reason` when `relation` is `ambiguous`) |

**Status:** both annotator files are blank (226 records each, every judgment `null`), so no human
κ exists yet. The only agreement figures so far are LLM-vs-LLM (`data/tier1/README_eval_v2.md`).

## How disagreements are resolved

Two independent annotators (native speakers of the item's language) annotate every item without
seeing each other's judgments. For each item:

- **Full agreement** (same grammaticality, minimality, and gold_relation) → auto-accept that
  judgment, no further review.
- **Any disagreement** → sent to a third, senior annotator (or the research team) for
  **adjudication**, not majority vote. The adjudicator reads both annotators' rationale notes,
  may consult the taxonomy entry, and makes a final binding call with their own rationale on
  record. Disagreements on honorific/register and politeness_relationship items are expected and
  are exactly where adjudication should engage most carefully, not rubber-stamp one annotator.

Adjudicated decisions are recorded the same way as annotator judgments, with `annotator_id` set to
the adjudicator's ID and a note referencing which two judgments were reconciled.

## Cohen's kappa

Computed **before adjudication**, per language, over the two annotators' raw `gold_relation`
judgments (`same`/`different`; treat `ambiguous` as its own third category for this class rather
than dropping it):

```
κ = (p_o − p_e) / (1 − p_e)
p_o = observed proportion of items where both annotators agree
p_e = expected proportion of chance agreement = Σ_c (P(annotator 1 → c) × P(annotator 2 → c))
```

Worked example (10 items, binary same/different; D = `different`, S = `same`):

```
item         1  2  3  4  5  6  7  8  9  10
annotator 1  D  D  D  D  D  D  D  S  S  S
annotator 2  D  D  D  D  D  D  S  S  S  S
```

Annotator 1 says `different` on 7, `same` on 3; annotator 2 says `different` on 6, `same` on 4;
they agree on 9 of 10 (all but item 7).
`p_o = 0.9`. `p_e = (0.7×0.6) + (0.3×0.4) = 0.42 + 0.12 = 0.54`.
`κ = (0.9 − 0.54) / (1 − 0.54) ≈ 0.783`.

**Gate:** per the research plan, `κ > 0.7` is required before an annotated batch's gold labels are
treated as reliable. If a language's κ ≤ 0.7: stop, hold a calibration meeting between the two
annotators (and the adjudicator) to walk through disagreements, revise this protocol's examples if
the disagreement reveals an ambiguous instruction, and re-annotate a fresh sample for that
language -- do not simply recompute κ on the same annotated batch after the fact.

Report κ per language at minimum; report per class × language if the per-cell sample size is large
enough to be meaningful (roughly ≥20 items per cell).

### Using the Cohen's kappa script

**Script:** `data/tier1/scripts/cohens_kappa.js`

**Inputs**

| Flag | Description |
|---|---|
| `--a <file>` | First annotator's raw (pre-adjudication) JSONL file |
| `--b <file>` | Second annotator's raw (pre-adjudication) JSONL file |
| `--candidates <file>` | `data/tier1/candidates.jsonl` (supplies the `language` for each `pair_id`) |
| `--json <file>` | *(optional)* write the full report as JSON to this path |

**Run the script**

```
node data/tier1/scripts/cohens_kappa.js \
  --a data/tier1/annotator_A.jsonl \
  --b data/tier1/annotator_B.jsonl \
  --candidates data/tier1/candidates.jsonl
```

**Run its tests**

```
node --test data/tier1/scripts/test_cohens_kappa.js
```

**Output**

The script prints a table with one row per language and a `pooled` row. Each row shows n, observed agreement (p_o), expected agreement (p_e), κ, and n_unlabeled.

**No gate or minimum sample size is applied.** The script reports κ and n only. It does not check whether κ > 0.7 or whether n meets any threshold — those checks are the research team's responsibility.

**Null-label behavior (current implementation — not an approved policy)**

- A pair whose `relation` is `null` in *either* annotator file is excluded from κ and n, and counted as `n_unlabeled` in its language row and the pooled row.
- If every pair in a batch is unlabeled (e.g. a blank template), the script exits successfully (exit 0) with n = 0 and κ = null (reported as `n/a`).
- A record with no `relation` field at all is rejected (exit 1); that is a separate validation rule.

> [!IMPORTANT]
> The treatment of null labels is a PI-level decision that has not yet been made. See
> `docs/tier1_null_label_decision.md` for the open options and decision record. Do not treat
> the current script behavior as an approved policy.

## Final inclusion rule

A candidate is **promoted** into the validated Tier 1 set only if, after adjudication where
needed:

1. Final grammaticality judgment is `grammatical` (an `ungrammatical` item with a confirmed
   `suggested_fix` may be promoted **with the corrected utterance**, not the original).
2. Final minimality judgment is `minimal` (or the documented `name_variant` context exception
   applies).
3. Final `gold_relation` is `same` or `different` -- **not** `ambiguous`.

Any item failing 1-3 is excluded from the promoted Tier 1 set but kept in an audit log with its
final judgments and exclusion reason (`ungrammatical`, `non_minimal`, or `ambiguous`) -- excluded
items are dropped from the benchmark, not deleted from the record, so the exclusion rate itself
(especially for honorific_register / politeness_relationship) is reportable in the paper's
limitations section.
