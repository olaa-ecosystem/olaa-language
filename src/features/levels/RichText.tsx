/**
 * Renders the content team's light formatting: **bold**, line breaks and "•"/"-" bullets.
 * Text only becomes React text nodes, never HTML.
 */
import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

export function RichText({ text, lang }: { text: string; lang?: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {bullets.map((b, i) => (
            <li key={i}>{inline(b)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const line of text.split('\n')) {
    const bullet = /^\s*(?:[•·]|-\s)\s*(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1] ?? '');
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}>{inline(line)}</p>);
  }
  flush();
  return (
    <div className="rich" lang={lang}>
      {blocks}
    </div>
  );
}
