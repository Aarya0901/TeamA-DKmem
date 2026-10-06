# Tier 1 annotation template

`annotations_template.jsonl` is a blank annotation sheet: one record per candidate in
`candidates.jsonl` (226/226, exact 1:1 by `pair_id`), with every judgment field set to `null` and
`annotator_id` set to `""`. **No grammaticality, minimality, or relation judgments have been made
or inferred.** Follow the decision rules in
[`docs/tier1_annotation_protocol.md`](../../docs/tier1_annotation_protocol.md) to fill it in --
this file only defines the empty shape.

## Workflow

1. Each annotator works in their own copy of `annotations_template.jsonl`, with `annotator_id`
   set on every record. Two copies already exist: `data/tier1/annotator_A.jsonl`
   (`annotator_id: "A"`) and `data/tier1/annotator_B.jsonl` (`"B"`). Both are still blank.
2. Annotate every record per the protocol: read `utterance_a`/`utterance_b` in `candidates.jsonl`
   (joined by `pair_id`) before judging, without reading `english_gloss` first.
3. Run `node validate_annotations.js annotator_A.jsonl` (or `annotator_B.jsonl`) from
   `data/tier1/` before handing the file back, to catch schema/enum typos before adjudication.
4. Two annotators' files per language feed Cohen's kappa and adjudication, per the protocol.

## Record schema

| Field | Type | Allowed values | Meaning |
|---|---|---|---|
| `pair_id` | string | must match a `pair_id` in `candidates.jsonl` | Joins back to the candidate item. |
| `annotator_id` | string | free text, blank (`""`) in the template | Set once per annotator's copy. |
| `grammaticality` | string or `null` | `grammatical`, `ungrammatical`, `unnatural_but_grammatical` | Per protocol, "Flagging ungrammatical or unnatural pairs". |
| `minimal_pair` | string or `null` | `yes`, `no` | Per protocol, "Flagging non-minimal pairs". |
| `relation` | string or `null` | `same`, `different`, `ambiguous` | Per protocol, "Same vs. different: the gold decision" and the honorific/politeness special handling. |
| `ambiguity_reason` | string or `null` | free text | Required in spirit (warned on by the validator) whenever `relation` is `ambiguous`. |
| `suggested_fix` | string or `null` | free text (a corrected utterance) | Only set when `grammaticality` is `ungrammatical` and the fix is a single obvious correction. |
| `notes` | string or `null` | free text | One-line rationale, per protocol step 5 -- record even when the judgment feels obvious. |

`null` always means "not yet judged." It is never a valid final answer for `grammaticality`,
`minimal_pair`, or `relation` in a completed annotation -- see the protocol's "Final inclusion
rule."

Example blank record:

```json
{"pair_id":"t1_0001","annotator_id":"","grammaticality":null,"minimal_pair":null,"relation":null,"ambiguity_reason":null,"suggested_fix":null,"notes":null}
```

## Regenerating

```
node generate_annotations_template.js
```

Rebuilds `annotations_template.jsonl` from the current `candidates.jsonl` (all blank). Re-run this
if `candidates.jsonl` changes -- pair_ids are not stable across a `candidates.jsonl` regeneration,
so a stale template will fail the validator's completeness check.

## Validation

```
node validate_annotations.js [path]
```

Defaults to `annotations_template.jsonl`; pass a filled-in annotator file to validate that instead.
Checks: all 8 fields present with no extras; `grammaticality`/`minimal_pair`/`relation` are `null`
or one of their allowed enum values; exactly one record per `candidates.jsonl` `pair_id` (no
missing, no duplicate, no unknown ID); warns (does not fail) if `relation` is `ambiguous` with an
empty `ambiguity_reason`. Exits non-zero and lists every violation on schema/enum/completeness
failure; otherwise prints coverage and a per-field count of how many records are filled in (0 for
a fresh template).
