/** The 15 themed topics (content/topics/topics.json, imported from "Bài tập 15 chủ đề"). */
export interface Hanzi {
  hanzi: string;
  pinyin: string;
}

export interface TopicPhrase {
  vi: string;
  en: string;
  zh: Hanzi;
  es: string;
}

export interface Topic {
  id: string;
  title: string;
  level: { cefr: string; hsk: string };
  hours: string;
  vocab: TopicPhrase[];
  sentences: TopicPhrase[];
  grammar: { en: string; zh: string; es: string };
  pronunciation: { en: string; zh: string; es: string };
  skills: { skill: string; task: string; minutes: number }[];
  hanzi: string[];
  fill: { lang: 'en' | 'zh' | 'es'; sentence: string; answer: string }[];
  translate: TopicPhrase[];
  speaking: { en: string; zh: string; es: string }[];
  writing: string;
  dictation: string;
  challenge: string;
}
