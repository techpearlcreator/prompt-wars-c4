const { Anthropic } = require('@anthropic-ai/sdk');
const { buildSystemPrompt } = require('../utils/systemPrompt');
const { getCurrentMatchSummary } = require('./matchContextService');
const { retrieveVenueContext } = require('./ragService');
const { getQueueStatusSummary } = require('./commerceService');
const { searchFoundPerson } = require('./reconnectionService');

/**
 * Call the Claude API with the system prompt containing match, venue, and queue context.
 * Falls back to mock responses if CLAUDE_API_KEY is not set.
 */
async function callClaudeAPI(userMessage, matchId = 'fifa_2026_001', language = 'English', sentiment = 'neutral') {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  const matchContext = getCurrentMatchSummary(matchId);
  const venueContext = retrieveVenueContext(matchId, userMessage);
  const queueContext = getQueueStatusSummary(matchId);
  
  let systemPrompt = buildSystemPrompt(matchContext);
  
  if (venueContext) {
    systemPrompt += `\n\n${venueContext}`;
  }

  if (queueContext) {
    systemPrompt += `\n\n${queueContext}`;
  }

  systemPrompt += `\n\nCRITICAL: You must respond in the following language: ${language}.`;
  
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
    formationFra: "Francia juega con una formación 4-3-3, con Mbappe, Giroud y Dembele en la delantera.",
    restroomsMetLife: "Los baños accesibles en MetLife Stadium están en las secciones 104, 117, 128, 143. Cerca de la Puerta C, hay baños al lado de las secciones 112 y 114.",
    restroomsSoFi: "Los baños accesibles en SoFi Stadium están en las secciones 102, 118, 203, 219. Cerca del YouTube Theater, están al lado de las secciones 106 y 108.",
    elevatorsMetLife: "Los ascensores en MetLife Stadium están en el vestíbulo oeste (sección 112), vestíbulo este (sección 134) y la puerta Pepsi (sección 124).",
    elevatorsSoFi: "Los ascensores en SoFi Stadium están en el vestíbulo VIP (sección 104), entrada norte (sección 122) y entrada sur (sección 140)."
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
    formationFra: "फ्रांस 4-3-3 फॉर्मेशन का उपयोग कर रहा है, जिसमें एम्बाप्पे, गिरौद और डेम्बेले आगे हैं।",
    restroomsMetLife: "मेटलाइफ स्टेडियम में सुलभ शौचालय धारा 104, 117, 128, 143 में हैं। गेट सी के पास, धारा 112 और 114 के बगल में शौचालय हैं।",
    restroomsSoFi: "सोफी स्टेडियम में सुलभ शौचालय धारा 102, 118, 203, 219 में हैं। धारा 106 और 108 के बगल में भी शौचालय हैं।",
    elevatorsMetLife: "मेटलाइफ स्टेडियम में लिफ्ट पश्चिम लॉबी (धारा 112), पूर्वी लॉबी (धारा 134) और पेप्सी गेट (धारा 124) पर हैं।",
    elevatorsSoFi: "सोफी स्टेडियम में लिफ्ट वीआईपी लॉबी (धारा 104), उत्तरी प्रवेश द्वार (धारा 122) और दक्षिणी प्रवेश द्वार (धारा 140) पर हैं।"
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
    formationFra: "تلعب فرنسا بخطة 4-3-3 مع مبابي وجيرو وديمبيلي في الهجوم.",
    restroomsMetLife: "تتوفر دورات المياه المخصصة لذوي الاحتياجات الخاصة في ملعب ميتلايف في الأقسام 104، 117، 128، 143. بالقرب من البوابة C، توجد دورات مياه بجوار القسمين 112 و114.",
    restroomsSoFi: "تتوفر دورات المياه المخصصة في ملعب سوفي في الأقسام 102، 118، 203، 219. وبجوار القسمين 106 و108.",
    elevatorsMetLife: "توجد المصاعد في ملعب ميتلايف في الردهة الغربية (القسم 112)، الردهة الشرقية (القسم 134) وبوابة بيبسي (القسم 124).",
    elevatorsSoFi: "توجد المصاعد في ملعب سوفي في ردهة VIP (القسم 104)، المدخل الشمالي (القسم 122) والمدخل الجنوبي (القسم 140)."
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
    formationFra: "法国今天采用4-3-3阵型，由姆巴佩、吉鲁和登贝莱领衔锋线。",
    restroomsMetLife: "MetLife体育场的无障碍洗手间位于104、117、128、143区。C门（110-115区）附近，洗手间就在112区和114区旁边。",
    restroomsSoFi: "SoFi体育场的无障碍洗手间位于102、118、203、219区。在YouTube剧院门附近，洗手间在106区和108区旁边。",
    elevatorsMetLife: "MetLife体育场的电梯位于西大厅（112区旁）、东大厅（134区旁）和百事门（124区旁）。",
    elevatorsSoFi: "SoFi体育场的电梯位于VIP大厅（104区旁）、北入口（122区旁）和南入口（140区旁）。"
  }
};

/**
 * Smart mock responses with localization, sentiment, wayfinding, queue prediction, emergency, lost-companion, food ordering, custom jersey, and transit suggestions.
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
    if (q.includes('restroom') || q.includes('toilet') || q.includes('bathroom') || q.includes('wc')) {
      return dict[isArg ? 'restroomsMetLife' : 'restroomsSoFi'];
    }
    if (q.includes('elevator') || q.includes('lift')) {
      return dict[isArg ? 'elevatorsMetLife' : 'elevatorsSoFi'];
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

  // Transit & Rideshare Surge Comparison Trigger (Phase 14)
  const isTransitQuery = q.includes('uber') || q.includes('lyft') || q.includes('taxi') || q.includes('rideshare') || 
                         q.includes('train') || q.includes('metro') || q.includes('shuttle') || q.includes('transit');
  if (isTransitQuery) {
    if (isArg) {
      return `🚗 MetLife Stadium Transit & Rideshare Options:
- Lyft: $38.00 (1.6x surge multiplier) | 15 min wait time | Lot D (Zone B).
- Uber: $45.00 (1.8x surge multiplier) | 18 min wait time | Lot E (Zone A).
- NJ Transit Train (Meadowlands Station): Trains depart every 10 minutes, currently ON TIME. Cost: $10.50.
- Shuttles: 8 min wait.
💡 Recommendation: Lyft is currently $7 cheaper than Uber with a shorter line. For a completely surge-free option, the NJ Transit train is highly recommended.`;
    } else {
      return `🚗 SoFi Stadium Transit & Rideshare Options:
- Lyft: $52.00 (1.9x surge multiplier) | 20 min wait time | Rideshare Lot (Lot N).
- Uber: $60.00 (2.2x surge multiplier) | 25 min wait time | Rideshare Lot (Lot N).
- Metro C Line Shuttle (Hawthorne/Lennox): Shuttle runs every 5 minutes, currently ON TIME. Free of charge.
- Shuttles: 10 min wait.
💡 Recommendation: Lyft is currently $8 cheaper than Uber. To bypass rideshare surge pricing completely, take the free Hawthorne/Lennox metro shuttle.`;
    }
  }

  // Custom Jersey Pre-orders trigger
  const isJerseyQuery = (q.includes('jersey') || q.includes('shirt') || q.includes('kit')) && 
                        (q.includes('order') || q.includes('buy') || q.includes('custom') || q.includes('print') || q.includes('pre-order'));
  if (isJerseyQuery) {
    const team = isArg ? "Argentina" : "France";
    const ordNum = Math.floor(Math.random() * 90000) + 10000;
    
    const nameMatch = q.match(/(?:name|named)\s+([a-zA-Z0-9]+)/i);
    const jerseyName = nameMatch ? nameMatch[1].toUpperCase() : (isArg ? "MESSI" : "MBAPPE");

    const numMatch = q.match(/(?:number|no|#)\s*(\d+)/i);
    const jerseyNumber = numMatch ? numMatch[1] : "10";

    const sizeMatch = q.match(/\b(s|m|l|xl|xxl)\b/i);
    const size = sizeMatch ? sizeMatch[1].toUpperCase() : "L";

    return `[MERCH_VOUCHER: mch_${ordNum}, ${team}, ${jerseyName}, ${jerseyNumber}, ${size}, $120, Apparel Locker Sec 108]`;
  }

  // Lost Companion Lookup Trigger
  const isLostQuery = q.includes('lost') || q.includes('missing') || q.includes('cannot find');
  if (isLostQuery) {
    const sectionMatch = q.match(/(?:sec|section)\s*(\d+)/i);
    const secStr = sectionMatch ? `Section ${sectionMatch[1]}` : "112";
    
    // Call matching logic
    const matchedItem = searchFoundPerson(matchId, query);
    if (matchedItem) {
      return `🚨 COMPANION LOCATED: ${matchedItem.name} has been found by stadium stewards and is currently safe at the ${matchedItem.location}. Please head there immediately to reunite.`;
    } else {
      let name = "your companion";
      if (q.includes('sarah')) name = "Sarah";
      else if (q.includes('billy')) name = "Billy";
      else if (q.includes('leo')) name = "Leo";

      const guestBooth = isArg ? "Guest Services Booth near Section 124" : "North Guest Hub near Section 104";
      return `🚨 REPORT FILED: ${name} has been registered in the lost companions registry. Stewards in Section ${secStr} have been alerted. Please head to the ${guestBooth} immediately to coordinate the search.`;
    }
  }

  // Food Ordering / Commerce triggers
  const buyKeywords = ['order', 'buy', 'purchase', 'get some', 'want a', 'want some'];
  const foodKeywords = ['pizza', 'burger', 'hot dog', 'soda', 'coke', 'drink', 'beer'];
  const isOrderQuery = buyKeywords.some(w => q.includes(w)) && foodKeywords.some(w => q.includes(w));

  if (isOrderQuery) {
    const sectionMatch = q.match(/(?:sec|section)\s*(\d+)/i);
    const secStr = sectionMatch ? `Section ${sectionMatch[1]}` : "Section 112";
    const ordNum = Math.floor(Math.random() * 90000) + 10000;
    
    if (q.includes('pizza')) {
      const pizzaName = isArg ? "Nonna's Pizza Slice" : "Inglewood Pizza Slice";
      return `[RECEIPT: ord_${ordNum}, ${pizzaName}, 2, $12, pickup, ${secStr}, 5 mins]`;
    }
    if (q.includes('burger')) {
      const burgerName = isArg ? "Bud's Burger" : "LA Street Burger";
      const deliveryType = q.includes('deliver') || q.includes('seat') ? 'delivery' : 'pickup';
      const eta = deliveryType === 'delivery' ? '12 mins' : '5 mins';
      return `[RECEIPT: ord_${ordNum}, ${burgerName}, 1, $9.50, ${deliveryType}, ${secStr}, ${eta}]`;
    }
  }

  // Safety & Emergency Responder
  const sectionMatch = q.match(/(?:sec|section)\s*(\d+)/i);
  const secStr = sectionMatch ? `Section ${sectionMatch[1]}` : "your section";

  if (q.includes('emergency') || q.includes('medical help') || q.includes('injured') || q.includes('heart') || q.includes('bleeding')) {
    const firstAidSecs = isArg ? "Section 103, 128, or 201" : "Section 120 (Level 2) or 220 (Level 4)";
    return `🚨 EMERGENCY ALERT: A medical dispatch request has been logged for ${secStr}. Paramedics are en route immediately. If you can walk safely, the closest First Aid station is located at ${firstAidSecs}. Please keep the aisles clear.`;
  }
  if (q.includes('fight') || q.includes('security help') || q.includes('stole')) {
    return `🚨 SECURITY ALERT: A security team has been dispatched to ${secStr}. Stadium stewards are heading to your location. Please stay clear of confrontation.`;
  }
  if (q.includes('fire') || q.includes('hazard') || q.includes('spill')) {
    return `⚠️ SAFETY HAZARD REPORTED: A hazard dispatch log has been filed for ${secStr}. Stadium maintenance and cleaning crews are heading to resolve this immediately. Thank you for reporting!`;
  }

  // Smart Queue Predictions & Food recommendation queries
  if (q.includes('wait') || q.includes('queue') || q.includes('busy') || q.includes('crowded') || q.includes('line')) {
    if (q.includes('pizza') || q.includes('food') || q.includes('concession')) {
      if (isArg) {
        return "🍕 Nonnas Pizza (Sec 114) is currently congested with a 20-minute wait. I highly recommend Nonnas Pizza (Sec 324) which is clear with only a 4-minute wait!";
      } else {
        return "🍕 Inglewood Pizza (Sec 112) has a moderate 15-minute wait, but the stand at Section 340 is practically empty with only a 3-minute wait!";
      }
    }
    if (q.includes('restroom') || q.includes('toilet') || q.includes('bathroom') || q.includes('wc')) {
      if (isArg) {
        return "🚻 Restroom (Sec 112) has an 18-minute wait due to high crowd density. I recommend taking a short walk to Restroom (Sec 104) where the wait is only 2 minutes!";
      } else {
        return "🚻 Restroom (Sec 106) has a 14-minute wait, but you can head to Restroom (Sec 118) which is currently clear with a 2-minute wait!";
      }
    }
  }

  // Wayfinding queries: Restrooms
  if (q.includes('restroom') || q.includes('toilet') || q.includes('bathroom') || q.includes('wc')) {
    if (isArg) {
      return "🚻 Restrooms at MetLife Stadium are fully accessible. Family toilets are in Section 104, 117, 128, and 143. C-Gate toilets are right adjacent to Section 112 and 114.";
    } else {
      return "🚻 SoFi Stadium offers accessible restrooms and family toilets in Sections 102, 118, 203, and 219. Restrooms near YouTube Theater entry are next to Section 106 and 108.";
    }
  }

  // Wayfinding queries: Elevators
  if (q.includes('elevator') || q.includes('lift') || q.includes('escalator')) {
    if (isArg) {
      return "🛗 MetLife Passenger elevators are in the West Lobby (near Section 112), East Lobby (Section 134), and Pepsi Gate (Section 124).";
    } else {
      return "🛗 SoFi Stadium elevators are at the VIP Lobby (Section 104), North Entry (Section 122), and South Entry (Section 140).";
    }
  }

  // Wayfinding queries: Gates
  if (q.includes('gate') || q.includes('entrance') || q.includes('exit')) {
    if (isArg) {
      return "🚧 MetLife Stadium main gates: MetLife (North/East), Verizon (East), Pepsi (South/East), Bud Light (West), and SAP (North/West). Entry opens 2 hours before kickoff.";
    } else {
      return "🚧 SoFi Stadium has entry Gates 1A through 12. Main entrances are on the South and North sides. Clear bag policies are enforced.";
    }
  }

  // Wayfinding queries: Food/Pizza
  if (q.includes('food') || q.includes('pizza') || q.includes('burger')) {
    if (isArg) {
      return "🍕 'Nonnas Pizza' is at Section 114 and 324. Hot dogs and burgers are available at concessions in Sections 108, 126, 212, and 338.";
    } else {
      return "🍕 Inglewood Pizza is sold at Section 112 and 340. LA Street Food stands are located at Sections 120, 222, and 318.";
    }
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

  // Question: Score
  if (q.includes('score') || q.includes('winning') || q.includes('minute')) {
    if (isArg) {
      return prefix + "Argentina is leading Australia 2-1 in the 67th minute here at MetLife Stadium.";
    } else {
      return prefix + "France is leading Morocco 1-0 in the 43rd minute here at SoFi Stadium.";
    }
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
