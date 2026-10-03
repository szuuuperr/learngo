// Off-topic guard.
//
// The tutor must decline anything that is not computer science. The system
// prompt already asks for that, but a prompt is only a suggestion and Langflow
// may be down or misconfigured. This runs before any network call, so an
// off-topic question never reaches the model.

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

  // Consumer-hardware news and shopping advice. Anchored on a hardware noun so
  // genuine CS questions survive: "kapan gpu terbaru rilis" is caught, while
  // "siapa yang pertama membuat bubble sort" is untouched.
  /\b(gpu|processor|chipset|video\s*card|rtx|radeon|ryzen|thread\s+ripper|intel\s+core|iphone|galaxy|playstation|ps5|switch)\b[\s\S]{0,24}\b(rilis|rilisnya|keluar|terbaru|versi\s+terbaru|launch)\b/i,
  /\b(kapan|when)\b[\s\S]{0,24}\b(gpu|processor|chipset|video\s*card|iphone|ps5)\b[\s\S]{0,24}\b(rilis|keluar|terbaru|launch|release)\b/i,
  /\bsiapa\b[\s\S]{0,24}\b(gpu|processor|laptop|handphone|smartphone|monitor)\b[\s\S]{0,16}\b(terbaik|best|bagus|rekomendasi|worth)\b/i,

  // Entertainment. Music and celebrity lookups share no vocabulary with the
  // who-are-you rules, so they need their own patterns.
  /\b(artist|artis|penyanyi|lagu|musik|album|sinetron|drama\s+korea|film|sinema|movie|bioskop)\b/i,
  /\b(song|lyrics|band|album|actor|actress|movie)\b/i,

  // Greeting plus filler with no actual question: "hai, bantu dong". The
  // particle is required so that "jelaskan pointer dong" still passes through.
  /^\s*(hai|halo|hello|hi|hei|hei|oy|hallo|hiya|pagi|siang|sore|malam)\b[\s\S]*\b(dong|doang|sih|deh)\b/i,

  // Small talk. The greeting rule must match the WHOLE message, otherwise
  // "hi, apa itu stack?" would be refused and a real question never reaches
  // the tutor. Closing punctuation is allowed; any further words end the match.
  /^\s*(hai|halo|hello|hi|hei|hallo|hiya|pagi|siang|sore|malam|oy)[\s!.?,]*$/i,
  /\b(apa\s+kabar|how\s+are\s+you|how'?s\s+it\s+going|who\s+are\s+you|what'?s\s+your\s+name)\b/i,
  // "siapa kamu", "nama kamu siapa" and "kamu siapa" are the same question, so
  // both word orders are listed rather than one clever regex.
  /\b(siapa|nama)\b[\s\S]{0,16}\b(kamu|anda|lo)\b/i,
  /\b(kamu|anda|lo)\b[\s\S]{0,16}\bsiapa\b/i,
  /\b(lol|haha|hihi|hehe|xd|wkwk)\b/i,
  // "sebutkan topik yang kamu ajarkan" asks about the tutor rather than about
  // computer science, and shares no vocabulary with the who-are-you patterns.
  // Anchored on self-reference plus an instruction verb so "kamu bisa jelaskan
  // merge sort?" still passes through.
  /\b(kamu|anda|lo)\b[\s\S]{0,24}\b(sebutkan|sebut|mention)\b[\s\S]{0,40}\b(topik|topic|bidang|materi|fokus|bantuan)\b/i,
  /\b(sebutkan|sebut|mention)\b[\s\S]{0,40}\b(topik|topic|bidang|materi|fokus)\b[\s\S]{0,24}\b(kamu|anda|lo)\b/i,
]

// Cheap pre-filter so a long CS question containing an innocent word like "bit"
// is not pattern-matched needlessly. Patterns only run when one of these words
// appears at all.
const LIKELY_OFF_TOPIC =
  /\b(resep|masak|masakan|cuaca|prakiraan|berita|jadwal|liga|bola|politik|kabar|siapa|nama|sebutkan|sebut|mention|topik|topic|bidang|materi|fokus|lol|haha|hihi|hehe|wkwk|news|weather|forecast|recipe|cook|stock|crypto|bitcoin|celebrity|hello|halo|hai|hi|hei|pagi|siang|sore|malam|who|how\s+are|gpu|processor|chipset|video\s*card|rtx|radeon|ryzen|iphone|playstation|ps5|rilis|keluar|terbaru|laptop|handphone|smartphone|monitor|terbaik|best|bagus|rekomendasi|artist|artis|penyanyi|lagu|musik|album|sinetron|film|sinema|movie|bioskop|song|lyrics|band|actor|actress)\b/i

const REFUSAL =
  'Maaf, saya hanya bisa membantu soal pemrograman dan ilmu komputer. ' +
  'Ajukan saja pertanyaan tentang algoritma, struktur data, atau fundamental IT — saya bantu dengan metode Socratic.'

export function isOffTopic(message) {
  if (!message) return false
  if (!LIKELY_OFF_TOPIC.test(message)) return false
  return OFF_TOPIC_PATTERNS.some((re) => re.test(message))
}

export { REFUSAL }