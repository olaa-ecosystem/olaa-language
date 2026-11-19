import type { MascotId } from '../../types';
import { MascotSvg } from './MascotArt';
import { MASCOTS } from './mascots';

/** Original artwork dropped into src/assets/mascots replaces the built-in SVG automatically. */
const overrides = import.meta.glob<string>('../../assets/mascots/*.{png,webp,svg}', {
  eager: true,
  import: 'default',
});

function overrideFor(id: MascotId): string | undefined {
  const match = Object.keys(overrides).find((path) => {
    const file = path.split('/').pop() ?? '';
    return file.replace(/\.(png|webp|svg)$/, '') === id;
  });
  return match ? overrides[match] : undefined;
}

export type MascotMood = 'idle' | 'happy' | 'sad' | 'wave';

interface MascotProps {
  id: MascotId;
  size?: number;
  mood?: MascotMood;
  /** Accessible label; omit for decorative use. */
  label?: string;
  className?: string;
}

export function Mascot({ id, size = 96, mood = 'idle', label, className }: MascotProps) {
  const src = overrideFor(id);
  return (
    <span
      className={`mascot mascot--${mood} ${className ?? ''}`}
      style={{ width: size, height: size }}
      data-mascot={id}
    >
      {src ? (
        <img src={src} alt={label ?? ''} width={size} height={size} draggable={false} />
      ) : (
        <MascotSvg id={id} title={label} />
      )}
    </span>
  );
}

export function mascotName(id: MascotId): string {
  return MASCOTS[id].name;
}
