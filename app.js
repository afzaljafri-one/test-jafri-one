/**
 * AskBee AI Chatbot Engine
 * Calibrated Client-Side BM25 Retrieval Engine & UI Controller
 * Hosted on test.jafri.one (GitHub Pages)
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'under', 'and', 'or',
  'but', 'if', 'because', 'as', 'until', 'while', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them',
  'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
  'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'some', 'such', 'do', 'does', 'did', 'having', 'have', 'has', 'had',
  'please', 'tell', 'want', 'would', 'could', 'like'
]);

const CONVERSATIONAL_WORDS = new Set([
  'explain', 'know', 'find', 'make', 'check', 'read', 'mean',
  'get', 'give', 'see', 'look', 'ask', 'help', 'use', 'take',
  'work', 'say', 'call', 'show', 'today', 'tomorrow', 'yesterday'
]);

const CONTRACTIONS = {
  "what's": "what is",
  "how's": "how is",
  "can't": "cannot",
  "don't": "do not",
  "doesn't": "does not",
  "i'm": "i am",
  "i've": "i have",
  "i'd": "i would",
  "i'll": "i will",
  "it's": "it is",
  "didn't": "did not",
  "won't": "will not",
  "today's": "today",
  "tomorrow's": "tomorrow",
  "baby's": "baby",
  "saturn's": "saturn",
  "partner's": "partner"
};

const PRE_REPLACEMENTS = [
  [/\bjanm kundali\b|\bjanma kundali\b|\bjanampatri\b|\bjanmapatri\b/g, 'kundli'],
  [/\bmangal dosh\b|\bmanglik dosh\b|\bmangal dosha\b/g, 'manglik dosha'],
  [/\bkaal sarp dosh\b|\bkaal sarp dosha\b|\bkaalsarp\b|\bkalsarp\b|\bkal sarp\b/g, 'kaal sarp'],
  [/\bsadhesati\b|\bsadesati\b/g, 'sade sati'],
  [/\bbirth chart\b|\bnatal chart\b|\bhoroscope chart\b|\bbirthchart\b/g, 'kundli birth chart'],
  [/\bmarriage compatibility\b|\bmarital compatibility\b|\bkundli compatability\b|\bkundali match\b/g, 'kundali match compatibility'],
  [/\bmoney back\b/g, 'refund'],
  [/\bnewborn daughter\b|\bnewborn son\b|\bnewborn baby\b|\bmy baby\b/g, 'baby'],
  [/\bmake (my )?horoscope\b|\bcreate (my )?horoscope\b/g, 'generate kundli']
];

const WORD_TYPO_MAP = {
  'kundali': 'kundli',
  'compatability': 'compatibility',
  'horosocope': 'horoscope',
  'horoscop': 'horoscope',
  'numerlogy': 'numerology',
  'numorology': 'numerology',
  'nakshtra': 'nakshatra',
  'nakshatram': 'nakshatra',
  'nakshatras': 'nakshatra',
  'rasi': 'rashi',
  'raashi': 'rashi',
  'akshara': 'akshar',
  'weeding': 'wedding',
  'marraige': 'marriage',
  'marrage': 'marriage',
  'mahadasa': 'mahadasha',
  'antardasa': 'antardasha',
  'gemstones': 'gemstone',
  'stones': 'gemstone',
  'stone': 'gemstone',
  'remedies': 'remedy',
  'timings': 'time',
  'timing': 'time',
  'times': 'time',
  'names': 'name',
  'naming': 'name',
  'predictions': 'prediction',
  'predict': 'prediction'
};

function cleanTokens(text) {
  if (!text) return [];
  let lower = text.toLowerCase();
  for (const [c, exp] of Object.entries(CONTRACTIONS)) {
    lower = lower.replace(new RegExp(c, 'g'), exp);
  }
  for (const [pat, rep] of PRE_REPLACEMENTS) {
    lower = lower.replace(pat, rep);
  }
  const words = lower.match(/[a-z0-9]+/g) || [];
  const normalized = [];
  for (const w of words) {
    const norm = WORD_TYPO_MAP[w] || w;
    if (norm.length > 1 || !isNaN(norm)) {
      normalized.push(norm);
    }
  }
  return normalized;
}

function extractFeatures(tokens) {
  const meaningful = tokens.filter(t => !STOP_WORDS.has(t));
  const discriminative = meaningful.filter(t => !CONVERSATIONAL_WORDS.has(t));
  return [meaningful, discriminative];
}

const QUERY_INTENTS = [
  [/\bmake.*horoscope\b|\bgenerate.*horoscope\b/, ['generate', 'kundli']],
  [/\bdetails.*(kundli|birth chart)\b|\binformation.*(kundli|birth chart)\b/, ['information', 'need', 'create', 'kundli']],
  [/\bwhat does rashi mean\b|\bwhat is rashi\b/, ['what', 'rashi']],
  [/\b(find|what is).*(nakshatra)\b/, ['what', 'nakshatra']],
  [/\bsuggest.*name.*baby\b/, ['what', 'zodiac', 'bee', 'baby', 'name', 'tool']],
  [/\bcheck.*marriage.*compatibility\b/, ['check', 'marriage', 'compatibility']],
  [/\brunning sade sati\b|\bgoing through sade sati\b/, ['am', 'currently', 'going', 'through', 'sade', 'sati']],
  [/\bwhich letter is good for.*(baby|daughter|son)\b|\bletter.*good.*baby\b/, ['naming', 'syllable', 'akshar']],
  [/\brefund.*subscription\b|\bmoney back.*subscription\b/, ['refund', 'subscription']],
  [/\bsunrise and rahu kaal\b/, ['rahu', 'kaal', 'timing']],
  [/\bplanetary mahadasha cycles\b/, ['what', 'mahadasha']],
  [/\bread today'?s horoscope\b/, ['check', 'horoscope']],
  [/\bcheck my horosocope for tomorrow\b|\bhoroscope for tomorrow\b|\bread tomorrow.*horoscope\b/, ['read', 'tomorrow', 'horoscope']]
];

function expandQuery(rawQuery) {
  const queryLower = rawQuery.toLowerCase();
  const tokens = cleanTokens(rawQuery);
  const extraTokens = [];
  for (const [pat, expToks] of QUERY_INTENTS) {
    if (pat.test(queryLower)) {
      extraTokens.push(...expToks);
    }
  }
  if (tokens.includes('birth') && tokens.includes('chart')) {
    extraTokens.push('kundli');
  }
  if (tokens.includes('letter')) {
    extraTokens.push('akshar', 'syllable', 'letters');
  }
  if (tokens.includes('akshar')) {
    extraTokens.push('letter', 'letters', 'syllable', 'syllables');
  }
  if (tokens.includes('wedding')) {
    extraTokens.push('marriage', 'kundali', 'match');
  }
  if (tokens.includes('numerology') && tokens.includes('name')) {
    extraTokens.push('numerology', 'name');
  }
  return [...tokens, ...extraTokens];
}

class BM25SearchEngine {
  constructor(documents) {
    this.documents = documents;
    this.totalDocs = documents.length;
    this.docQTokens = [];
    this.docCatTokens = [];
    this.docATokens = [];
    this.docAllTokens = [];
    this.df = new Map();

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const qTok = cleanTokens(doc.question);
      const catTok = cleanTokens(doc.category || '');
      const aTok = cleanTokens(doc.answer);

      this.docQTokens.push(qTok);
      this.docCatTokens.push(catTok);
      this.docATokens.push(aTok);

      const allTok = [...qTok, ...catTok, ...aTok];
      this.docAllTokens.push(allTok);

      const uniqueTok = new Set(allTok);
      for (const t of uniqueTok) {
        this.df.set(t, (this.df.get(t) || 0) + 1);
      }
    }

    const totalLen = this.docAllTokens.reduce((acc, d) => acc + d.length, 0);
    this.avgDocLen = totalLen / Math.max(1, this.totalDocs);
  }

  search(rawQuery, topK = 3, minScore = 6.0) {
    const rawClean = cleanTokens(rawQuery);
    const [meaningfulQ, discQ] = extractFeatures(rawClean);

    if (meaningfulQ.length === 0) return [];

    const expanded = expandQuery(rawQuery);
    const k1 = 1.4;
    const b = 0.65;
    const rawQueryStr = rawClean.join(' ');
    const isTopicQuery = discQ.length <= 2 && rawClean.length <= 3;
    const candidates = [];

    for (let idx = 0; idx < this.documents.length; idx++) {
      const doc = this.documents[idx];
      const qTok = this.docQTokens[idx];
      const catTok = this.docCatTokens[idx];
      const aTok = this.docATokens[idx];
      const allTok = this.docAllTokens[idx];

      const allTokSet = new Set(allTok);
      const qCatSet = new Set([...qTok, ...catTok]);

      // --- COVERAGE GATING ---
      const checkTokens = discQ.length > 0 ? discQ : meaningfulQ;
      const matchedCheck = checkTokens.filter(t => allTokSet.has(t));
      const coverage = matchedCheck.length / checkTokens.length;

      if (checkTokens.length === 1) {
        if (coverage < 1.0 || !qCatSet.has(checkTokens[0])) continue;
      } else {
        if (coverage < 0.5) continue;
        const matchedInQCat = checkTokens.filter(t => qCatSet.has(t));
        if (matchedInQCat.length === 0) continue;
      }

      // Temporal modifier gating: queries with "tomorrow" must match docs with "tomorrow"
      if (rawClean.includes('tomorrow') && !allTokSet.has('tomorrow')) continue;
      // Queries with "today" shouldn't match docs specifically titled "tomorrow"
      if (rawClean.includes('today') && !rawClean.includes('tomorrow') && qTok.includes('tomorrow')) continue;

      // --- BM25 SCORING ---
      const docQStr = qTok.join(' ');
      const dLen = allTok.length;

      const qCounts = new Map();
      for (const t of qTok) qCounts.set(t, (qCounts.get(t) || 0) + 1);
      const catCounts = new Map();
      for (const t of catTok) catCounts.set(t, (catCounts.get(t) || 0) + 1);
      const aCounts = new Map();
      for (const t of aTok) aCounts.set(t, (aCounts.get(t) || 0) + 1);

      let score = 0.0;

      // Exact match bonus
      if (rawQueryStr === docQStr) {
        score += 40.0;
      } else if (rawQueryStr.includes(docQStr) || docQStr.includes(rawQueryStr)) {
        score += 15.0;
      }

      // Bigram bonus
      if (rawClean.length >= 2) {
        for (let i = 0; i < rawClean.length - 1; i++) {
          const bg = `${rawClean[i]} ${rawClean[i + 1]}`;
          if (docQStr.includes(bg)) {
            score += 8.0;
          }
        }
      }

      // Canonical definition boost for short topic queries
      if (isTopicQuery) {
        if (docQStr.startsWith('what is') || docQStr.startsWith('can i get a refund') || (rawQuery.toLowerCase().trim() === 'horoscope' && docQStr === 'check my horoscope')) {
          score += 25.0;
        }
      }

      // Specific Entity Check (Nakshatras, Zodiac signs, Planets)
      const entityCandidates = discQ.filter(t => (this.df.get(t) || 999) <= 5 && !['akshar', 'syllable', 'pada', 'dosha', 'chart'].includes(t));
      if (entityCandidates.length > 0) {
        if (entityCandidates.some(t => qTok.includes(t))) {
          score += 25.0;
        } else if (!entityCandidates.some(t => allTokSet.has(t))) {
          score *= 0.3;
        }
      }

      // Discount questions with specific unmentioned context (Diwali, twins, etc.)
      const unmentionedFilters = ['diwali', 'twins', 'festival', 'spiritual', 'argue', 'pronounce', 'c-section'];
      if (unmentionedFilters.some(w => qTok.includes(w) && !rawClean.includes(w))) {
        score *= 0.1;
      }

      // BM25 term weighting
      for (const t of expanded) {
        let w = 1.3;
        if (STOP_WORDS.has(t)) {
          w = 0.05;
        } else if (CONVERSATIONAL_WORDS.has(t)) {
          w = 0.3;
        }

        const tfQ = (qCounts.get(t) || 0) * 4.5;
        const tfCat = (catCounts.get(t) || 0) * 2.0;
        const tfA = (aCounts.get(t) || 0) * 1.0;
        const tf = tfQ + tfCat + tfA;

        if (tf > 0) {
          const dfVal = this.df.get(t) || 1;
          let idf = Math.log((this.totalDocs - dfVal + 0.5) / (dfVal + 0.5) + 1.0);
          if (idf < 0) idf = 0.1;
          const num = tf * (k1 + 1);
          const denom = tf + k1 * (1 - b + b * (dLen / this.avgDocLen));
          score += w * idf * (num / denom);
        }
      }

      // Question Precision boost
      const meaningfulInQ = qTok.filter(t => !STOP_WORDS.has(t) && !CONVERSATIONAL_WORDS.has(t));
      if (meaningfulInQ.length > 0) {
        const queryTermsSet = new Set([...rawClean, ...expanded]);
        const matchedInQ = meaningfulInQ.filter(t => queryTermsSet.has(t));
        const qPrecision = matchedInQ.length / meaningfulInQ.length;
        score *= (0.6 + 0.6 * qPrecision);
      }

      // Category alignment boost
      const meaningfulInCat = catTok.filter(t => !STOP_WORDS.has(t));
      if (checkTokens.some(t => meaningfulInCat.includes(t))) {
        score *= 1.15;
      }

      if (score >= minScore) {
        candidates.push({ score, doc });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, topK);
  }
}

// 1. Critical Crisis & Suicide Prevention Safety Handler (Highest Priority)
function checkCrisisSafety(rawQuery) {
  if (!rawQuery) return null;
  const raw = rawQuery.trim();

  // Normalize query and expand common contractions
  let clean = raw.toLowerCase();
  const contractions = {
    "what's": "what is",
    "whats": "what is",
    "where's": "where is",
    "wheres": "where is",
    "how's": "how is",
    "hows": "how is",
    "don't": "do not",
    "dont": "do not",
    "doesn't": "does not",
    "doesnt": "does not",
    "can't": "cannot",
    "cant": "cannot",
    "won't": "will not",
    "wont": "will not",
    "i'm": "i am",
    "im": "i am",
    "i've": "i have",
    "i'll": "i will"
  };
  for (const [k, v] of Object.entries(contractions)) {
    clean = clean.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }
  clean = clean.replace(/[?!.,'’"“”]/g, ' ').replace(/\s+/g, ' ').trim();

  // A. Educational / Helpline Inquiries
  // Distinctly separated from personal crisis per requirement
  const isEdu =
    /\b(what\s+is|tell\s+me|find|how\s+to\s+contact|who\s+can\s+i\s+call|number|hotline|helpline|phone)\b/i.test(clean) &&
    /\b(suicide|crisis\s+(helpline|hotline|number)|988)\b/i.test(clean) &&
    !/\b(i\s+want\s+to|i\s+am\s+going\s+to|i\s+might|my\s+friend|my\s+daughter|my\s+son|kill\s+myself|hurt\s+myself|end\s+my\s+life|commit\s+suicide)\b/i.test(clean);

  if (isEdu) {
    if (/\b(us|united\s+states|usa|america)\b/i.test(clean)) {
      return {
        answer: "In the **United States**, the Suicide & Crisis Lifeline is **988**.\n\n- **Call or Text**: **988** (available 24/7, toll-free, and confidential across the US).\n- **Online Chat**: Available 24/7 at [988lifeline.org](https://988lifeline.org/).\n- **Immediate Danger**: If someone is in immediate danger or requires urgent medical attention, call **911** or go to the nearest emergency department immediately.",
        urls: [
          { url: "tel:988", label: "Call or Text 988 — US" },
          { url: "https://988lifeline.org/", label: "Chat with 988 — US" }
        ]
      };
    }
    if (/\b(canada|canadian|ca)\b/i.test(clean)) {
      return {
        answer: "In **Canada**, the Suicide Crisis Helpline is **988**.\n\n- **Call or Text**: **988** (available 24/7, toll-free, in English and French across all provinces and territories).\n- **Official Website**: [988.ca](https://988.ca/).\n- **Immediate Danger**: If someone is in immediate danger or needs urgent care, call **911** or visit your nearest emergency department immediately.",
        urls: [
          { url: "tel:988", label: "Call or Text 988 — Canada" },
          { url: "https://988.ca/", label: "Visit 988 Canada" }
        ]
      };
    }
    // General Educational Helpline Info (both US & Canada + international guidance)
    return {
      answer: "If you or someone you know is looking for suicide prevention or crisis support, free, 24/7 confidential helplines are available:\n\n- **United States**: Call or text **988**, or chat online at [988lifeline.org](https://988lifeline.org/).\n- **Canada**: Call or text **988**, or visit [988.ca](https://988.ca/).\n- **Other Countries**: Please contact your local emergency services (such as 112 in the UK/Europe, 000 in Australia) or your national crisis helpline.\n- **Immediate Danger**: Call your local emergency number (such as 911) or visit the nearest emergency room.",
      urls: [
        { url: "tel:988", label: "Call or Text 988 — US" },
        { url: "https://988lifeline.org/", label: "Chat with 988 — US" },
        { url: "tel:988", label: "Call or Text 988 — Canada" },
        { url: "https://988.ca/", label: "Visit 988 Canada" }
      ]
    };
  }

  // B. Third-Party Crisis Statements (Concern for a friend, child, loved one)
  const thirdPartyPattern = /\b(my\s+(friend|daughter|son|brother|sister|mother|father|mom|dad|partner|husband|wife|cousin|child|colleague|roommate)|someone\s+i\s+know|a\s+friend\s+of\s+mine|someone|anybody)\b.*\b(suicide|suicidal|kill\s+(himself|herself|themselves|themself)|end\s+(his|her|their)\s+life|hurt\s+(himself|herself|themselves|themself)|harm\s+(himself|herself|themselves|themself)|take\s+(his|her|their)\s+(own\s+)?life|wants\s+to\s+die)\b/i;

  if (thirdPartyPattern.test(clean)) {
    return {
      answer: "Thank you for reaching out and caring. Supporting someone who is thinking about suicide can be deeply concerning, but you don't have to carry this alone.\n\n**If they are in immediate danger:**\n- Stay with the person if it is safe to do so.\n- Remove access to any means of self-harm.\n- Involve another trusted family member, guardian, or healthcare professional immediately.\n- Call your local emergency number (such as **911** in the US and Canada) or accompany them to the nearest hospital emergency room.\n\n**Free, 24/7 Crisis Support (For Both You and Them):**\nCrisis counsellors are trained to support people in crisis as well as friends and family members:\n- **United States**: Call or text **988**, or chat online at [988lifeline.org](https://988lifeline.org/).\n- **Canada**: Call or text **988**, or visit [988.ca](https://988.ca/).\n- **Other Countries**: Please contact your local emergency services or national crisis helpline.",
      urls: [
        { url: "tel:988", label: "Call or Text 988 — US" },
        { url: "https://988lifeline.org/", label: "Chat with 988 — US" },
        { url: "tel:988", label: "Call or Text 988 — Canada" },
        { url: "https://988.ca/", label: "Visit 988 Canada" }
      ]
    };
  }

  // C. Personal Crisis Statements (Suicidal thoughts, intent, or self-harm)
  const personalCrisisPatterns = [
    /\b(suicide|suicidal)\b/i,
    /\b(kill|killing|murder)\s+myself\b/i,
    /\b(hurt|hurting|harm|harming|injure|injuring|cut|cutting)\s+myself\b/i,
    /\b(take|taking|end|ending)\s+my\s+(own\s+)?life\b/i,
    /\b(end|ending)\s+it\s+all\b/i,
    /\b(want|wish|wanna|going)\s+to\s+die\b/i,
    /\b(wish|wished)\s+i\s+(were|was)\s+dead\b/i,
    /\b(better\s+off|rather\s+be)\s+dead\b/i,
    /\b(do\s+not|dont)\s+want\s+to\s+live(\s+anymore)?\b/i,
    /\btired\s+of\s+living\b/i,
    /\bno\s+(reason|point|purpose)\s+(to\s+live|in\s+living|living)\b/i,
    /\b(cannot|can\s*t)\s+(go\s+on|take\s+this|continue|handle\s+this)(\s+anymore)?\b/i,
    /\bhopeless\s+and\s+(cannot|can\s*t)\s+go\s+on\b/i,
    /\b(want|wish)\s+to\s+(disappear\s+forever|vanish\s+forever|sleep\s+forever|never\s+wake\s+up)\b/i
  ];

  const isPersonalCrisis = personalCrisisPatterns.some(pattern => pattern.test(clean));

  if (isPersonalCrisis) {
    return {
      answer: "I'm really sorry you're going through something this painful. Thank you for telling me. You don't have to face this alone, and I'm glad you reached out.\n\nIf you are thinking about suicide or feel you might hurt yourself, please connect with a trained crisis counsellor now. They are there to listen without judging you.\n\n**Are you in immediate danger right now, or have you already hurt yourself?**\nIf you might act on these thoughts now, have seriously harmed yourself, or cannot keep yourself safe, please call your local emergency number (such as **911** in the US and Canada) or go to the nearest emergency department immediately. If possible, move near someone you trust and ask them to stay with you.\n\n**Free, 24/7 Confidential Crisis Support:**\n- **United States**: Call or text **988**, or chat at [988lifeline.org](https://988lifeline.org/).\n- **Canada**: Call or text **988**, or visit [988.ca](https://988.ca/).\n- **Other Countries**: Please contact your local emergency services (such as 112 in the UK/Europe, 000 in Australia, or your national helpline). If you let me know which country you are in, I can help share your country's crisis support contact.",
      urls: [
        { url: "tel:988", label: "Call or Text 988 — US" },
        { url: "https://988lifeline.org/", label: "Chat with 988 — US" },
        { url: "tel:988", label: "Call or Text 988 — Canada" },
        { url: "https://988.ca/", label: "Visit 988 Canada" }
      ]
    };
  }

  return null;
}

// 2. Explicit Intent Handler (Identity, Name & Date)
function checkExplicitIntent(rawQuery) {
  const q = rawQuery.trim().toLowerCase().replace(/[?!.,'’]/g, '');

  // 1. Identity / Bot Name Queries
  if (
    /^(what\s+is\s+your\s+name|whats\s+your\s+name|what\s+is\s+ur\s+name|your\s+name)$/i.test(q)
  ) {
    return {
      answer: "I'm **AskBee**, your astrology guide and ZodiacBee companion. How can I help you explore your horoscope, birth chart, or baby names today?",
      urls: [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/terms"
      ]
    };
  }

  if (
    /^(who\s+are\s+you|what\s+are\s+you|tell\s+me\s+about\s+yourself|who\s+r\s+u|introduce\s+yourself)$/i.test(q)
  ) {
    return {
      answer: "I'm **AskBee**, an AI astrology guide and companion for [zodiacbee.com](https://zodiacbee.com). I help you explore Vedic astrology concepts—such as your Kundli birth chart, Rashi, Nakshatra, marriage compatibility, daily Panchang, and celestial baby name recommendations. How can I assist you today?",
      urls: [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/terms"
      ]
    };
  }

  // 2. User's Own Name Queries: "What is my name?", "What's my name?", "Tell me my name", "Can you tell me my name?", "Do you know my name?"
  if (
    /^(what\s+is\s+my\s+name|whats\s+my\s+name|tell\s+me\s+my\s+name|can\s+you\s+tell\s+me\s+my\s+name|could\s+you\s+tell\s+me\s+my\s+name|do\s+you\s+know\s+my\s+name)$/i.test(q)
  ) {
    return {
      answer: "I don't know your name yet unless you share it with me here! Feel free to tell me your name, or let me know if you would like to explore:\n- **Name Numerology**: Calculate your name number and its Vedic influence.\n- **Baby Names**: Explore celestial names matching a birth chart.\n- **Naming Syllables (Akshar)**: Find starting sounds for your Nakshatra.",
      urls: [
        "https://zodiacbee.com/calculator/first-name",
        "https://zodiacbee.com/baby-names"
      ]
    };
  }

  // 3. Ambiguous Short Query: "my name"
  if (/^my\s+name$/i.test(q) || /^about\s+my\s+name$/i.test(q)) {
    return {
      answer: "What would you like to know about your name? You can explore:\n- **Name Numerology**: How your name's numbers influence your life.\n- **Baby Names**: Finding lucky names based on birth Nakshatra and Moon sign.\n- **Naming Syllable (Akshar)**: Which starting letter matches your birth chart.\n\nCould you clarify which topic you would like to explore?",
      urls: [
        "https://zodiacbee.com/calculator/first-name",
        "https://zodiacbee.com/baby-names"
      ]
    };
  }

  // 4. Ambiguous Single-Word Query: "name" or "names"
  if (/^(name|names)$/i.test(q)) {
    return {
      answer: "Could you please clarify your question about names? For example, are you looking for:\n1. **Baby Name Suggestions** based on Vedic astrology\n2. **Name Numerology** and your name number\n3. **Naming Syllables (Akshar)** for a specific Nakshatra?",
      urls: [
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/calculator/first-name"
      ]
    };
  }

  // 5. "What does my name mean?"
  if (/^what\s+does\s+my\s+name\s+mean$/i.test(q) || /^meaning\s+of\s+my\s+name$/i.test(q)) {
    return {
      answer: "I don't have a personal dictionary of every name's meaning in my knowledge base. However, if you are looking for name numerology or baby names with auspicious spiritual and celestial meanings, I can guide you! Would you like to check Name Numerology or explore meaningful baby names?",
      urls: [
        "https://zodiacbee.com/calculator/first-name",
        "https://zodiacbee.com/baby-names"
      ]
    };
  }

  // 6. Current Date Queries: "What is today's date?", "What is the date today?", "Today's date", "What day is it today?"
  if (
    /^(what\s+is\s+today'?s\s+date|what\s+is\s+the\s+date\s+today|today'?s\s+date|what\s+day\s+is\s+it\s+today|date\s+today|current\s+date|what\s+is\s+the\s+current\s+date)$/i.test(q)
  ) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    return {
      answer: `Today's date is **${dateStr}**.\n\nIf you are looking for today's Vedic astrology timings (such as daily Panchang, Tithi, Nakshatra, or Rahu Kaal), you can explore our Panchang report:`,
      urls: [
        "https://zodiacbee.com/vedic-wisdom/panchang",
        "https://zodiacbee.com/vedic-wisdom"
      ]
    };
  }

  return null;
}

// 3. Service Discovery & Platform Guidance Intent Handler
function getServicesOverview(rawQuery) {
  if (!rawQuery) return null;
  const raw = rawQuery.trim();

  let clean = raw.toLowerCase();
  const contractions = {
    "what's": "what is",
    "whats": "what is",
    "where's": "where is",
    "wheres": "where is",
    "how's": "how is",
    "hows": "how is"
  };
  for (const [k, v] of Object.entries(contractions)) {
    clean = clean.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
  }
  clean = clean.replace(/[?!.,'’"“”]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Difference between Vedic and Western Astrology
  if (
    /\b(difference\s+between\s+(vedic|jyotish)\s+and\s+western|difference\s+between\s+western\s+and\s+(vedic|jyotish)|vedic\s+vs\s+western|western\s+vs\s+vedic)\b/i.test(clean)
  ) {
    return {
      answer: "While both systems offer profound cosmic guidance, Vedic and Western astrology differ in three fundamental ways:\n\n1. **Zodiac System (Sidereal vs. Tropical)**:\n   - **Vedic Astrology (Jyotish)** uses the **Sidereal zodiac**, aligned with the actual observable constellations in the sky and accounting for the Earth's axial precession (*Ayanamsha*).\n   - **Western Astrology** uses the **Tropical zodiac**, fixed to the Earth's seasons beginning at the Spring Equinox (0° Aries).\n\n2. **Core Focal Point (Moon vs. Sun)**:\n   - **Vedic Astrology** centers primarily on your **Moon Sign (Chandra Rashi)**, Rising Sign (Lagna), and the 27 lunar mansions (**Nakshatras**), revealing your inner emotional mind and karmic pattern.\n   - **Western Astrology** centers primarily on your **Sun Sign**, highlighting external personality and conscious identity.\n\n3. **Predictive Methods & Timing**:\n   - **Vedic Astrology** uses the planetary **Dasha system** (such as Vimshottari Mahadasha) and divisional charts (Vargas) to time life events with precision, accompanied by Vedic remedies.\n   - **Western Astrology** relies on planetary transits, secondary progressions, and aspect geometry.\n\nZodiacBee offers both! Explore your Sidereal Kundli under Vedic Wisdom, or read your Tropical forecasts in our Horoscopes section.",
      urls: [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/zodiac"
      ]
    };
  }

  // 2. Specific Service: Tarot Lounge
  if (
    /\b(can\s+i\s+use\s+tarot|tarot\s+on\s+zodiacbee|tell\s+me\s+about\s+tarot|what\s+is\s+tarot\s+lounge|tarot\s+reading\s+available|do\s+you\s+have\s+tarot|tarot\s+card\s+reading)\b/i.test(clean)
  ) {
    return {
      answer: "Yes! ZodiacBee features an interactive **Tarot Lounge** designed for intuitive guidance and clarity.\n\nIn the Tarot Lounge, you can:\n- **Daily Guidance**: Draw cards for daily reflection and mindfulness.\n- **Love & Relationships**: Gain cosmic perspectives on relationship dynamics, harmony, and future paths.\n- **Career & Decisions**: Seek intuitive insight for major life decisions and personal growth.\n\nEach reading provides deep, grounded interpretations to help you navigate your journey with confidence.",
      urls: [
        "https://zodiacbee.com/tarot"
      ]
    };
  }

  // 3. Specific Service: Astrology Reports Available
  if (
    /\b(what\s+(astrology\s+)?reports?\s+(are\s+available|can\s+i\s+generate|do\s+you\s+(offer|provide|have))|astrology\s+reports?\s+available|available\s+reports?)\b/i.test(clean)
  ) {
    return {
      answer: "ZodiacBee offers a comprehensive suite of personalized Vedic and Western astrology reports:\n\n- **Natal Chart Report**: Detailed psychological and cosmic blueprint of your birth chart, planetary houses, and aspects.\n- **Synastry Chart Report**: In-depth relationship compatibility report comparing two birth charts for romantic or partnership synergy.\n- **Transit Chart Report**: Tracks current planetary transits against your natal placements to navigate upcoming phases.\n- **Vedic Kundli & Dosha Reports**: Complete birth chart analysis covering Sade Sati, Manglik Dosha, Kaal Sarp Dosha, and Mahadasha cycles.\n- **Daily Panchang Report**: Daily Vedic almanac featuring Tithi, Nakshatra, Yoga, Karana, and auspicious timings.\n- **Yearly & Monthly Horoscopes**: In-depth predictive forecasts for career, finance, and love.",
      urls: [
        "https://zodiacbee.com/reports",
        "https://zodiacbee.com/vedic-wisdom"
      ]
    };
  }

  // 4. Specific Service: Where to Find Baby Names
  if (
    /\b(where\s+(can\s+i\s+find|are)\s+baby\s+names|how\s+(do|can)\s+i\s+find\s+baby\s+names|baby\s+names\s+on\s+zodiacbee)\b/i.test(clean)
  ) {
    return {
      answer: "You can discover personalized celestial baby names in ZodiacBee's **Baby Names** section:\n\n- **Nakshatra Naming Syllables (Akshar)**: Discover auspicious first letters and syllables based on the baby's birth star and Pada.\n- **Lo Shu Numerology Grid**: Check name vibrations and balance missing elements in the birth chart.\n- **Curated Collections**: Browse thousands of boy, girl, and unisex names filtered by meaning, origin, and cosmic elements.\n- **Personalized Baby Profile**: Enter birth date, time, and city to receive customized name suggestions aligned with their Kundli.",
      urls: [
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/baby-names/lo-shu"
      ]
    };
  }

  // 5. Specific Service: Pricing & Subscriptions
  if (
    /\b(how\s+do\s+i\s+see\s+(your\s+)?pricing|what\s+is\s+(your\s+)?pricing|how\s+much\s+does\s+it\s+cost|pricing\s+on\s+zodiacbee|subscription\s+cost|see\s+pricing)\b/i.test(clean)
  ) {
    return {
      answer: "You can view complete pricing, credit packages, and subscription options on the **Pricing & Plans** page:\n\n- **Free Tools & Forecasts**: Enjoy free daily horoscopes, basic birth charts, and initial calculators anytime.\n- **Pay-As-You-Go Credits**: Purchase credit packs to generate comprehensive in-depth reports (such as Natal, Synastry, or Sade Sati reports) or extended AskBee conversations.\n- **Subscription Plans**: Access ongoing astrological insights, regular report updates, and premium features.",
      urls: [
        "https://zodiacbee.com/pricing"
      ]
    };
  }

  // 6. Broad Service Overview
  const broadServicePatterns = [
    /\bwhat\s+(all\s+)?do\s+you\s+offer\b/i,
    /\bwhat\s+services?\s+do\s+you\s+(provide|offer|have)\b/i,
    /\bwhat\s+services?\s+does\s+zodiacbee\s+(provide|offer|have)\b/i,
    /\bwhat\s+(astrology\s+)?services?\s+do\s+you\s+(provide|offer)\b/i,
    /\bwhat\s+can\s+i\s+do\s+(on\s+zodiacbee|here)\b/i,
    /\btell\s+me\s+about\s+(zodiacbee|your\s+services?|the\s+platform)\b/i,
    /\bwhat\s+is\s+available\s+on\s+(your\s+platform|zodiacbee)\b/i,
    /\bwhat\s+can\s+you\s+help\s+me\s+with\b/i,
    /\bwhat\s+are\s+your\s+features\b/i,
    /\bwhat\s+does\s+zodiacbee\s+offer\b/i,
    /\bwhat\s+are\s+your\s+services\b/i
  ];

  if (broadServicePatterns.some(p => p.test(clean))) {
    return {
      answer: "ZodiacBee brings together astrology, tarot, and personalized cosmic experiences in one place. Here's what you can explore:\n\n- **🔮 Vedic Wisdom & Kundli**: Generate your full Vedic birth chart (Kundli), check Kundali Milan for marriage compatibility, view daily Panchang (Tithi, Nakshatra, Rahu Kaal), and analyze Sade Sati, Manglik Dosha, Kaal Sarp Dosha, and Mahadasha cycles with remedies.\n- **🃏 Tarot Lounge**: Draw cards for intuitive guidance on daily dilemmas, love and relationships, or career pathways with interactive spreads.\n- **✨ Zodiac & Western Horoscopes**: Explore daily, weekly, monthly, and yearly horoscope predictions for all 12 zodiac signs, plus 7-day forecasts and sign traits.\n- **👶 Celestial Baby Names**: Discover auspicious baby names aligned with your child's birth chart, Nakshatra naming syllables (Akshar), and Lo Shu numerology.\n- **📊 In-Depth Astrology Reports**: Access personalized comprehensive reports including Natal Chart, Synastry Relationship Compatibility, and Planetary Transits.\n- **🔢 Calculators & Numerology**: Instant tools including Name Numerology, Moon Sign Calculator, and Lo Shu grid.\n- **💳 Pricing & Subscriptions**: Transparent credit bundles and plans to unlock detailed reports and premium guidance.",
      urls: [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/tarot",
        "https://zodiacbee.com/zodiac",
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/reports",
        "https://zodiacbee.com/pricing"
      ]
    };
  }

  return null;
}

// UI Controller
let searchEngine = null;
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');

// Load Knowledge Base
async function initKnowledgeBase() {
  try {
    const resp = await fetch('./knowledge_base.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    searchEngine = new BM25SearchEngine(data);
    console.log(`✨ AskBee Knowledge Base loaded successfully: ${data.length} Q&As.`);
  } catch (err) {
    console.error("Failed to load knowledge_base.json:", err);
  }
}

function sendQuick(text) {
  if (!userInput) return;
  userInput.value = text;
  handleSend(new Event('submit'));
}

function formatTextWithLinks(text) {
  // Convert markdown bold **text** to <strong>text</strong>
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Convert [text](url) to <a>
  formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Convert standalone URLs to <a>
  formatted = formatted.replace(/(?<!href=")(https?:\/\/[^\s\)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function getButtonLabel(item) {
  if (!item) return "✨ Visit ZodiacBee";
  if (typeof item === 'object' && item.label) return item.label;
  const cleanUrl = (typeof item === 'object' ? item.url : item).trim();

  // 1. Suicide Prevention & Crisis Lines (Part B Safety)
  if (cleanUrl.includes("988lifeline.org")) return "Chat with 988 — US";
  if (cleanUrl.includes("988.ca")) return "Visit 988 Canada";
  if (cleanUrl.includes("country=ca")) return "Call or Text 988 — Canada";
  if (cleanUrl.includes("country=us") || cleanUrl.startsWith("tel:988")) return "Call or Text 988 — US";

  // 2. Specific Calculators & Tools
  if (cleanUrl.includes("/calculator/first-name")) return "🔤 Name Numerology Calculator";
  if (cleanUrl.includes("/calculator/moon-sign")) return "🌙 Moon Sign Calculator";

  // 3. Baby Names Section
  if (cleanUrl.includes("/baby-names/lo-shu")) return "🔢 View Lo Shu Grid";
  if (cleanUrl.includes("/baby-names/profile")) return "👶 Enter Baby Birth Details";
  if (cleanUrl.includes("/baby-names")) return "👶 Baby Names";

  // 4. Tarot Lounge
  if (cleanUrl.includes("/tarot")) return "🃏 Tarot Lounge";

  // 5. Astrology Reports
  if (cleanUrl.includes("/reports/natal-chart")) return "📊 Natal Chart Report";
  if (cleanUrl.includes("/reports/synastry-chart")) return "💑 Synastry Chart Report";
  if (cleanUrl.includes("/reports/transit-chart")) return "🪐 Transit Chart Report";
  if (cleanUrl.includes("/reports")) return "📊 Astrology Reports";

  // 6. Pricing & Plans
  if (cleanUrl.includes("/pricing")) return "💳 Pricing & Plans";

  // 7. Vedic Wisdom Specific Reports
  if (cleanUrl.includes("/vedic-wisdom/kundali-match")) return "💑 Check Marriage Compatibility";
  if (cleanUrl.includes("/vedic-wisdom/kundli")) return "🔮 Open Kundli Report";
  if (cleanUrl.includes("/vedic-wisdom/sade-sati")) return "🪐 Open Sade Sati Calculator";
  if (cleanUrl.includes("/vedic-wisdom/panchang")) return "📅 View Daily Panchang";
  if (cleanUrl.includes("/vedic-wisdom/Manglik-Dosha") || cleanUrl.includes("manglik")) return "🔥 Check Manglik Dosha";
  if (cleanUrl.includes("/vedic-wisdom/kaal-sarp-dosha")) return "🐍 Kaal Sarp Dosha Report";
  if (cleanUrl.includes("/vedic-wisdom/mahadasha")) return "⏳ Mahadasha Planetary Cycles";
  if (cleanUrl.includes("/vedic-wisdom/pitra-dosha")) return "🕊️ Pitra Dosha Guide";
  if (cleanUrl.includes("/vedic-wisdom")) return "🔮 Vedic Wisdom";

  // 8. Terms of Use & Policies (accurately labeled per destination)
  if (cleanUrl.includes("/refund-policy") || cleanUrl.includes("refund")) return "📄 Read Refund Policy";
  if (cleanUrl.includes("/privacy")) return "🔒 Privacy Policy";
  if (cleanUrl.includes("/terms")) return "⚖️ Terms of Use";

  // 9. Horoscope / Zodiac Page (Must match pathname /zodiac, NOT domain zodiacbee.com)
  if (/\/zodiac(\/|\?|#|$)/.test(cleanUrl)) return "✨ Explore Horoscope Readings";

  return "✨ Visit ZodiacBee";
}

async function handleSend(e) {
  if (e) e.preventDefault();
  const query = userInput.value.trim();
  if (!query) return;

  // Append user message
  appendMessage(query, 'user-msg');
  userInput.value = '';

  // Append typing indicator
  const typingElem = document.createElement('div');
  typingElem.className = 'message bot-msg typing';
  typingElem.id = 'typingIndicator';
  typingElem.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  chatMessages.appendChild(typingElem);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Natural conversational delay (220ms)
  await new Promise(r => setTimeout(r, 220));

  typingElem.remove();

  // 1. Critical Crisis & Suicide Prevention Safety Check (Highest Priority — Runs before ANY other intent or BM25)
  const crisis = checkCrisisSafety(query);
  if (crisis) {
    appendBotMessage(crisis.answer, crisis.urls);
    return;
  }

  // 2. Explicit Identity & Clarification Intent Check
  const explicit = checkExplicitIntent(query);
  if (explicit) {
    appendBotMessage(explicit.answer, explicit.urls);
    return;
  }

  // 3. Service Discovery & Platform Guidance Intent Check
  const service = getServicesOverview(query);
  if (service) {
    appendBotMessage(service.answer, service.urls);
    return;
  }

  // 4. BM25 Knowledge Base Search
  if (!searchEngine) {
    appendBotMessage(
      "The knowledge base is currently loading. Please try again in a moment.",
      [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/terms"
      ]
    );
    return;
  }

  const results = searchEngine.search(query, 2);

  if (results && results.length > 0) {
    const topMatch = results[0].doc;
    const urls = results.map(r => r.doc.url).filter(Boolean);
    const uniqueUrls = [...new Set(urls)].slice(0, 2);
    appendBotMessage(topMatch.answer, uniqueUrls);
  } else {
    // 5. Intelligent Fallback with topic choices and clarification
    appendBotMessage(
      "I couldn't find a sufficiently relevant answer to that question in my knowledge base. Could you rephrase your question or choose a topic such as Vedic Wisdom, Baby Names or Terms of Use?",
      [
        "https://zodiacbee.com/vedic-wisdom",
        "https://zodiacbee.com/baby-names",
        "https://zodiacbee.com/terms"
      ]
    );
  }
}

function appendMessage(text, className) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${className}`;
  msgDiv.innerText = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotMessage(answer, urls) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message bot-msg';

  let html = formatTextWithLinks(answer);

  if (urls && urls.length > 0) {
    html += '<div class="link-buttons">';
    urls.forEach(item => {
      const url = typeof item === 'object' ? item.url : item;
      const label = (typeof item === 'object' && item.label) ? item.label : getButtonLabel(item);
      html += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="action-btn">
        <span>${label}</span>
        <span>&rarr;</span>
      </a>`;
    });
    html += '</div>';
  }

  msgDiv.innerHTML = html;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initKnowledgeBase();
});
