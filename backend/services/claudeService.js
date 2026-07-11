const { Anthropic } = require('@anthropic-ai/sdk');
const { buildSystemPrompt } = require('../utils/systemPrompt');
const { getCurrentMatchSummary, getMatchById } = require('./matchContextService');

/**
 * Call the Claude API with the system prompt containing match context.
 * Falls back to mock responses if CLAUDE_API_KEY is not set.
 * 
 * @param {string} userMessage - The query from the user.
 * @param {string} matchId - The active match ID.
 * @param {string} language - The user language preference.
 * @param {string} sentiment - The detected sentiment from query.
 * @returns {Promise<string>} The response from the LLM or mock fallback.
 */
async function callClaudeAPI(userMessage, matchId = 'fifa_2026_001', language = 'English', sentiment = 'neutral') {
  const apiKey = process.env.CLAUDE_API_KEY;
  const matchContext = getCurrentMatchSummary(matchId);
  let systemPrompt = buildSystemPrompt(matchContext);

  // Inject language instruction
  systemPrompt += `\n\nCRITICAL: You must respond in the following language: ${language}.`;
  
  // Inject sentiment instruction
  if (sentiment === 'celebratory') {
    systemPrompt += `\nUser Tone is HAPPY/EXCITED. Match their energy with a celebratory, enthusiastic response!`;
  } else if (sentiment === 'disappointed') {
    systemPrompt += `\nUser Tone is SAD/FRUSTRATED. Respond with a sympathetic, supportive, and balanced analytical tone.`;
  }

  if (!apiKey || apiKey.includes('your_anthropic') || apiKey === '') {
    console.warn("CLAUDE_API_KEY is not configured. Falling back to mock responses.");
    return generateMockResponse(userMessage, matchId, language, sentiment);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    if (response.content && response.content[0]) {
      return response.content[0].text;
    }
    throw new Error("Empty response from Anthropic API.");
  } catch (error) {
    console.error("Error calling Claude API:", error.message);
    throw error;
  }
}

/**
 * Smart translation dictionary for mock responses.
 */
const translations = {
  Spanish: {
    redirect: "Soy un asistente de operaciones del estadio de la FIFA. ¡Pregúntame sobre reglas, alineaciones o puntajes!",
    generic: "Actualmente estoy ayudando con el partido de la FIFA en el estadio. ¿En qué puedo ayudarte?",
    argentinaScore: "Argentina lidera actualmente a Australia 2-1 en el minuto 67 en el MetLife Stadium.",
    franceScore: "Francia lidera actualmente a Marruecos 1-0 en el minuto 43 en el SoFi Stadium.",
    messi: "Lionel Messi es el mediocampista ofensivo y capitán de Argentina (#10). ¡Marcó un golazo en el minuto 12!",
    mbappe: "Kylian Mbappé es el extremo izquierdo estrella de Francia (#10). ¡Marcó en el minuto 5 de tiro de rebote!",
    var: "El VAR revisa goles, penaltis, tarjetas rojas directas y errores de identidad. En este partido se utilizó para verificar jugadas clave.",
    formationArg: "Argentina juega con una formación 4-2-3-1, con Messi en el centro ofensivo y Alvarez como delantero.",
    formationFra: "Francia juega con una formación 4-3-3, con Mbappe, Giroud y Dembele en la delantera."
  },
  Hindi: {
    redirect: "मैं एक फीफा स्टेडियम सहायक हूं। कृपया मैच के नियमों, स्कोर या लाइनअप के बारे में पूछें!",
    generic: "मैं वर्तमान में स्टेडियम में लाइव मैच में सहायता कर रहा हूं। मैं आपकी क्या मदद कर सकता हूं?",
    argentinaScore: "अर्जेंटीना वर्तमान में मेटलाइफ स्टेडियम में 67वें मिनट में ऑस्ट्रेलिया से 2-1 से आगे चल रहा है।",
    franceScore: "फ्रांस वर्तमान में सोफी स्टेडियम में 43वें मिनट में मोरक्को से 1-0 से आगे चल रहा है।",
    messi: "लियोनेल मेसी अर्जेंटीना के कप्तान और #10 जर्सी के खिलाड़ी हैं। उन्होंने 12वें मिनट में शानदार गोल किया था!",
    mbappe: "काइलियन एम्बाप्पे फ्रांस के स्टार #10 विंगर हैं। उन्होंने मैच के 5वें मिनट में रिबाउंड गोल किया था!",
    var: "वीएआर गोल, पेनल्टी, सीधे लाल कार्ड और गलत पहचान के फैसलों की समीक्षा करता है।",
    formationArg: "अर्जेंटीना 4-2-3-1 फॉर्मेशन का उपयोग कर रहा है, जिसमें मेसी केंद्रीय भूमिका में हैं।",
    formationFra: "फ्रांस 4-3-3 फॉर्मेशन का उपयोग कर रहा है, जिसमें एम्बाप्पे, गिरौद और डेम्बेले आगे हैं।"
  },
  Arabic: {
    redirect: "أنا مساعد عمليات ملعب الفيفا. يرجى الاستفسار عن القواعد والتشكيلات والنتائج!",
    generic: "أنا هنا لمساعدتك في تفاصيل المباراة الجارية في الملعب. كيف يمكنني مساعدتك؟",
    argentinaScore: "تتقدم الأرجنتين حاليًا على أستراليا 2-1 في الدقيقة 67 في ملعب ميتلايف.",
    franceScore: "تتقدم فرنسا حاليًا على المغرب 1-0 في الدقيقة 43 في ملعب سوفي.",
    messi: "ليونيل ميسي هو صانع ألعاب وقائد الأرجنتين (#10). سجل هدفاً رائعاً في الدقيقة 12!",
    mbappe: "كيليان مبابي هو الجناح الأيسر لفرنسا (#10). سجل هدفاً في الدقيقة 5!",
    var: "يراجع حكم الفيديو المساعد (VAR) الأهداف، ركلات الجزاء، البطاقات الحمراء المباشرة وتحديد الهوية الخطأ.",
    formationArg: "تلعب الأرجنتين بخطة 4-2-3-1 مع ميسي في خط الوسط الهجومي.",
    formationFra: "تلعب فرنسا بخطة 4-3-3 مع مبابي وجيرو وديمبيلي في الهجوم."
  },
  Mandarin: {
    redirect: "我是国际足联球场运营助手。请咨询关于规则、阵容或比分的问题！",
    generic: "我正在球场为您提供现场比赛的实时协助。请问有什么我可以帮您的？",
    argentinaScore: "阿根廷目前在MetLife体育场第67分钟以2-1领先澳大利亚。",
    franceScore: "法国目前在SoFi体育场第43分钟以1-0领先摩洛哥。",
    messi: "里奥·梅西是阿根廷队的进攻核心和队长（10号）。他在第12分钟打入一记精彩远射！",
    mbappe: "基利安·姆巴佩是法国队的明星左翼（10号）。他在第5分钟补射破门！",
    var: "VAR审查进球、点球、直接红牌和判罚对象错误。本场比赛已用于检查关键判罚。",
    formationArg: "阿根廷今天采用4-2-3-1阵型，梅西担任前腰，梅西后面是阿尔瓦雷斯。",
    formationFra: "法国今天采用4-3-3阵型，由姆巴佩、吉鲁和登贝莱领衔锋线。"
  }
};

/**
 * Smart mock responses with localization and sentiment adapter.
 */
function generateMockResponse(query, matchId, language, sentiment) {
  const q = query.toLowerCase();
  const isArg = matchId === 'fifa_2026_001';
  const lang = language || 'English';
  
  // Handle localized responses if language is not English
  if (lang !== 'English' && translations[lang]) {
    const dict = translations[lang];
    if (q.includes('score') || q.includes('winning')) {
      return dict[isArg ? 'argentinaScore' : 'franceScore'];
    }
    if (q.includes('messi') && isArg) {
      return dict.messi;
    }
    if (q.includes('mbappe') && !isArg) {
      return dict.mbappe;
    }
    if (q.includes('var')) {
      return dict.var;
    }
    if (q.includes('formation')) {
      return dict[isArg ? 'formationArg' : 'formationFra'];
    }
    if (q.includes('pizza') || q.includes('weather') || q.includes('code')) {
      return dict.redirect;
    }
    return dict.generic;
  }

  // English Mock Responses with Sentiment adjustments
  let prefix = "";
  if (sentiment === 'celebratory') {
    prefix = "🎉 AMAZING! ";
  } else if (sentiment === 'disappointed') {
    prefix = "I understand the frustration. ";
  }

  // Question: VAR
  if (q.includes('var') || q.includes('video assistant')) {
    if (isArg) {
      return prefix + "VAR reviews goals, penalties, red cards, and identity errors. Today, it confirmed Alvarez's goal at the 34th minute after verifying offside.";
    } else {
      return prefix + "VAR checks major errors. Today it ruled out a potential Moroccan penalty at the 38th minute, confirming it was an accidental handball.";
    }
  }
  
  // Question: Messi
  if (q.includes('messi')) {
    if (isArg) {
      return prefix + "Lionel Messi (#10) is playing as central attacking midfielder (CAM) and captain for Argentina. He scored a glorious long-range goal in the 12th minute!";
    } else {
      return "Lionel Messi is not in this match. Today's match is France vs. Morocco. Let me know if you want information on Mbappe or Hakimi!";
    }
  }

  // Question: Mbappe
  if (q.includes('mbappe') || q.includes('mbappé')) {
    if (!isArg) {
      return prefix + "Kylian Mbappé (#10) is playing as left winger (LW) for France. He scored a quick rebound goal in the 5th minute to give France a 1-0 lead!";
    } else {
      return "Kylian Mbappe is not in this match. Today's match is Argentina vs. Australia. Let me know if you want information on Messi or Alvarez!";
    }
  }
  
  // Question: Formations
  if (q.includes('formation')) {
    if (isArg) {
      return prefix + "Argentina is using a 4-2-3-1 formation with Messi as CAM, while Australia is lining up in a 4-4-2 block.";
    } else {
      return prefix + "France is using a 4-3-3 attack formation, while Morocco is structured in a defensive 4-1-4-1 setup.";
    }
  }
  
  // Question: Disallowed goal / Offside
  if (q.includes('called back') || q.includes('disallowed') || q.includes('offside')) {
    if (isArg) {
      return prefix + "There were no called back goals in the Argentina match. Alvarez's 34' goal was checked by VAR and confirmed.";
    } else {
      return prefix + "There are no disallowed goals. Mbappe scored a clean goal at minute 5 to give France the lead.";
    }
  }

  // Question: Score
  if (q.includes('score') || q.includes('winning') || q.includes('minute')) {
    if (isArg) {
      return prefix + "Argentina is leading Australia 2-1 in the 67th minute here at MetLife Stadium.";
    } else {
      return prefix + "France is leading Morocco 1-0 in the 43rd minute here at SoFi Stadium.";
    }
  }

  // Redirect for off-topic
  if (q.includes('pizza') || q.includes('weather') || q.includes('code') || q.includes('programming')) {
    return "I am a FIFA stadium operations assistant focused on live match support. Please ask about match rules, team stats, lineups, or venue facilities!";
  }

  if (isArg) {
    return prefix + "We are watching Argentina vs. Australia live. Argentina leads 2-1 in the 67th minute. Ask me about Messi's goal or lineups!";
  } else {
    return prefix + "We are watching France vs. Morocco live. France leads 1-0 in the 43rd minute. Ask me about Mbappe's goal or Hakimi!";
  }
}

module.exports = {
  callClaudeAPI
};
