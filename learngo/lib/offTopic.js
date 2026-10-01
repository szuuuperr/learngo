// Off-topic guard.
//
// The brief requires the tutor to decline anything that is not computer
// science. The system prompt already asks for that, but a prompt is a
// suggestion and Langflow may be down, misconfigured, or pointed at the wrong
// flow. This guard runs before any network call, so an off-topic question never
// reaches the model and the demo stays safe regardless of the flow's state.

// Topics that must never reach the model, phrased the way a student would
// actually type them.
const OFF_TOPIC_PATTERNS = [
  // Indonesian
  /\bresep\b/i,
  /\bmasuak?\b/i,
  /\bmasak\b/i,
  /\bmasakan\b/i,
  /\bcuaca\b/i,
  /\bprakiraan\s+cuaca\b/i,
  /\bberita\b/i,
  // English
  /\bweather\b/i,
  /\bforecast\b/i,
  /\brecipe\b/i,
  /\bcook(ing)?\b/i,
  /\bstock\s+(price|market|ticker)\b/i,
  /\bcrypto\b/i,
  /\bbitcoin\b/i,
  /\bcelebrity\b/i,
  /\bfootball\s+match\b/i,
  /\bpolitic(s|al)\b/i,
  /\blove\s+(advice|life)\b/i,

  // Small talk. The brief's acceptance check is literally "apa kabar?" -> tolak
  // dengan sopan, so greetings and chitchat count as off-topic here.
  /^\s*(hai|halo|hello|hi|hei|hallo|hiya|pagi|siang|sore|malam|oy)\b/i,
  /\b(apa\s+kabar|how\s+are\s+you|how'?s\s+it\s+going|who\s+are\s+you|what'?s\s+your\s+name)\b/i,
  // "siapa kamu", "nama kamu siapa" and "kamu siapa" are all the same question,
  // so both word orders are listed rather than one clever regex.
  /\b(siapa|nama)\b[\s\S]{0,16}\b(kamu|anda|lo)\b/i,
  /\b(kamu|anda|lo)\b[\s\S]{0,16}\bsiapa\b/i,
  /\b(lol|haha|hihi|hehe|xd|wkwk)\b/i,
]

// Cheap pre-filter so a long CS question containing an innocent word like
// "bit" never gets pattern-matched needlessly. A message is only checked
// against the patterns above when it mentions one of these words at all.
const LIKELY_OFF_TOPIC =
  /\b(resep|masak|masakan|cuaca|prakiraan|berita|jadwal|liga|bola|politik|kabar|siapa|nama|news|weather|forecast|recipe|cook|stock|crypto|bitcoin|celebrity|hello|halo|hai|hi|hei|pagi|siang|sore|malam|who|how\s+are)\b/i

const REFUSAL =
  'Maaf, saya hanya bisa membantu soal pemrograman dan ilmu komputer. ' +
  'Ajukan saja pertanyaan tentang algoritma, struktur data, atau fundamental IT — saya bantu dengan metode Socratic.'

export function isOffTopic(message) {
  if (!message) return false
  if (!LIKELY_OFF_TOPIC.test(message)) return false
  return OFF_TOPIC_PATTERNS.some((re) => re.test(message))
}

export { REFUSAL }