/** Languages the browser voice can read: Vietnamese plus the languages being learned. */
export type SpeechLang = 'vi' | 'en' | 'es' | 'zh';

const VOICE_LOCALES: Record<SpeechLang, string> = {
  en: 'en-US',
  vi: 'vi-VN',
  es: 'es-ES',
  zh: 'zh-CN',
};

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speaks text with the browser's built-in TTS. Returns false when unavailable. */
export function speak(text: string, lang: SpeechLang, slow = false): boolean {
  if (!isSpeechSupported()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = VOICE_LOCALES[lang];
    utterance.lang = locale;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) utterance.voice = voice;
    utterance.rate = slow ? 0.6 : 0.95;
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
