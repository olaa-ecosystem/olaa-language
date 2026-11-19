import type { LanguageCode } from '../types';

const VOICE_LOCALES: Record<LanguageCode, string> = { en: 'en-US', vi: 'vi-VN' };

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speaks text with the browser's built-in TTS. Returns false when unavailable. */
export function speak(text: string, lang: LanguageCode, slow = false): boolean {
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
