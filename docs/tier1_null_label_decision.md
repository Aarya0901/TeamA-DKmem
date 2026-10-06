# Decision note: null `relation` labels in Cohen's κ

**Status:** `OPEN`. This note presents options only; it doesn't recommend or select one.
**For:** PI decision.

## Question

When one or both annotators leave a pair's `relation` as `null`, how should Cohen's κ treat that
pair?

## What the sources say

- **Protocol** (`docs/tier1_annotation_protocol.md`, "Cohen's kappa"): κ is computed before
  adjudication, per language, over the two annotators' raw relation judgments, with `ambiguous` as
  its own third category. It doesn't say how to handle a missing or `null` relation.
- **Protocol**, "How disagreements are resolved": two annotators "annotate every item".
- **Annotation files:** `data/tier1/validate_annotations.js` accepts `relation` as `null` or one of
  `same` / `different` / `ambiguous`. The blank templates `data/tier1/annotator_A.jsonl` and
  `annotator_B.jsonl` currently have `relation: null` on all 226 records.
- **Earlier LLM agreement files:**
  - `data/tier1/annotations/llm_agreement.json`: its `method` text says "null labels are treated
    as their own category".
  - `llm_new_agreement.json`: its `method` text doesn't mention null labels.
  - None of the four LLM annotation files has a `null` relation, so this never affected their
    relation κ.

## Current implementation (fact, not a decision)

`data/tier1/scripts/cohens_kappa.js` currently does the following. This is how it was written, not
a policy anyone chose:

- A pair whose `relation` is `null` in either file is left out of κ and n.
- Those pairs are counted as `n_unlabeled` in their language row and in the pooled row.
- If every pair is unlabeled, n = 0, κ is `null` ("undefined: n = 0"), and the exit code is 0.
- A record with no `relation` field at all is rejected (exit 1). That rule is separate from how
  `null` is handled.

`data/tier1/scripts/test_cohens_kappa.js` locks this in (tests 6 and 7). Choosing option 2 or 3
below means changing the script and those tests.

## Options

| # | Option | Practical implication | Effect on interpreting κ |
|---|---|---|---|
| 1 | Leave out any pair where either annotator's `relation` is `null`, and report how many were left out. | κ can be computed on partly finished batches. The left-out count has to be reported next to κ. | κ covers only the pairs both annotators labeled. If the unlabeled pairs are hard ones that annotators skipped, κ may overstate agreement on the whole batch. n shrinks, so per-language κ becomes less stable. |
| 2 | Treat `null` as a separate category. | κ can be computed on any file, including blank templates. Every pair counts towards n. | "Both left it blank" counts as agreement, and "one labeled, one blank" counts as disagreement. So κ mixes agreement on labels with agreement on completion. Two blank files look like complete agreement (p_e = 1, κ undefined). A partly blank batch gets a κ that doesn't measure agreement on relation alone. |
| 3 | Reject an annotation file until every `relation` is filled in. | κ is only produced for fully finished batches. Partly finished batches get no κ, so interim checks during annotation aren't possible. A pair an annotator can't judge must be labeled (for example `ambiguous`), not left blank. | κ always covers every item in the batch, with n equal to the batch size. That matches "annotate every item". Completeness is enforced before κ is computed, not reflected in κ itself. |

## Decision record

When decided, fill this in and update `cohens_kappa.js`, its tests, and (if the rule belongs in the
protocol) `tier1_annotation_protocol.md`.

| Field | Value |
|---|---|
| Choice | |
| Decider | |
| Date | |
| Notes | |
