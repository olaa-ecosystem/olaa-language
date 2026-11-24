/**
 * Full-screen layer for sessions (lesson, test, review, results). Rendered into <body> so it
 * sits above the top bar and navigation whatever page animation is running.
 */
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Field } from './Field';

export function Layer({ children }: { children?: ReactNode }) {
  return createPortal(
    <div className="player-layer">
      <Field />
      {children}
    </div>,
    document.body,
  );
}
