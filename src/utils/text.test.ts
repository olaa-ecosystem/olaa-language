import { levenshtein, normalize, stripDiacritics, tokenize } from './text';

describe('text utils', () => {
  it('tokenizes without punctuation', () => {
    expect(tokenize('Hello, I am Lan.')).toEqual(['Hello', 'I', 'am', 'Lan']);
    expect(tokenize("I'm fine!")).toEqual(["I'm", 'fine']);
  });

  it('normalizes case, punctuation and whitespace', () => {
    expect(normalize('  Hello,   I am LAN! ')).toBe('hello i am lan');
    expect(normalize("I'm")).toBe('im');
  });

  it('strips Vietnamese diacritics', () => {
    expect(stripDiacritics('Xin chào, tôi là Đức')).toBe('Xin chao, toi la Duc');
  });

  it('computes edit distance', () => {
    expect(levenshtein('apple', 'aple')).toBe(1);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });
});
