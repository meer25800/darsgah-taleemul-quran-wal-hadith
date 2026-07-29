export const ISLAMIC_REFUSAL =
  "I don’t have that information. Please ask an Islamic-related question.";

export function isLikelyRtl(text: string) {
  const rtlMatches = text.match(/[\u0600-\u06ff]/g)?.length || 0;
  return rtlMatches > Math.max(8, text.length * 0.18);
}
