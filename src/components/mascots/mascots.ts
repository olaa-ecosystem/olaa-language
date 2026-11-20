import type { MascotId } from '../../types';
import { tr } from '../../i18n/locale';

export interface MascotInfo {
  id: MascotId;
  name: string;
  /** Just the name ("Bobo"), the same in every language. */
  nickname: string;
  /** Short personality line shown when choosing a buddy. */
  tagline: string;
  /** Accent colour taken from the artwork, used for tinted backgrounds. */
  tint: string;
}

export const MASCOTS: Record<MascotId, MascotInfo> = {
  bear: {
    id: 'bear',
    nickname: 'Bobo',
    get name() {
      return tr('Gấu Bobo', 'Bobo the Bear');
    },
    get tagline() {
      return tr('Ôm thật chặt mỗi khi bạn trả lời đúng.', 'Big hugs for every right answer.');
    },
    tint: '#f6e1cf',
  },
  cat: {
    id: 'cat',
    nickname: 'Mimi',
    get name() {
      return tr('Mèo Mimi', 'Mimi the Cat');
    },
    get tagline() {
      return tr('Tò mò với từng từ mới.', 'Curious about every new word.');
    },
    tint: '#fde3cc',
  },
  dog: {
    id: 'dog',
    nickname: 'Lucky',
    get name() {
      return tr('Chó Lucky', 'Lucky the Dog');
    },
    get tagline() {
      return tr(
        'Không bỏ buổi dạo nào, cũng không bỏ bài học nào.',
        'Never misses a daily walk — or lesson.',
      );
    },
    tint: '#fdf0c4',
  },
  elephant: {
    id: 'elephant',
    nickname: 'Ellie',
    get name() {
      return tr('Voi Ellie', 'Ellie the Elephant');
    },
    get tagline() {
      return tr('Không bao giờ quên một từ nào.', 'Never forgets a single word.');
    },
    tint: '#dcedf8',
  },
  fish: {
    id: 'fish',
    nickname: 'Bubbles',
    get name() {
      return tr('Cá Bubbles', 'Bubbles the Fish');
    },
    get tagline() {
      return tr('Lặn sâu vào ngữ pháp.', 'Dives deep into grammar.');
    },
    tint: '#fdf0c4',
  },
  frog: {
    id: 'frog',
    nickname: 'Hop',
    get name() {
      return tr('Ếch Hop', 'Hop the Frog');
    },
    get tagline() {
      return tr('Nhảy từ cấp này sang cấp khác.', 'Leaps from level to level.');
    },
    tint: '#e5f2d0',
  },
  giraffe: {
    id: 'giraffe',
    nickname: 'Gigi',
    get name() {
      return tr('Hươu Gigi', 'Gigi the Giraffe');
    },
    get tagline() {
      return tr('Luôn vươn cao hơn.', 'Always reaching higher.');
    },
    tint: '#fdecc8',
  },
  rabbit: {
    id: 'rabbit',
    nickname: 'Momo',
    get name() {
      return tr('Thỏ Momo', 'Momo the Rabbit');
    },
    get tagline() {
      return tr('Tai thính, học càng nhanh.', 'Quick ears, quicker learning.');
    },
    tint: '#fde0d8',
  },
  turtle: {
    id: 'turtle',
    nickname: 'Toto',
    get name() {
      return tr('Rùa Toto', 'Toto the Turtle');
    },
    get tagline() {
      return tr('Chậm mà chắc, giữ được chuỗi ngày học.', 'Slow and steady keeps the streak.');
    },
    tint: '#d6eef2',
  },
  whale: {
    id: 'whale',
    nickname: 'Wally',
    get name() {
      return tr('Cá voi Wally', 'Wally the Whale');
    },
    get tagline() {
      return tr('Luyện tập là tạo sóng lớn.', 'Makes a big splash with practice.');
    },
    tint: '#d8e8f5',
  },
};

export function cheers(): string[] {
  return tr(
    'Tuyệt vời!|Chính xác!|Làm tốt lắm!|Xuất sắc!|Cứ thế nhé!|Hay quá!',
    'Amazing!|You got it!|Nice work!|Brilliant!|Keep it up!|Wonderful!',
  ).split('|');
}

export function comforts(): string[] {
  return tr(
    'Suýt nữa! Lát nữa thử lại nhé.|Đừng lo, sai là cách để học.|Gần đúng rồi! Lần sau sẽ được.',
    "Almost! Let's try again later.|Don't worry: mistakes help you learn.|So close! You'll get it next time.",
  ).split('|');
}
