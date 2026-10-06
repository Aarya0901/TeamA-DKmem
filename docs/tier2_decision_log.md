# Tier 2 decision log: before data construction

Extracted from [`tier2_eval_design.md`](tier2_eval_design.md), which remains the source of truth. This
log records **no decisions**. Every item is open. "Options" lists only what the design names;
"none given" means the design names none. Owners are copied from the design's "Decides" column.
Section, question (Q), requirement (R) and dependency numbers refer to the design.

**Status key:** `OPEN` = undecided. When a decision is made, record the choice, date and decider
in the item, and update the design.

## A. Open questions that block data construction

| ID | Decision | Options named in the design | Owner | Downstream work that depends on it | Status |
|---|---|---|---|---|---|
| Q1 | Skeleton source and licence | LongMemEval-S, LoCoMo, or both. Which splits: none given. Whether licences allow modification and release: to be checked. | Team B + PI | "Everything" (design §9). Specifically: conversation structure (§5), the input format (§7), and Team A blinding from public skeletons (§8, dependency 7). | OPEN |
| Q2 | What each language condition means (Hindi / Hinglish / native-script / English control), their `language` tags, and what the English control is for a distinction English doesn't lexicalize | Tags shown in the schema: `'hi'`, `'hi-Latn'`. No other options given. | Team B + PI | R3 and labels. Deriving variants (Q3), the `language` values in the input format (§7), and the per-condition breakdown (§6). | OPEN |
| Q3 | Whether derived script and code-mixing variants keep the source item's gold relation or need re-annotation | Keep the source gold relation, or re-annotate. Resources named in the plan: indic-transliteration, IndicTrans2 / NLLB. For `name_variant`, script can itself be the distinction. | Team B annotators | Label validity. The gold relation in the answer key (§7), and derived items (§5, "Where pairs come from"). | OPEN |
| Q4 | Code-mixing ratio: metric and levels | None given ("no metric or levels are defined"). | Team B | R3. The factor levels in the answer key (§7), the per-level breakdown (§6), and allocation (Q8). | OPEN |
| Q5 | Injection form, and whether the injected fact must fit the skeleton's topic | A standalone turn (the design's proposal, §5), or embedded in a skeleton turn. Topic fit: yes or no. | Team B | Join and realism. Whether `source_utterance_id` identifies exactly the injected entries (§5), and the input format (§7). | OPEN |
| Q6 | Session-distance unit and levels | Unit named in the question: sessions between the two injected turns. Levels: none given. | Team B | R3. Where pairs are placed in conversations (§5), the factor levels in the key (§7), the per-level breakdown (§6), and allocation (Q8). | OPEN |
| Q8 | Allocation of ~60 conversations over 4 language conditions × distance × code-mixing levels, and injected pairs per conversation | Pairs per conversation: "one or more" (§5). Allocation: none given; the design notes a full crossing won't fit in 60 at useful n. | Team B + PI | Power and n < 20 cells. The indicative-cell threshold (Q11), and the conversation set itself. Needs Q2, Q4 and Q6 first. | OPEN |
| Q10 | Re-annotate labels in context? Require native-speaker κ > 0.7 before Tier 2 labels are used? | Re-annotate in context: yes or no. κ > 0.7 gate: yes or no. | Team B + PI | R10 and R12. Gold relations in the key, and whether results carry "LLM-annotated, provisional" (§4). | OPEN |
| Q13 | Downstream QA design: question source, answer format, scoring | Question source: skeleton QA, or new questions about injected facts. Answer format and scoring: none given. | Team B + Team A | R9. QA items per conversation, the new QA output schema or spec amendment (§7), and Team A's QA output (§8, dependency 5). | OPEN |

## B. Formats that must exist before construction (design §7)

| ID | Decision | Options named in the design | Owner | Downstream work that depends on it | Status |
|---|---|---|---|---|---|
| F1 | Tier 2 blinded input format: conversation → sessions → turns, with turn text, utterance IDs, per-turn opaque entity tokens and language | Content listed; file format and field names open (§5, §7). "New document or schema" | Not specified. The design leaves names "to whoever owns the schema". | "Running Tier 2 at all", and Team A's ingestion harness (§8, dependency 1). Needs Q1, Q2 and Q5. | OPEN |
| F2 | Tier 2 answer key format: utterance IDs → conversation, session and turn position; injected turns and their pair; gold relation, distinction class and factor levels | Content listed; field names open. | Team B ("Team B only") | Scoring, breakdowns and bloat per conversation (§7). Needs Q2, Q3, Q4, Q6 and Q10. | OPEN |
| F3 | Tier 2 eval contract, like `tier1_eval_contract.md` | None given beyond "new document". | Not specified ("sign-off between teams") | Team A and Team B sign-off (§7). | OPEN |

## C. Proposals awaiting sign-off (design §4–§5)

The design labels these "Proposed" (§4) and says "needs sign-off before it's built". Its only
option for each is the proposal as written; it names no alternatives except for Q5 (above).

| ID | Proposal | Owner | Downstream work that depends on it | Status |
|---|---|---|---|---|
| P1 | Unit of evaluation: one injected pair (two injected turns forming a minimal pair with a gold `same` / `different` relation) (§5) | Not specified | The answer key (F2), FCR/MCR over injected pairs (§6), and allocation (Q8) | OPEN |
| P2 | Every turn, skeleton turns included, gets an opaque per-turn token for `gold_entity_id`, because the schema requires `gold_entity_id` on every entry (§4) | Not specified | The input format (F1), and Team A dependency 2 (§8) | OPEN |
| P3 | Blinding as in Tier 1: random IDs, a separate Team B answer key, and no Team A access to source or annotation files (§4) | Not specified | The input format and key (F1, F2), and Team A dependency 7 (§8) | OPEN |
| P4 | Injected pairs come from Tier 1 Hindi items and `data/distinction_taxonomy.json`; variants in other scripts or code-mixing levels are derived items needing their own validation (§5) | Not specified | Derived variants (Q3), label status (Q10), and allocation (Q8) | OPEN |

## D. Open questions not needed before data construction

The design links these to runs, scoring or reporting rather than to building the dataset. They're
still open, and are tracked in design §9.

| ID | Decision | Design's "why it matters" | Owner |
|---|---|---|---|
| Q7 | Consolidation timing | Comparability | Team A + Team B |
| Q9 | Indirect merges via skeleton entries | Headline FCR | Team B |
| Q11 | Indicative-cell threshold and minimum n per level | Reporting | Team B |
| Q12 | Memory bloat definition | R9, schema | PI + Team B |
| Q14 | Cross-tier backbone and settings comparability | Tables across tiers | PI |
| Q15 | Contamination of public skeletons | Validity claims | PI |
