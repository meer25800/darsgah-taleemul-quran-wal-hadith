export const ISLAMIC_REFUSAL =
  "I am the Islamic Assistant of Darsgah Taleemul Quran Wal Hadith. I can only answer questions related to Islam, the Quran, Hadith, Islamic teachings, and our institute. Please ask an Islamic or institute-related question.";

export function isLikelyRtl(text: string) {
  const rtlMatches = text.match(/[\u0600-\u06ff]/g)?.length || 0;
  return rtlMatches > Math.max(8, text.length * 0.18);
}
