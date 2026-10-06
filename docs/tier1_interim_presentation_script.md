# Tier 1 v2 interim presentation: spoken script (5–7 min)

> **Superseded (2026-10-02).** This script was written before any runs arrived and says there are
> no results. Team A has since delivered `dk-mem-lexicon` and `dk-mem-lexicon-llm` (3 seeds each),
> and the deck now carries their provisional numbers on slides 6, 8 and 12. Don't deliver this
> script alongside the current deck without revising slides 1, 3, 6, 8, 11 and 12. Baseline runs,
> H1 and H2 are still pending.

**Based on:** [`tier1_results_presentation.md`](tier1_results_presentation.md) (the deck). Counts,
labels and definitions follow the deck and its sources. **No results are stated.** Anything that
depends on results is **[PENDING TEAM A RUNS]**, and open decisions stay open.

Delivery notes:
- The spoken text (quoted lines, transitions included) is about 900 words, roughly 6–7 minutes at a
  normal pace.
- Timings are cues, not limits.
- *Italic lines* are transitions.

---

### Slide 1: Title and research question (~0:25)

"This is an interim update on Tier 1 v2 of our cross-lingual false consolidation study. Two things
up front. There are no results yet: Team A's runs are pending, so every result slot is
**[PENDING TEAM A RUNS]**. And the labels come from LLMs, not human native speakers.

Our question: when a memory system rewrites a non-English sentence into English before storing it,
does it lose a distinction English doesn't have, and then merge two things that are actually
different?"

*Transition:* "Here's why that matters."

### Slide 2: Why it matters (~0:30)

"Someone says in Hindi that their *chachi* lives in Pune, and later that their *mausi* does. Those
are two different aunts. In English both become 'my aunt lives in Pune', so the system merges them,
and a true fact is gone. No read-side technique can recover it, because it's no longer in the
store. The same happens when *tu / tum / aap* all become 'you'."

*Transition:* "That gives us two hypotheses."

### Slide 3: Hypotheses (~0:35)

"H1: baseline systems merge some pairs that should stay separate, so FCR is above zero. The null
is zero. H2: DK-Mem's trade-off curve beats the baselines': fewer false merges at the same level of
missed merges. The null is no such dominance. Both are **[PENDING TEAM A RUNS]**. The research
notes set a pilot criterion, baseline FCR under 10%. Whether it applies to Tier 1 v2 is an open PI
decision."

*Transition:* "What are we testing on?"

### Slide 4: Dataset (~0:45)

"Each item is a minimal pair: two utterances that differ in one distinction, labelled `same` or
`different`. We started from 226 candidates, 186 template-generated and 40 hand-authored: 177
Hindi, 15 German, 10 Turkish and 24 Korean. We kept 173. The other 53 were excluded as ambiguous,
all from honorific_register and politeness_relationship.

Of the 173, 98 are `different` and 75 are `same`. Two caveats. 145 are Hindi, which is 84%. And most
classes hold a single relation: evidentiality is all `same`, kinship all `different`. Only 10 of
the 28 possible class-by-language cells have items, and 5 of those have fewer than 20."

*Transition:* "Where do the labels come from?"

### Slide 5: Annotation status (~0:40)

"Two independent LLM passes labelled every candidate, and an LLM adjudicated disagreements. The
passes agreed on 159 of 186 in the original batch, κ 0.775, and 37 of 40 in the new batch, κ 0.865.
172 kept labels were agreed and 1 was adjudicated.

Those κ values are one LLM agreeing with another, not label reliability. No native speaker has
reviewed these labels. The plan requires native-speaker κ above 0.7, and that hasn't happened. So
everything we report is 'Tier 1 v2, LLM-annotated, provisional'."

*Transition:* "Here's how Team A runs the systems."

### Slide 6: Protocol (~0:35)

"Team A gets a blinded file of 173 records with random IDs and no labels, and can't open our source
or answer files. Each record is its own episode: reset memory, ingest both utterances in order,
then consolidate. For each strategy-and-seed run they return a manifest and one record per
comparison actually made, with the raw similarity score from before gating. Nine strategies are in
scope, at least 3 seeds each, with matching backbone and settings. Which ones are run is
**[PENDING TEAM A RUNS]**."

*Transition:* "Here's how we score them."

### Slide 7: Metrics (~0:50)

"A pair counts as merged if any entry from one utterance ends up merged with any entry from the
other; supersessions count as merges. Everything else counts as not merged: compared but not merged
(including an 'underdetermined link'), never compared, or no entry at all.

FCR is the share of the 98 `different` pairs that got merged. MCR is the share of the 75 `same`
pairs that didn't. Denominators are always the full 98 and 75, including pairs never compared.
Lower is better for both. The 53 ambiguous items aren't counted anywhere.

For the frontier, we re-sweep the threshold τ offline. A pair counts as merged when its similarity
is strictly above τ, and for DK-Mem only if its compatibility check says 'compatible'. Seeds are
combined as the mean and standard deviation of per-seed rates, never pooled."

*Transition:* "Here's what we'll show."

### Slide 8: Planned results (~0:25)

"Overall FCR and MCR per strategy; breakdowns by class, by language and class by language; an
outcome breakdown; and the frontier figure. The cell sizes and flags are already filled in, because
the dataset fixes them. Every rate is **[PENDING TEAM A RUNS]**."

*Transition:* "And how we'll read them."

### Slide 9: Interpretation (~0:25)

"Always show FCR next to MCR, since never merging gives a perfect FCR. Never headline the overall
number alone: classes and relations are tangled, and 84% of pairs are Hindi. German, Korean and
Turkish results are indicative only. Confidence intervals are an open decision, so we won't claim
significance."

*Transition:* "Some limitations."

### Slide 10: Limitations (~0:25)

"The labels are LLM-only. Classes are confounded with relations. Coverage is narrow and many cells
are small. Items come from a few templates, so the effective sample is below 173. All 53 exclusions
came from the register classes. And a sweep can't recover pairs that were never compared."

*Transition:* "What's still open."

### Slide 11: Pending work and decisions (~0:30)

"We need Team A's runs, the model settings for each run, and the input and blinding attestations.
Native-speaker annotation is also still to come.

Six decisions are open:
- D1: whether the under-10% criterion applies;
- D2: bootstrap confidence intervals versus mean and SD;
- D3: frontier aggregation across seeds;
- D4: whether sweep-only intake failures block ordinary scoring;
- D5: whether to report an ambiguous-item diagnostic;
- D6: which strategies go in the headline figure."

*Transition:* "To close."

### Slide 12: Takeaways (~0:20)

"Whether the failure occurs: **[PENDING TEAM A RUNS]**. Whether DK-Mem's frontier dominates:
**[PENDING TEAM A RUNS]**. Which classes and languages are most affected, and how
store-surface-only compares: **[PENDING TEAM A RUNS]**. Even then, this won't show results on
human-validated labels, in conversations, or broadly beyond Hindi. Thanks. Happy to take
questions."

---

## Likely questions and source-grounded answers

**Q1. Can we trust these labels?**
Not as gold. They are LLM-annotated and LLM-adjudicated, with no native-speaker review
(`data/tier1/README_eval_v2.md`). The κ values of 0.775 and 0.865 are agreement between two LLM
passes. The protocol requires native-speaker κ > 0.7 before labels count as reliable
(`tier1_annotation_protocol.md`).

**Q2. Why not just report overall FCR?**
The contract says not to headline overall FCR/MCR alone. Class and relation are largely confounded,
and 145 of 173 pairs are Hindi (`tier1_eval_contract.md` §8).

**Q3. Couldn't a system get FCR = 0 by never merging?**
Yes. That's why FCR is always reported with MCR, and why the headline comparison is the FCR–MCR
frontier (research notes, Evaluation).

**Q4. What happens to pairs the system never compared?**
They count as not merged. They stay in the denominators and add a constant MCR term at every τ
(contract §4–§6).

**Q5. Why were 53 items dropped?**
All 53 were judged `ambiguous`, all in honorific_register or politeness_relationship. They appear in
no FCR or MCR numerator or denominator. A separate merge-rate diagnostic on them is allowed, but
whether to report it is D5 (contract §7; README).

**Q6. Does the frontier show what an LLM-judged system would actually do at each threshold?**
Not necessarily. The sweep re-derives decisions from the raw similarity score using the spec's
rule, so for LLM-judged strategies it can disagree with the system's actual decisions. The scorer
reports how often the two agree (scorer; intake checklist §5).

**Q7. How are seeds combined, and where are the confidence intervals?**
Mean ± sample SD of per-seed rates over at least 3 seeds, never pooled (contract §8; scorer). The
research plan also asks for a paired bootstrap with 95% CIs. The scorer doesn't do that yet, so it's
open decision D2.

**Q8. Could Team A have seen the labels?**
They receive a blinded file with random IDs and no relation or class. They may not open the source,
annotation or answer files, and they attest to that at delivery (run instructions §1; intake
checklist §2).

**Q9. What if the baselines barely fail?**
The research notes' C1 criterion says FCR under 10% for baselines means the premise is too weak for
a method paper. It was written for the 30-example pilot. Whether it applies to Tier 1 v2 is D1,
for the PI.

**Q10. Does this generalize beyond Hindi?**
Not yet. The non-Hindi items are 6 German, 12 Korean and 10 Turkish, all indicative. Tier 3 is
designed for cross-lingual generalization but not built (deck, slides 1 and 10).

---

## Still needs Team A or PI input before presenting results

- **Team A** (updated 2026-10-02; delivered so far: `dk-mem-lexicon` and `dk-mem-lexicon-llm`,
  3 seeds each, backbones in the manifests):
  - the runs for the remaining strategies × ≥3 seeds, including every baseline;
  - the model settings for each run;
  - the input-hash confirmation and attestations;
  - why the three seeds per strategy are identical, and why 35 episodes are missing from
    `dk-mem-lexicon-llm`.
- **PI / Team B:** open decisions D1–D6 (deck, slide 11). The owners listed there are proposed
  roles, not recorded assignments.
- **Presenter and date:** the deck's `[FILL IN]` on slide 1.
- **Replace every [PENDING TEAM A RUNS]** in this script once the deck's fill-in checklist is
  complete.
