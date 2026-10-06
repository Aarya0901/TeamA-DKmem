// Generates data/tier1/candidates.jsonl from templates informed by data/distinction_taxonomy.json.
//
// Method: each template is a hand-written, grammatical sentence pair (entry_a/entry_b) where only
// the distinguishing marker (kin term, pronoun register, script, evidential suffix, classifier,
// honorific verb ending, or deictic word) differs. Templates are then expanded by substituting a
// single SHARED filler (a city, name, or time adverb) into both sides of the pair identically --
// fillers sit in closed-class slots (locations, proper names, time adverbs) chosen so substitution
// does not change agreement/morphology. Where a template varies 2 filler dimensions (e.g. time x
// city), takeSpread() samples evenly across BOTH dimensions instead of taking a lexicographic
// prefix, so the generated subset doesn't accidentally hold one dimension constant.
//
// Hand-authored pairs from hand_authored_candidates.jsonl are appended after the template records
// with source_type "hand_authored" and gold_relation null (unlabeled).
//
// This script produces CANDIDATES ONLY. No native-speaker or human validation has been applied to
// its output -- see data/tier1/README.md.

const fs = require('fs');
const path = require('path');

const CITIES = ['Pune', 'Jaipur', 'Delhi', 'Lucknow', 'Chennai', 'Kanpur', 'Nagpur', 'Surat', 'Indore', 'Bhopal', 'Patna', 'Ranchi'];
const TIMES_HI = ['kal', 'aaj', 'abhi', 'subah'];
const NAMES_M = ['Rahul', 'Amit', 'Vikram', 'Arjun', 'Rohan', 'Suresh', 'Deepak', 'Manoj'];
const NAMES_F_DEVA = [['Priya', 'प्रिया'], ['Neha', 'नेहा'], ['Anjali', 'अंजलि'], ['Pooja', 'पूजा']];
const NAMES_M_DEVA = [['Rahul', 'राहुल'], ['Amit', 'अमित'], ['Vikram', 'विक्रम'], ['Arjun', 'अर्जुन']];
const CONTEXTS = [['office', 'college'], ['school', 'gym']];
const OBJECTS = ['ghar', 'kamra', 'bag', 'phone', 'laptop', 'scooter'];
const TR_NAMES = ['Ali', 'Ayşe', 'Mehmet', 'Elif', 'Can', 'Zeynep', 'Emre', 'Deniz'];
const DE_TIMES_WELLBEING = ['heute', 'gerade', 'morgen früh'];
const DE_TIMES_COMING = ['morgen', 'heute', 'am Montag', 'nächste Woche'];
const KO_TIMES = ['', '어제 ', '오늘 '];

function cartesian(...arrs) {
  return arrs.reduce((acc, arr) => acc.flatMap(comb => arr.map(x => [...comb, x])), [[]]);
}
// Evenly-spaced sample across the full cartesian ordering, so capping to n still covers every
// dimension instead of holding the first dimension constant (a lexicographic prefix would).
function takeSpread(combos, n) {
  if (combos.length <= n) return combos;
  const step = combos.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(combos[Math.floor(i * step)]);
  return out;
}

const records = [];
function add(distinction_class, language, a, b, dva, dvb, gloss, gold_relation) {
  records.push({
    distinction_class, language,
    utterance_a: a, utterance_b: b,
    distinction_value_a: dva, distinction_value_b: dvb,
    english_gloss: gloss, gold_relation,
  });
}
function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const key = r.language + '|' + r.utterance_a + '|' + r.utterance_b;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ---------- kinship (hi) ----------
{
  const auntPairs = [['chachi', 'mausi'], ['chachi', 'bua'], ['mami', 'mausi'], ['bua', 'mami']];
  for (const [ka, kb] of auntPairs) {
    for (const loc of CITIES.slice(0, 2)) {
      add('kinship', 'hi', `meri ${ka} ${loc} mein rehti hai`, `meri ${kb} ${loc} mein rehti hai`, ka, kb,
        `user's aunt lives in ${loc}`, 'different');
      add('kinship', 'hi', `meri ${ka} ${loc} aa rahi hai`, `meri ${kb} ${loc} aa rahi hai`, ka, kb,
        `user's aunt is coming to ${loc}`, 'different');
    }
    for (const time of TIMES_HI.slice(0, 2)) {
      add('kinship', 'hi', `${time} meri ${ka} ka phone aaya`, `${time} meri ${kb} ka phone aaya`, ka, kb,
        `user's aunt called ${time}`, 'different');
    }
  }
  for (const loc of CITIES.slice(0, 5)) {
    add('kinship', 'hi', `meri dadi ${loc} aa rahi hain`, `meri nani ${loc} aa rahi hain`, 'dadi', 'nani',
      `user's grandmother is coming to ${loc}`, 'different');
  }
  for (const time of TIMES_HI.slice(0, 3)) {
    add('kinship', 'hi', `meri dadi ka phone ${time} aaya`, `meri nani ka phone ${time} aaya`, 'dadi', 'nani',
      `user's grandmother called ${time}`, 'different');
  }
}

// ---------- honorific_register (hi + de) ----------
{
  for (const [time, loc] of takeSpread(cartesian(TIMES_HI, CITIES), 8)) {
    add('honorific_register', 'hi', `tu ${time} ${loc} aa rahi hai?`, `aap ${time} ${loc} aa rahi hain?`,
      'tu', 'aap', `are you coming to ${loc} ${time}?`, 'different');
  }
  for (const [time, loc] of takeSpread(cartesian(TIMES_HI, CITIES), 8)) {
    add('honorific_register', 'hi', `tum ${time} ${loc} ja rahe ho?`, `aap ${time} ${loc} ja rahe hain?`,
      'tum', 'aap', `are you going to ${loc} ${time}?`, 'different');
  }
  for (const time of DE_TIMES_WELLBEING) {
    add('honorific_register', 'de', `Wie geht es dir ${time}?`, `Wie geht es Ihnen ${time}?`,
      'du', 'Sie', `how are you ${time}?`, 'different');
  }
  for (const time of DE_TIMES_COMING) {
    add('honorific_register', 'de', `Kommst du ${time}?`, `Kommen Sie ${time}?`,
      'du', 'Sie', `are you coming ${time}?`, 'different');
  }
}

// ---------- name_variant (hi) ----------
{
  const actionsF = [['aa rahi hai', 'is coming'], ['party mein aayi thi', 'came to the party'], ['ne call kiya', 'called']];
  for (const [latin, deva] of NAMES_F_DEVA) {
    for (const [act, actGloss] of actionsF) {
      add('name_variant', 'hi', `${latin} ${act}`, `${deva} ${act}`,
        `${latin} (Latin script)`, `${deva} (Devanagari script)`, `${latin} ${actGloss}`, 'same');
    }
  }
  const actionsM = [['aa raha hai', 'is coming'], ['ne call kiya', 'called']];
  for (const [latin, deva] of NAMES_M_DEVA) {
    for (const [act, actGloss] of actionsM) {
      add('name_variant', 'hi', `${latin} ${act}`, `${deva} ${act}`,
        `${latin} (Latin script)`, `${deva} (Devanagari script)`, `${latin} ${actGloss}`, 'same');
    }
  }
  // same surface name, two different people -- context that disambiguates them is dropped by the gloss.
  for (const name of ['Priya', 'Neha']) {
    for (const [ca, cb] of CONTEXTS) {
      add('name_variant', 'hi', `${name} ${ca} se aa rahi hai`, `${name} ${cb} se aa rahi hai`,
        `${name} (${ca})`, `${name} (${cb})`, `${name} is coming`, 'different');
    }
  }
}

// ---------- evidentiality (hi + tr) ----------
{
  for (const [name, loc] of cartesian(NAMES_M, CITIES.slice(0, 2))) {
    add('evidentiality', 'hi', `suna hai ${name} ${loc} gaya`, `maine khud dekha ${name} ${loc} gaya`,
      'reported/unconfirmed', 'witnessed/confirmed', `${name} went to ${loc}`, 'same');
  }
  for (const name of NAMES_M) {
    add('evidentiality', 'hi', `kehte hain ${name} bimar hai`, `maine khud dekha ${name} bimar hai`,
      'reported/unconfirmed', 'witnessed/confirmed', `${name} is sick`, 'same');
  }
  for (const name of TR_NAMES) {
    add('evidentiality', 'tr', `${name} geldi`, `${name} gelmiş`, '-di (witnessed)', '-miş (reported)',
      `${name} arrived`, 'same');
  }
  for (const name of TR_NAMES.slice(0, 2)) {
    add('evidentiality', 'tr', `${name} gitti`, `${name} gitmiş`, '-di (witnessed)', '-miş (reported)',
      `${name} went`, 'same');
  }
}

// ---------- classifier_measure (hi) ----------
{
  for (const name of NAMES_M) {
    add('classifier_measure', 'hi', `${name} ne do jode kapde diye`, `${name} ne do tukde kapda diya`,
      'jode (pair/set)', 'tukda (piece)', `${name} gave two [units] of clothes`, 'different');
    add('classifier_measure', 'hi', `${name} ek botal doodh laaya`, `${name} ek gilaas doodh laaya`,
      'botal (bottle)', 'gilaas (glass)', `${name} brought milk`, 'different');
    add('classifier_measure', 'hi', `${name} ek gilaas paani piya`, `${name} ek botal paani piya`,
      'gilaas (glass)', 'botal (bottle)', `${name} drank water`, 'different');
  }
}

// ---------- politeness_relationship (hi + ko) ----------
{
  const actionsHi = [['madad ki', 'helped'], ['paisa diya', 'gave money'], ['bulaya', 'called'],
    ['khana khilaya', 'fed [the user]'], ['gift diya', 'gave a gift']];
  for (const [act, actGloss] of actionsHi) {
    for (const time of ['kal', 'aaj', 'abhi']) {
      add('politeness_relationship', 'hi', `${time} bhaiya ne ${act}`, `${time} yaar ne ${act}`,
        'bhaiya (respectful fictive elder)', 'yaar (casual peer)', `friend ${actGloss} ${time}`, 'different');
    }
  }
  const verbsKo = [['왔어', '오셨어요', 'came'], ['도와줬어', '도와주셨어요', 'helped'],
    ['갔어', '가셨어요', 'went'], ['전화했어', '전화하셨어요', 'called']];
  for (const [ban, hon, gloss] of verbsKo) {
    for (const t of KO_TIMES) {
      add('politeness_relationship', 'ko', `${t}친구가 ${ban}`, `${t}친구분이 ${hon}`,
        'banmal (informal speech level)', 'jondaetmal (honorific speech level)', `[my] friend ${gloss}`, 'different');
    }
  }
}

// ---------- spatial_temporal_deixis (hi) ----------
{
  for (const [name, loc] of cartesian(NAMES_M, CITIES.slice(0, 2))) {
    add('spatial_temporal_deixis', 'hi', `kal ${name} ${loc} gaya tha`, `kal ${name} ${loc} jayega`,
      'kal + past tense = yesterday', 'kal + future tense = tomorrow', `${name} went/will go to ${loc}`, 'different');
  }
  for (const obj of OBJECTS) {
    add('spatial_temporal_deixis', 'hi', `yeh ${obj} mera hai`, `woh ${obj} mera hai`,
      'yeh (near)', 'woh (far)', `this/that is my ${obj}`, 'different');
  }
}

const deduped = dedupe(records);
let n = 1;
const out = deduped.map(r => ({
  pair_id: `t1_${String(n++).padStart(4, '0')}`,
  language: r.language,
  distinction_class: r.distinction_class,
  utterance_a: r.utterance_a,
  utterance_b: r.utterance_b,
  distinction_value_a: r.distinction_value_a,
  distinction_value_b: r.distinction_value_b,
  english_gloss: r.english_gloss,
  gold_relation: r.gold_relation,
  source_type: 'template_generated',
}));

// ---------- hand-authored supplement ----------
// Hand-written pairs from hand_authored_candidates.jsonl, appended AFTER all template records so
// the template pair_ids above are unaffected. These are deliberately unlabeled: gold_relation is
// null (the relation is left entirely to annotators; no generation-time default is asserted).
{
  const supplementPath = path.join(__dirname, 'hand_authored_candidates.jsonl');
  const supplement = fs.readFileSync(supplementPath, 'utf8').split('\n').filter(l => l.trim()).map(JSON.parse);
  const seen = new Set(out.map(r => r.language + '|' + r.utterance_a + '|' + r.utterance_b));
  for (const r of supplement) {
    const key = r.language + '|' + r.utterance_a + '|' + r.utterance_b;
    if (seen.has(key)) throw new Error(`hand-authored pair duplicates an existing candidate: ${key}`);
    seen.add(key);
    out.push({
      pair_id: `t1_${String(n++).padStart(4, '0')}`,
      language: r.language,
      distinction_class: r.distinction_class,
      utterance_a: r.utterance_a,
      utterance_b: r.utterance_b,
      distinction_value_a: r.distinction_value_a,
      distinction_value_b: r.distinction_value_b,
      english_gloss: r.english_gloss,
      gold_relation: null,
      source_type: 'hand_authored',
    });
  }
}

const outPath = path.join(__dirname, 'candidates.jsonl');
fs.writeFileSync(outPath, out.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`wrote ${out.length} records (${deduped.length} template-generated from ${records.length} generated, ${records.length - deduped.length} duplicates dropped; ${out.length - deduped.length} hand-authored) to ${outPath}`);
