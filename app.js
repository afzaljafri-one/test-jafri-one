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
  'work', 'say', 'call', 'show'
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
  // Convert [text](url) to <a>
  let formatted = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Convert standalone URLs to <a>
  formatted = formatted.replace(/(?<!href=")(https?:\/\/[^\s\)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  return formatted;
}

function getButtonLabel(url) {
  if (url.includes("/zodiac")) return "✨ Explore Horoscope Readings";
  if (url.includes("kundli")) return "🔮 Open Kundli Report";
  if (url.includes("kundali-match")) return "💑 Check Marriage Compatibility";
  if (url.includes("sade-sati")) return "🪐 Open Sade Sati Calculator";
  if (url.includes("baby-names/lo-shu")) return "🔢 View Lo Shu Grid";
  if (url.includes("baby-names/profile")) return "👶 Enter Baby Birth Details";
  if (url.includes("baby-names")) return "👶 Explore Baby Names";
  if (url.includes("panchang")) return "📅 View Daily Panchang";
  if (url.includes("refund")) return "📄 Read Refund Policy";
  if (url.includes("terms")) return "⚖️ Terms & Support";
  if (url.includes("calculator/first-name")) return "🔤 Name Numerology Calculator";
  if (url.includes("calculator/moon-sign")) return "🌙 Moon Sign Calculator";
  return "Visit ZodiacBee Page";
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

  if (!searchEngine) {
    appendBotMessage(
      "The knowledge base is currently loading. Please try again in a moment.",
      ["https://zodiacbee.com"]
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
    // Intelligent Fallback with topic choices and clarification
    appendBotMessage(
      "I couldn't find a sufficiently relevant answer to that question in my knowledge base. Could you rephrase your question or choose a topic such as Vedic Astrology, Baby Names or ZodiacBee Support?",
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
    urls.forEach(url => {
      const label = getButtonLabel(url);
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
