/**
 * AskBee AI Chatbot Engine
 * Client-Side BM25 Retrieval Engine & UI Controller
 * Hosted on test.jafri.one (GitHub Pages)
 */

class BM25SearchEngine {
  constructor(documents) {
    this.documents = documents;
    this.docTokens = [];
    this.df = new Map();
    this.totalDocs = documents.length;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      // Weight question higher, include category and answer
      const text = `${doc.question} ${doc.question} ${doc.category} ${doc.answer}`;
      const tokens = this.tokenize(text);
      this.docTokens.push(tokens);
      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        this.df.set(t, (this.df.get(t) || 0) + 1);
      }
    }
    const totalLen = this.docTokens.reduce((acc, d) => acc + d.length, 0);
    this.avgDocLen = totalLen / Math.max(1, this.totalDocs);
  }

  tokenize(text) {
    const matches = text.match(/\w+/g) || [];
    return matches
      .map(w => w.toLowerCase())
      .filter(w => w.length > 1 || !isNaN(w));
  }

  search(query, topK = 3) {
    const qTokens = this.tokenize(query);
    if (qTokens.length === 0) return [];

    const k1 = 1.5;
    const b = 0.75;
    const queryLower = query.toLowerCase().trim();
    const scores = [];

    for (let idx = 0; idx < this.documents.length; idx++) {
      let score = 0;
      const dTokens = this.docTokens[idx];
      const dLen = dTokens.length;

      const dCounts = new Map();
      for (const t of dTokens) {
        dCounts.set(t, (dCounts.get(t) || 0) + 1);
      }

      // Exact phrase bonus
      const docQLower = this.documents[idx].question.toLowerCase();
      if (docQLower.includes(queryLower) || queryLower.includes(docQLower)) {
        score += 15.0;
      }

      for (const q of qTokens) {
        if (dCounts.has(q)) {
          const tf = dCounts.get(q);
          const dfVal = this.df.get(q) || 1;
          const idf = Math.log((this.totalDocs - dfVal + 0.5) / (dfVal + 0.5) + 1.0);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (dLen / this.avgDocLen));
          score += idf * (numerator / denominator);
        }
      }

      scores.push({ score, doc: this.documents[idx] });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.filter(s => s.score > 0).slice(0, topK).map(s => s.doc);
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

  // Simulate short conversational delay (250ms) for natural feel
  await new Promise(r => setTimeout(r, 250));

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
    const topMatch = results[0];
    const urls = results.map(r => r.url).filter(Boolean);
    const uniqueUrls = [...new Set(urls)].slice(0, 2);
    appendBotMessage(topMatch.answer, uniqueUrls);
  } else {
    appendBotMessage(
      "I couldn't find a direct match in our training database. You can explore our Vedic astrology reports, baby names tool, or contact customer@zodiacbee.com.",
      ["https://zodiacbee.com/vedic-wisdom", "https://zodiacbee.com/baby-names"]
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
