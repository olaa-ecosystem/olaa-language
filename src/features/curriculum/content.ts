import type { Unit } from './types';

/**
 * Shared bilingual content (English ⇄ Vietnamese). Both courses read the same units and
 * simply swap which language is the target. Synthetic learning content — no user data.
 */
export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'First words',
    description: 'Say hello, meet people and name your animal friends.',
    guide: 'bear',
    lessons: [
      {
        id: 'u1-greetings',
        title: 'Greetings',
        icon: '👋',
        words: [
          { en: 'hello', vi: 'xin chào', acceptEn: ['hi'] },
          { en: 'goodbye', vi: 'tạm biệt', acceptEn: ['bye'] },
          { en: 'thank you', vi: 'cảm ơn', acceptEn: ['thanks'] },
          { en: 'yes', vi: 'vâng', acceptVi: ['có', 'dạ'] },
          { en: 'no', vi: 'không' },
          { en: 'sorry', vi: 'xin lỗi' },
        ],
        sentences: [
          {
            en: 'Hello, I am Lan.',
            vi: 'Xin chào, tôi là Lan.',
            acceptEn: ['Hi, I am Lan.', "Hello, I'm Lan.", "Hi, I'm Lan."],
          },
          { en: 'Thank you very much.', vi: 'Cảm ơn rất nhiều.', acceptEn: ['Thanks very much.'] },
          {
            en: 'Goodbye, see you later.',
            vi: 'Tạm biệt, hẹn gặp lại.',
            acceptEn: ['Bye, see you later.', 'Goodbye, see you again.'],
          },
          {
            en: 'Sorry, I do not know.',
            vi: 'Xin lỗi, tôi không biết.',
            acceptEn: ["Sorry, I don't know."],
          },
        ],
      },
      {
        id: 'u1-people',
        title: 'People',
        icon: '🧑',
        words: [
          { en: 'man', vi: 'đàn ông' },
          { en: 'woman', vi: 'phụ nữ' },
          { en: 'boy', vi: 'cậu bé' },
          { en: 'girl', vi: 'cô bé' },
          { en: 'teacher', vi: 'giáo viên', acceptVi: ['cô giáo', 'thầy giáo'] },
          { en: 'student', vi: 'học sinh', acceptVi: ['sinh viên'] },
        ],
        sentences: [
          { en: 'I am a student.', vi: 'Tôi là học sinh.', acceptEn: ["I'm a student."] },
          { en: 'You are a teacher.', vi: 'Bạn là giáo viên.', acceptEn: ["You're a teacher."] },
          {
            en: 'The girl is my friend.',
            vi: 'Cô bé là bạn của tôi.',
            acceptVi: ['Cô bé là bạn tôi.'],
          },
        ],
      },
      {
        id: 'u1-animals',
        title: 'Animal friends',
        icon: '🐾',
        words: [
          {
            en: 'cat',
            vi: 'con mèo',
            acceptEn: ['the cat', 'a cat'],
            acceptVi: ['mèo'],
            image: 'cat',
          },
          {
            en: 'dog',
            vi: 'con chó',
            acceptEn: ['the dog', 'a dog'],
            acceptVi: ['chó'],
            image: 'dog',
          },
          {
            en: 'bear',
            vi: 'con gấu',
            acceptEn: ['the bear', 'a bear'],
            acceptVi: ['gấu'],
            image: 'bear',
          },
          {
            en: 'rabbit',
            vi: 'con thỏ',
            acceptEn: ['the rabbit', 'a rabbit', 'bunny'],
            acceptVi: ['thỏ'],
            image: 'rabbit',
          },
          {
            en: 'frog',
            vi: 'con ếch',
            acceptEn: ['the frog', 'a frog'],
            acceptVi: ['ếch'],
            image: 'frog',
          },
        ],
        sentences: [
          { en: 'I have a cat.', vi: 'Tôi có một con mèo.' },
          {
            en: 'The dog is happy.',
            vi: 'Con chó vui vẻ.',
            acceptVi: ['Con chó vui.', 'Chú chó vui vẻ.'],
          },
          { en: 'The rabbit eats carrots.', vi: 'Con thỏ ăn cà rốt.' },
          {
            en: 'The frog can jump.',
            vi: 'Con ếch có thể nhảy.',
            acceptVi: ['Con ếch biết nhảy.'],
          },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'Everyday life',
    description: 'Food, family and counting to five.',
    guide: 'cat',
    lessons: [
      {
        id: 'u2-food',
        title: 'Food & drink',
        icon: '🍚',
        words: [
          { en: 'rice', vi: 'cơm' },
          { en: 'water', vi: 'nước' },
          { en: 'bread', vi: 'bánh mì' },
          { en: 'apple', vi: 'táo', acceptVi: ['quả táo'] },
          { en: 'eat', vi: 'ăn' },
          { en: 'drink', vi: 'uống' },
        ],
        sentences: [
          { en: 'I eat rice.', vi: 'Tôi ăn cơm.' },
          { en: 'She drinks water.', vi: 'Cô ấy uống nước.' },
          { en: 'The bread is good.', vi: 'Bánh mì ngon.', acceptEn: ['The bread is delicious.'] },
          { en: 'I like apples.', vi: 'Tôi thích táo.' },
        ],
      },
      {
        id: 'u2-family',
        title: 'Family',
        icon: '🏡',
        words: [
          { en: 'mother', vi: 'mẹ', acceptEn: ['mom', 'mum'] },
          { en: 'father', vi: 'bố', acceptEn: ['dad'], acceptVi: ['cha'] },
          { en: 'older sister', vi: 'chị gái' },
          { en: 'older brother', vi: 'anh trai' },
          { en: 'family', vi: 'gia đình' },
        ],
        sentences: [
          { en: 'This is my mother.', vi: 'Đây là mẹ của tôi.', acceptVi: ['Đây là mẹ tôi.'] },
          {
            en: 'I love my family.',
            vi: 'Tôi yêu gia đình của tôi.',
            acceptVi: ['Tôi yêu gia đình tôi.'],
          },
          {
            en: 'My father is a teacher.',
            vi: 'Bố của tôi là giáo viên.',
            acceptVi: ['Bố tôi là giáo viên.'],
          },
        ],
      },
      {
        id: 'u2-numbers',
        title: 'Numbers',
        icon: '🔢',
        words: [
          { en: 'one', vi: 'một' },
          { en: 'two', vi: 'hai' },
          { en: 'three', vi: 'ba' },
          { en: 'four', vi: 'bốn' },
          { en: 'five', vi: 'năm' },
        ],
        sentences: [
          { en: 'I have two cats.', vi: 'Tôi có hai con mèo.' },
          { en: 'Three bears eat bread.', vi: 'Ba con gấu ăn bánh mì.' },
          {
            en: 'Five frogs are singing.',
            vi: 'Năm con ếch đang hát.',
            acceptEn: ['Five frogs sing.'],
          },
        ],
      },
    ],
  },
  {
    id: 'u3',
    title: 'Colourful world',
    description: 'Colours, more animals and getting around town.',
    guide: 'elephant',
    lessons: [
      {
        id: 'u3-colours',
        title: 'Colours',
        icon: '🎨',
        words: [
          { en: 'red', vi: 'màu đỏ', acceptVi: ['đỏ'] },
          { en: 'blue', vi: 'màu xanh dương', acceptVi: ['xanh dương', 'xanh'] },
          { en: 'green', vi: 'màu xanh lá', acceptVi: ['xanh lá'] },
          { en: 'yellow', vi: 'màu vàng', acceptVi: ['vàng'] },
          { en: 'orange', vi: 'màu cam', acceptVi: ['cam'] },
        ],
        sentences: [
          {
            en: 'The frog is green.',
            vi: 'Con ếch màu xanh lá.',
            acceptVi: ['Con ếch có màu xanh lá.'],
          },
          {
            en: 'The whale is blue.',
            vi: 'Con cá voi màu xanh dương.',
            acceptVi: ['Cá voi màu xanh dương.'],
          },
          { en: 'The cat is orange.', vi: 'Con mèo màu cam.', acceptVi: ['Con mèo có màu cam.'] },
        ],
      },
      {
        id: 'u3-wild',
        title: 'Wild friends',
        icon: '🐘',
        words: [
          {
            en: 'elephant',
            vi: 'con voi',
            acceptEn: ['the elephant', 'an elephant'],
            acceptVi: ['voi'],
            image: 'elephant',
          },
          {
            en: 'giraffe',
            vi: 'con hươu cao cổ',
            acceptEn: ['the giraffe', 'a giraffe'],
            acceptVi: ['hươu cao cổ'],
            image: 'giraffe',
          },
          {
            en: 'fish',
            vi: 'con cá',
            acceptEn: ['the fish', 'a fish'],
            acceptVi: ['cá'],
            image: 'fish',
          },
          {
            en: 'turtle',
            vi: 'con rùa',
            acceptEn: ['the turtle', 'a turtle'],
            acceptVi: ['rùa'],
            image: 'turtle',
          },
          {
            en: 'whale',
            vi: 'con cá voi',
            acceptEn: ['the whale', 'a whale'],
            acceptVi: ['cá voi'],
            image: 'whale',
          },
        ],
        sentences: [
          {
            en: 'The elephant is big.',
            vi: 'Con voi rất to.',
            acceptEn: ['The elephant is very big.'],
            acceptVi: ['Con voi to.', 'Con voi rất lớn.'],
          },
          { en: 'The turtle is slow.', vi: 'Con rùa chậm.', acceptVi: ['Con rùa rất chậm.'] },
          {
            en: 'The fish is swimming.',
            vi: 'Con cá đang bơi.',
            acceptEn: ['The fish swims.'],
            acceptVi: ['Con cá bơi.'],
          },
          {
            en: 'The whale lives in the sea.',
            vi: 'Con cá voi sống ở biển.',
            acceptVi: ['Cá voi sống ở biển.'],
          },
        ],
      },
      {
        id: 'u3-town',
        title: 'Around town',
        icon: '🚌',
        words: [
          { en: 'school', vi: 'trường học', acceptVi: ['trường'] },
          { en: 'house', vi: 'nhà', acceptEn: ['home'], acceptVi: ['ngôi nhà'] },
          { en: 'market', vi: 'chợ' },
          { en: 'bus', vi: 'xe buýt' },
          { en: 'ticket', vi: 'vé' },
          { en: 'park', vi: 'công viên' },
        ],
        sentences: [
          { en: 'Where is the bus?', vi: 'Xe buýt ở đâu?' },
          {
            en: 'I go to school.',
            vi: 'Tôi đi học.',
            acceptVi: ['Tôi đến trường.', 'Tôi đi đến trường.'],
          },
          { en: 'One ticket, please.', vi: 'Cho tôi một vé.', acceptEn: ['A ticket, please.'] },
          {
            en: 'My house is near the park.',
            vi: 'Nhà của tôi gần công viên.',
            acceptVi: ['Nhà tôi gần công viên.'],
          },
        ],
      },
    ],
  },
];
