# Synthetic Tier 1 scorer fixture

**Everything here is synthetic.** It tests `score_tier1_eval.js` only. No row comes from
`tier1_eval_v2.jsonl`, the real answer key or the Team A input: pair IDs are `SYNTH_000n`,
`eval_pair_id`s are `ep_00000000000n`, and utterances and glosses are placeholder text.
The files are not a Team A run or a result.

| Pair | Gold | Class / language | What the records do | Expected outcome |
|---|---|---|---|---|
| 1 | different | kinship / hi | a–b `merge` | merged |
| 2 | different | kinship / hi | a–b `no_merge`, plus two cross-episode merges that would chain 2a–1b–2b if not ignored | compared_not_merged |
| 3 | same | evidentiality / tr | same-utterance merge a0–a1, then b0 (as `entry_a`)–a1 `underdetermined_link` | compared_not_merged |
| 4 | same | evidentiality / hi | b0 (as `entry_a`)–a0 `supersede` | merged |
| 5 | same | name_variant / hi | only same-utterance records (a–a, b–b merge) | not_compared |
| 6 | different | name_variant / de | only an a–a record, plus a merge with an unknown utterance | no_entry |

Expected: FCR 1/3, MCR 2/3; 11 records, 4 scored, ignored: 1 unknown utterance, 2 cross-episode,
4 same-utterance. `test_score_tier1_eval.js` asserts these and the per-cell counts.
