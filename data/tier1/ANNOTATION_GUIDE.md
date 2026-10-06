# Tier 1 Annotation Guide

This is a **read-only, human-friendly view** of `candidates.jsonl` for annotators to work from.
It does not replace, and is never read by, `validate_annotations.js`. All actual judgments must be
entered in your assigned annotator file:

- Annotator A → `data/tier1/annotator_A.jsonl`
- Annotator B → `data/tier1/annotator_B.jsonl`

Each line in that file corresponds 1:1 (by `pair_id`) to a row in the table below. Edit the JSONL
file directly (one JSON object per line) — this Markdown file is not parsed by any script and is
not a valid place to record judgments.

**Do not edit `candidates.jsonl`, `annotations_template.jsonl`, `annotator_A.jsonl`, or
`annotator_B.jsonl` based on this guide — this guide is generated from them, not the other way
around.**

## Overview

- Total pairs: **226** (186 template-generated + 40 hand-authored)
- Languages: Hindi (`hi`, 177), Korean (`ko`, 24), Turkish (`tr`, 10), German (`de`, 15)
- Distinction classes: `classifier_measure` (24), `evidentiality` (34), `honorific_register` (39), `kinship` (32), `name_variant` (24), `politeness_relationship` (51), `spatial_temporal_deixis` (22)

## Fields you must fill in

These are the only fields a human annotator should ever set. Everything else in your annotator
file is either pre-filled for you or must stay blank unless a condition below applies.

| Field | Required? | Allowed values | Notes |
|---|---|---|---|
| `grammaticality` | **Always fill** | `grammatical`, `ungrammatical`, `unnatural_but_grammatical` | Judge utterance naturalness/grammaticality as a pair (or note in `notes` if A and B differ). |
| `minimal_pair` | **Always fill** | `yes`, `no` | Whether A and B differ by only the single distinction being tested. |
| `relation` | **Always fill** | `same`, `different`, `ambiguous` | Your judgment of whether A and B express the same relation/meaning. |
| `ambiguity_reason` | **Fill only if** `relation` = `ambiguous` | free text | Leave blank (`null`) for every other value of `relation`. The validator only warns (does not error) if this is missing on an ambiguous row. |
| `suggested_fix` | Optional | free text | Fill in only when useful, e.g. `grammaticality` = `ungrammatical`. Otherwise leave blank. |
| `notes` | Optional | free text | Anything else worth flagging. Always fine to leave blank. |

## Fields you must NOT edit

| Field | Why |
|---|---|
| `pair_id` | Must match `candidates.jsonl` exactly (1:1). The validator errors on any missing, duplicate, or unknown `pair_id`. |
| `annotator_id` | Already pre-filled (`"A"` or `"B"`) depending on which file you were given. |

Note: `candidates.jsonl` also carries a `gold_relation` field. It is intentionally **omitted** from
the table below so your `relation` judgment stays independent of it. That field is a
generation-time default, not a gold label, and is `null` on the 40 hand-authored pairs.

## Pair reference table

Grouped by language. `class` is the linguistic distinction being tested for that pair. The last
three columns are blank placeholders showing where your judgments go — enter them in your
`annotator_*.jsonl` file, not here.

### Hindi (`hi`, 177 pairs)

| pair_id | class | utterance_a | utterance_b | grammaticality | minimal_pair | relation |
|---|---|---|---|---|---|---|
| t1_0001 | kinship | meri chachi Pune mein rehti hai | meri mausi Pune mein rehti hai | | | |
| t1_0002 | kinship | meri chachi Pune aa rahi hai | meri mausi Pune aa rahi hai | | | |
| t1_0003 | kinship | meri chachi Jaipur mein rehti hai | meri mausi Jaipur mein rehti hai | | | |
| t1_0004 | kinship | meri chachi Jaipur aa rahi hai | meri mausi Jaipur aa rahi hai | | | |
| t1_0005 | kinship | kal meri chachi ka phone aaya | kal meri mausi ka phone aaya | | | |
| t1_0006 | kinship | aaj meri chachi ka phone aaya | aaj meri mausi ka phone aaya | | | |
| t1_0007 | kinship | meri chachi Pune mein rehti hai | meri bua Pune mein rehti hai | | | |
| t1_0008 | kinship | meri chachi Pune aa rahi hai | meri bua Pune aa rahi hai | | | |
| t1_0009 | kinship | meri chachi Jaipur mein rehti hai | meri bua Jaipur mein rehti hai | | | |
| t1_0010 | kinship | meri chachi Jaipur aa rahi hai | meri bua Jaipur aa rahi hai | | | |
| t1_0011 | kinship | kal meri chachi ka phone aaya | kal meri bua ka phone aaya | | | |
| t1_0012 | kinship | aaj meri chachi ka phone aaya | aaj meri bua ka phone aaya | | | |
| t1_0013 | kinship | meri mami Pune mein rehti hai | meri mausi Pune mein rehti hai | | | |
| t1_0014 | kinship | meri mami Pune aa rahi hai | meri mausi Pune aa rahi hai | | | |
| t1_0015 | kinship | meri mami Jaipur mein rehti hai | meri mausi Jaipur mein rehti hai | | | |
| t1_0016 | kinship | meri mami Jaipur aa rahi hai | meri mausi Jaipur aa rahi hai | | | |
| t1_0017 | kinship | kal meri mami ka phone aaya | kal meri mausi ka phone aaya | | | |
| t1_0018 | kinship | aaj meri mami ka phone aaya | aaj meri mausi ka phone aaya | | | |
| t1_0019 | kinship | meri bua Pune mein rehti hai | meri mami Pune mein rehti hai | | | |
| t1_0020 | kinship | meri bua Pune aa rahi hai | meri mami Pune aa rahi hai | | | |
| t1_0021 | kinship | meri bua Jaipur mein rehti hai | meri mami Jaipur mein rehti hai | | | |
| t1_0022 | kinship | meri bua Jaipur aa rahi hai | meri mami Jaipur aa rahi hai | | | |
| t1_0023 | kinship | kal meri bua ka phone aaya | kal meri mami ka phone aaya | | | |
| t1_0024 | kinship | aaj meri bua ka phone aaya | aaj meri mami ka phone aaya | | | |
| t1_0025 | kinship | meri dadi Pune aa rahi hain | meri nani Pune aa rahi hain | | | |
| t1_0026 | kinship | meri dadi Jaipur aa rahi hain | meri nani Jaipur aa rahi hain | | | |
| t1_0027 | kinship | meri dadi Delhi aa rahi hain | meri nani Delhi aa rahi hain | | | |
| t1_0028 | kinship | meri dadi Lucknow aa rahi hain | meri nani Lucknow aa rahi hain | | | |
| t1_0029 | kinship | meri dadi Chennai aa rahi hain | meri nani Chennai aa rahi hain | | | |
| t1_0030 | kinship | meri dadi ka phone kal aaya | meri nani ka phone kal aaya | | | |
| t1_0031 | kinship | meri dadi ka phone aaj aaya | meri nani ka phone aaj aaya | | | |
| t1_0032 | kinship | meri dadi ka phone abhi aaya | meri nani ka phone abhi aaya | | | |
| t1_0033 | honorific_register | tu kal Pune aa rahi hai? | aap kal Pune aa rahi hain? | | | |
| t1_0034 | honorific_register | tu kal Nagpur aa rahi hai? | aap kal Nagpur aa rahi hain? | | | |
| t1_0035 | honorific_register | tu aaj Pune aa rahi hai? | aap aaj Pune aa rahi hain? | | | |
| t1_0036 | honorific_register | tu aaj Nagpur aa rahi hai? | aap aaj Nagpur aa rahi hain? | | | |
| t1_0037 | honorific_register | tu abhi Pune aa rahi hai? | aap abhi Pune aa rahi hain? | | | |
| t1_0038 | honorific_register | tu abhi Nagpur aa rahi hai? | aap abhi Nagpur aa rahi hain? | | | |
| t1_0039 | honorific_register | tu subah Pune aa rahi hai? | aap subah Pune aa rahi hain? | | | |
| t1_0040 | honorific_register | tu subah Nagpur aa rahi hai? | aap subah Nagpur aa rahi hain? | | | |
| t1_0041 | honorific_register | tum kal Pune ja rahe ho? | aap kal Pune ja rahe hain? | | | |
| t1_0042 | honorific_register | tum kal Nagpur ja rahe ho? | aap kal Nagpur ja rahe hain? | | | |
| t1_0043 | honorific_register | tum aaj Pune ja rahe ho? | aap aaj Pune ja rahe hain? | | | |
| t1_0044 | honorific_register | tum aaj Nagpur ja rahe ho? | aap aaj Nagpur ja rahe hain? | | | |
| t1_0045 | honorific_register | tum abhi Pune ja rahe ho? | aap abhi Pune ja rahe hain? | | | |
| t1_0046 | honorific_register | tum abhi Nagpur ja rahe ho? | aap abhi Nagpur ja rahe hain? | | | |
| t1_0047 | honorific_register | tum subah Pune ja rahe ho? | aap subah Pune ja rahe hain? | | | |
| t1_0048 | honorific_register | tum subah Nagpur ja rahe ho? | aap subah Nagpur ja rahe hain? | | | |
| t1_0056 | name_variant | Priya aa rahi hai | प्रिया aa rahi hai | | | |
| t1_0057 | name_variant | Priya party mein aayi thi | प्रिया party mein aayi thi | | | |
| t1_0058 | name_variant | Priya ne call kiya | प्रिया ne call kiya | | | |
| t1_0059 | name_variant | Neha aa rahi hai | नेहा aa rahi hai | | | |
| t1_0060 | name_variant | Neha party mein aayi thi | नेहा party mein aayi thi | | | |
| t1_0061 | name_variant | Neha ne call kiya | नेहा ne call kiya | | | |
| t1_0062 | name_variant | Anjali aa rahi hai | अंजलि aa rahi hai | | | |
| t1_0063 | name_variant | Anjali party mein aayi thi | अंजलि party mein aayi thi | | | |
| t1_0064 | name_variant | Anjali ne call kiya | अंजलि ne call kiya | | | |
| t1_0065 | name_variant | Pooja aa rahi hai | पूजा aa rahi hai | | | |
| t1_0066 | name_variant | Pooja party mein aayi thi | पूजा party mein aayi thi | | | |
| t1_0067 | name_variant | Pooja ne call kiya | पूजा ne call kiya | | | |
| t1_0068 | name_variant | Rahul aa raha hai | राहुल aa raha hai | | | |
| t1_0069 | name_variant | Rahul ne call kiya | राहुल ne call kiya | | | |
| t1_0070 | name_variant | Amit aa raha hai | अमित aa raha hai | | | |
| t1_0071 | name_variant | Amit ne call kiya | अमित ne call kiya | | | |
| t1_0072 | name_variant | Vikram aa raha hai | विक्रम aa raha hai | | | |
| t1_0073 | name_variant | Vikram ne call kiya | विक्रम ne call kiya | | | |
| t1_0074 | name_variant | Arjun aa raha hai | अर्जुन aa raha hai | | | |
| t1_0075 | name_variant | Arjun ne call kiya | अर्जुन ne call kiya | | | |
| t1_0076 | name_variant | Priya office se aa rahi hai | Priya college se aa rahi hai | | | |
| t1_0077 | name_variant | Priya school se aa rahi hai | Priya gym se aa rahi hai | | | |
| t1_0078 | name_variant | Neha office se aa rahi hai | Neha college se aa rahi hai | | | |
| t1_0079 | name_variant | Neha school se aa rahi hai | Neha gym se aa rahi hai | | | |
| t1_0080 | evidentiality | suna hai Rahul Pune gaya | maine khud dekha Rahul Pune gaya | | | |
| t1_0081 | evidentiality | suna hai Rahul Jaipur gaya | maine khud dekha Rahul Jaipur gaya | | | |
| t1_0082 | evidentiality | suna hai Amit Pune gaya | maine khud dekha Amit Pune gaya | | | |
| t1_0083 | evidentiality | suna hai Amit Jaipur gaya | maine khud dekha Amit Jaipur gaya | | | |
| t1_0084 | evidentiality | suna hai Vikram Pune gaya | maine khud dekha Vikram Pune gaya | | | |
| t1_0085 | evidentiality | suna hai Vikram Jaipur gaya | maine khud dekha Vikram Jaipur gaya | | | |
| t1_0086 | evidentiality | suna hai Arjun Pune gaya | maine khud dekha Arjun Pune gaya | | | |
| t1_0087 | evidentiality | suna hai Arjun Jaipur gaya | maine khud dekha Arjun Jaipur gaya | | | |
| t1_0088 | evidentiality | suna hai Rohan Pune gaya | maine khud dekha Rohan Pune gaya | | | |
| t1_0089 | evidentiality | suna hai Rohan Jaipur gaya | maine khud dekha Rohan Jaipur gaya | | | |
| t1_0090 | evidentiality | suna hai Suresh Pune gaya | maine khud dekha Suresh Pune gaya | | | |
| t1_0091 | evidentiality | suna hai Suresh Jaipur gaya | maine khud dekha Suresh Jaipur gaya | | | |
| t1_0092 | evidentiality | suna hai Deepak Pune gaya | maine khud dekha Deepak Pune gaya | | | |
| t1_0093 | evidentiality | suna hai Deepak Jaipur gaya | maine khud dekha Deepak Jaipur gaya | | | |
| t1_0094 | evidentiality | suna hai Manoj Pune gaya | maine khud dekha Manoj Pune gaya | | | |
| t1_0095 | evidentiality | suna hai Manoj Jaipur gaya | maine khud dekha Manoj Jaipur gaya | | | |
| t1_0096 | evidentiality | kehte hain Rahul bimar hai | maine khud dekha Rahul bimar hai | | | |
| t1_0097 | evidentiality | kehte hain Amit bimar hai | maine khud dekha Amit bimar hai | | | |
| t1_0098 | evidentiality | kehte hain Vikram bimar hai | maine khud dekha Vikram bimar hai | | | |
| t1_0099 | evidentiality | kehte hain Arjun bimar hai | maine khud dekha Arjun bimar hai | | | |
| t1_0100 | evidentiality | kehte hain Rohan bimar hai | maine khud dekha Rohan bimar hai | | | |
| t1_0101 | evidentiality | kehte hain Suresh bimar hai | maine khud dekha Suresh bimar hai | | | |
| t1_0102 | evidentiality | kehte hain Deepak bimar hai | maine khud dekha Deepak bimar hai | | | |
| t1_0103 | evidentiality | kehte hain Manoj bimar hai | maine khud dekha Manoj bimar hai | | | |
| t1_0114 | classifier_measure | Rahul ne do jode kapde diye | Rahul ne do tukde kapda diya | | | |
| t1_0115 | classifier_measure | Rahul ek botal doodh laaya | Rahul ek gilaas doodh laaya | | | |
| t1_0116 | classifier_measure | Rahul ek gilaas paani piya | Rahul ek botal paani piya | | | |
| t1_0117 | classifier_measure | Amit ne do jode kapde diye | Amit ne do tukde kapda diya | | | |
| t1_0118 | classifier_measure | Amit ek botal doodh laaya | Amit ek gilaas doodh laaya | | | |
| t1_0119 | classifier_measure | Amit ek gilaas paani piya | Amit ek botal paani piya | | | |
| t1_0120 | classifier_measure | Vikram ne do jode kapde diye | Vikram ne do tukde kapda diya | | | |
| t1_0121 | classifier_measure | Vikram ek botal doodh laaya | Vikram ek gilaas doodh laaya | | | |
| t1_0122 | classifier_measure | Vikram ek gilaas paani piya | Vikram ek botal paani piya | | | |
| t1_0123 | classifier_measure | Arjun ne do jode kapde diye | Arjun ne do tukde kapda diya | | | |
| t1_0124 | classifier_measure | Arjun ek botal doodh laaya | Arjun ek gilaas doodh laaya | | | |
| t1_0125 | classifier_measure | Arjun ek gilaas paani piya | Arjun ek botal paani piya | | | |
| t1_0126 | classifier_measure | Rohan ne do jode kapde diye | Rohan ne do tukde kapda diya | | | |
| t1_0127 | classifier_measure | Rohan ek botal doodh laaya | Rohan ek gilaas doodh laaya | | | |
| t1_0128 | classifier_measure | Rohan ek gilaas paani piya | Rohan ek botal paani piya | | | |
| t1_0129 | classifier_measure | Suresh ne do jode kapde diye | Suresh ne do tukde kapda diya | | | |
| t1_0130 | classifier_measure | Suresh ek botal doodh laaya | Suresh ek gilaas doodh laaya | | | |
| t1_0131 | classifier_measure | Suresh ek gilaas paani piya | Suresh ek botal paani piya | | | |
| t1_0132 | classifier_measure | Deepak ne do jode kapde diye | Deepak ne do tukde kapda diya | | | |
| t1_0133 | classifier_measure | Deepak ek botal doodh laaya | Deepak ek gilaas doodh laaya | | | |
| t1_0134 | classifier_measure | Deepak ek gilaas paani piya | Deepak ek botal paani piya | | | |
| t1_0135 | classifier_measure | Manoj ne do jode kapde diye | Manoj ne do tukde kapda diya | | | |
| t1_0136 | classifier_measure | Manoj ek botal doodh laaya | Manoj ek gilaas doodh laaya | | | |
| t1_0137 | classifier_measure | Manoj ek gilaas paani piya | Manoj ek botal paani piya | | | |
| t1_0138 | politeness_relationship | kal bhaiya ne madad ki | kal yaar ne madad ki | | | |
| t1_0139 | politeness_relationship | aaj bhaiya ne madad ki | aaj yaar ne madad ki | | | |
| t1_0140 | politeness_relationship | abhi bhaiya ne madad ki | abhi yaar ne madad ki | | | |
| t1_0141 | politeness_relationship | kal bhaiya ne paisa diya | kal yaar ne paisa diya | | | |
| t1_0142 | politeness_relationship | aaj bhaiya ne paisa diya | aaj yaar ne paisa diya | | | |
| t1_0143 | politeness_relationship | abhi bhaiya ne paisa diya | abhi yaar ne paisa diya | | | |
| t1_0144 | politeness_relationship | kal bhaiya ne bulaya | kal yaar ne bulaya | | | |
| t1_0145 | politeness_relationship | aaj bhaiya ne bulaya | aaj yaar ne bulaya | | | |
| t1_0146 | politeness_relationship | abhi bhaiya ne bulaya | abhi yaar ne bulaya | | | |
| t1_0147 | politeness_relationship | kal bhaiya ne khana khilaya | kal yaar ne khana khilaya | | | |
| t1_0148 | politeness_relationship | aaj bhaiya ne khana khilaya | aaj yaar ne khana khilaya | | | |
| t1_0149 | politeness_relationship | abhi bhaiya ne khana khilaya | abhi yaar ne khana khilaya | | | |
| t1_0150 | politeness_relationship | kal bhaiya ne gift diya | kal yaar ne gift diya | | | |
| t1_0151 | politeness_relationship | aaj bhaiya ne gift diya | aaj yaar ne gift diya | | | |
| t1_0152 | politeness_relationship | abhi bhaiya ne gift diya | abhi yaar ne gift diya | | | |
| t1_0165 | spatial_temporal_deixis | kal Rahul Pune gaya tha | kal Rahul Pune jayega | | | |
| t1_0166 | spatial_temporal_deixis | kal Rahul Jaipur gaya tha | kal Rahul Jaipur jayega | | | |
| t1_0167 | spatial_temporal_deixis | kal Amit Pune gaya tha | kal Amit Pune jayega | | | |
| t1_0168 | spatial_temporal_deixis | kal Amit Jaipur gaya tha | kal Amit Jaipur jayega | | | |
| t1_0169 | spatial_temporal_deixis | kal Vikram Pune gaya tha | kal Vikram Pune jayega | | | |
| t1_0170 | spatial_temporal_deixis | kal Vikram Jaipur gaya tha | kal Vikram Jaipur jayega | | | |
| t1_0171 | spatial_temporal_deixis | kal Arjun Pune gaya tha | kal Arjun Pune jayega | | | |
| t1_0172 | spatial_temporal_deixis | kal Arjun Jaipur gaya tha | kal Arjun Jaipur jayega | | | |
| t1_0173 | spatial_temporal_deixis | kal Rohan Pune gaya tha | kal Rohan Pune jayega | | | |
| t1_0174 | spatial_temporal_deixis | kal Rohan Jaipur gaya tha | kal Rohan Jaipur jayega | | | |
| t1_0175 | spatial_temporal_deixis | kal Suresh Pune gaya tha | kal Suresh Pune jayega | | | |
| t1_0176 | spatial_temporal_deixis | kal Suresh Jaipur gaya tha | kal Suresh Jaipur jayega | | | |
| t1_0177 | spatial_temporal_deixis | kal Deepak Pune gaya tha | kal Deepak Pune jayega | | | |
| t1_0178 | spatial_temporal_deixis | kal Deepak Jaipur gaya tha | kal Deepak Jaipur jayega | | | |
| t1_0179 | spatial_temporal_deixis | kal Manoj Pune gaya tha | kal Manoj Pune jayega | | | |
| t1_0180 | spatial_temporal_deixis | kal Manoj Jaipur gaya tha | kal Manoj Jaipur jayega | | | |
| t1_0181 | spatial_temporal_deixis | yeh ghar mera hai | woh ghar mera hai | | | |
| t1_0182 | spatial_temporal_deixis | yeh kamra mera hai | woh kamra mera hai | | | |
| t1_0183 | spatial_temporal_deixis | yeh bag mera hai | woh bag mera hai | | | |
| t1_0184 | spatial_temporal_deixis | yeh phone mera hai | woh phone mera hai | | | |
| t1_0185 | spatial_temporal_deixis | yeh laptop mera hai | woh laptop mera hai | | | |
| t1_0186 | spatial_temporal_deixis | yeh scooter mera hai | woh scooter mera hai | | | |
| t1_0187 | honorific_register | Maa, tum kab ghar aaogi? | Maa, aap kab ghar aayengi? | | | |
| t1_0188 | honorific_register | Papa, tum khana kha lo | Papa, aap khana kha lijiye | | | |
| t1_0189 | honorific_register | Maa, tu chinta mat kar | Maa, tum chinta mat karo | | | |
| t1_0190 | honorific_register | Didi, tu kab aa rahi hai? | Didi, aap kab aa rahi hain? | | | |
| t1_0191 | honorific_register | Nani, tum dawai le lo | Nani, aap dawai le lijiye | | | |
| t1_0192 | honorific_register | Papa, tum kal Delhi ja rahe ho? | Papa, aap kal Delhi ja rahe hain? | | | |
| t1_0193 | honorific_register | Papa, tumne mera result dekha? | Papa, aapne mera result dekha? | | | |
| t1_0194 | honorific_register | Maa, tumne khana khaya? | Maa, aapne khana khaya? | | | |
| t1_0215 | politeness_relationship | Dadi ji ne kahani sunayi | Dadi ne kahani sunayi | | | |
| t1_0216 | politeness_relationship | Dadi ji ne pooja karwayi | Dadi ne pooja karwayi | | | |
| t1_0217 | politeness_relationship | Nani ji ne achaar bheja | Nani ne achaar bheja | | | |
| t1_0218 | politeness_relationship | Nani ji ne sweater buna | Nani ne sweater buna | | | |
| t1_0219 | politeness_relationship | Dada ji ne akhbaar padha | Dada ne akhbaar padha | | | |
| t1_0220 | politeness_relationship | Nana ji ne cycle dilayi | Nana ne cycle dilayi | | | |
| t1_0221 | politeness_relationship | Gupta uncle ne gaadi di | Gupta bhaiya ne gaadi di | | | |
| t1_0222 | politeness_relationship | Sharma aunty ne ladoo bheje | Sharma didi ne ladoo bheje | | | |
| t1_0223 | politeness_relationship | Verma uncle kal ghar aaye the | Verma bhaiya kal ghar aaye the | | | |
| t1_0224 | politeness_relationship | Kapoor aunty ne party mein bulaya | Kapoor didi ne party mein bulaya | | | |
| t1_0225 | politeness_relationship | Singh uncle ne maths padhaya | Singh bhaiya ne maths padhaya | | | |
| t1_0226 | politeness_relationship | Mishra aunty ne khana bheja | Mishra didi ne khana bheja | | | |

### Korean (`ko`, 24 pairs)

| pair_id | class | utterance_a | utterance_b | grammaticality | minimal_pair | relation |
|---|---|---|---|---|---|---|
| t1_0153 | politeness_relationship | 친구가 왔어 | 친구분이 오셨어요 | | | |
| t1_0154 | politeness_relationship | 어제 친구가 왔어 | 어제 친구분이 오셨어요 | | | |
| t1_0155 | politeness_relationship | 오늘 친구가 왔어 | 오늘 친구분이 오셨어요 | | | |
| t1_0156 | politeness_relationship | 친구가 도와줬어 | 친구분이 도와주셨어요 | | | |
| t1_0157 | politeness_relationship | 어제 친구가 도와줬어 | 어제 친구분이 도와주셨어요 | | | |
| t1_0158 | politeness_relationship | 오늘 친구가 도와줬어 | 오늘 친구분이 도와주셨어요 | | | |
| t1_0159 | politeness_relationship | 친구가 갔어 | 친구분이 가셨어요 | | | |
| t1_0160 | politeness_relationship | 어제 친구가 갔어 | 어제 친구분이 가셨어요 | | | |
| t1_0161 | politeness_relationship | 오늘 친구가 갔어 | 오늘 친구분이 가셨어요 | | | |
| t1_0162 | politeness_relationship | 친구가 전화했어 | 친구분이 전화하셨어요 | | | |
| t1_0163 | politeness_relationship | 어제 친구가 전화했어 | 어제 친구분이 전화하셨어요 | | | |
| t1_0164 | politeness_relationship | 오늘 친구가 전화했어 | 오늘 친구분이 전화하셨어요 | | | |
| t1_0203 | politeness_relationship | 엄마가 전화했어 | 엄마가 전화했어요 | | | |
| t1_0204 | politeness_relationship | 우리 형이 결혼했어 | 우리 형이 결혼했어요 | | | |
| t1_0205 | politeness_relationship | 할머니가 오셨어 | 할머니가 오셨어요 | | | |
| t1_0206 | politeness_relationship | 아빠가 새 차를 샀어 | 아빠가 새 차를 샀어요 | | | |
| t1_0207 | politeness_relationship | 우리 강아지가 아파 | 우리 강아지가 아파요 | | | |
| t1_0208 | politeness_relationship | 내 동생이 시험에 합격했어 | 제 동생이 시험에 합격했어요 | | | |
| t1_0209 | politeness_relationship | 아들이 왔어요 | 아드님이 오셨어요 | | | |
| t1_0210 | politeness_relationship | 딸이 결혼했어요 | 따님이 결혼하셨어요 | | | |
| t1_0211 | politeness_relationship | 아들이 대학에 합격했어요 | 아드님이 대학에 합격하셨어요 | | | |
| t1_0212 | politeness_relationship | 딸이 전화했어요 | 따님이 전화하셨어요 | | | |
| t1_0213 | politeness_relationship | 아내가 병원에 갔어요 | 부인이 병원에 가셨어요 | | | |
| t1_0214 | politeness_relationship | 딸이 서울로 이사했어요 | 따님이 서울로 이사하셨어요 | | | |

### Turkish (`tr`, 10 pairs)

| pair_id | class | utterance_a | utterance_b | grammaticality | minimal_pair | relation |
|---|---|---|---|---|---|---|
| t1_0104 | evidentiality | Ali geldi | Ali gelmiş | | | |
| t1_0105 | evidentiality | Ayşe geldi | Ayşe gelmiş | | | |
| t1_0106 | evidentiality | Mehmet geldi | Mehmet gelmiş | | | |
| t1_0107 | evidentiality | Elif geldi | Elif gelmiş | | | |
| t1_0108 | evidentiality | Can geldi | Can gelmiş | | | |
| t1_0109 | evidentiality | Zeynep geldi | Zeynep gelmiş | | | |
| t1_0110 | evidentiality | Emre geldi | Emre gelmiş | | | |
| t1_0111 | evidentiality | Deniz geldi | Deniz gelmiş | | | |
| t1_0112 | evidentiality | Ali gitti | Ali gitmiş | | | |
| t1_0113 | evidentiality | Ayşe gitti | Ayşe gitmiş | | | |

### German (`de`, 15 pairs)

| pair_id | class | utterance_a | utterance_b | grammaticality | minimal_pair | relation |
|---|---|---|---|---|---|---|
| t1_0049 | honorific_register | Wie geht es dir heute? | Wie geht es Ihnen heute? | | | |
| t1_0050 | honorific_register | Wie geht es dir gerade? | Wie geht es Ihnen gerade? | | | |
| t1_0051 | honorific_register | Wie geht es dir morgen früh? | Wie geht es Ihnen morgen früh? | | | |
| t1_0052 | honorific_register | Kommst du morgen? | Kommen Sie morgen? | | | |
| t1_0053 | honorific_register | Kommst du heute? | Kommen Sie heute? | | | |
| t1_0054 | honorific_register | Kommst du am Montag? | Kommen Sie am Montag? | | | |
| t1_0055 | honorific_register | Kommst du nächste Woche? | Kommen Sie nächste Woche? | | | |
| t1_0195 | honorific_register | Chef, hast du morgen kurz Zeit? | Chef, haben Sie morgen kurz Zeit? | | | |
| t1_0196 | honorific_register | Chefin, kannst du den Bericht bis Freitag lesen? | Chefin, können Sie den Bericht bis Freitag lesen? | | | |
| t1_0197 | honorific_register | Lena, hast du meine E-Mail bekommen? | Lena, haben Sie meine E-Mail bekommen? | | | |
| t1_0198 | honorific_register | Thomas, danke für deine Hilfe beim Umzug! | Thomas, danke für Ihre Hilfe beim Umzug! | | | |
| t1_0199 | honorific_register | Herzlichen Glückwunsch zu deinem 60. Geburtstag, Chef! | Herzlichen Glückwunsch zu Ihrem 60. Geburtstag, Chef! | | | |
| t1_0200 | honorific_register | Markus, wie war dein Urlaub in Italien? | Markus, wie war Ihr Urlaub in Italien? | | | |
| t1_0201 | honorific_register | Sabine, du hast die Präsentation super gemacht. | Sabine, Sie haben die Präsentation super gemacht. | | | |
| t1_0202 | honorific_register | Jonas, kannst du mich morgen vom Bahnhof abholen? | Jonas, können Sie mich morgen vom Bahnhof abholen? | | | |
