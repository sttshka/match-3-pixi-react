/** Небольшие SVG для подсказки по бустерам (без эмодзи). */

const common = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 48 48',
  fill: 'none',
  'aria-hidden': true as const,
};

export function IconLineBooster() {
  return (
    <svg {...common} width={48} height={48}>
      <rect x={4} y={18} width={40} height={12} rx={3} fill="rgba(255,255,255,0.08)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={6 + i * 11} y={20} width={9} height={8} rx={2} fill="#48dbfb" />
      ))}
      <rect x={17} y={22} width={14} height={4} rx={1} fill="#fff" opacity={0.9} />
    </svg>
  );
}

export function IconColorBooster() {
  return (
    <svg {...common} width={48} height={48}>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 9} y={22} width={7} height={6} rx={1.5} fill="#ff6b6b" opacity={0.35 + i * 0.12} />
      ))}
      <circle cx={24} cy={24} r={11} fill="#2f3542" stroke="#feca57" strokeWidth={3} />
      <circle cx={24} cy={24} r={4} fill="#feca57" opacity={0.5} />
    </svg>
  );
}

export function IconBombBooster() {
  return (
    <svg {...common} width={48} height={48}>
      <path
        d="M24 8v32M8 24h32"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={24} cy={24} r={9} fill="#ffa502" stroke="#fff" strokeWidth={2} opacity={0.95} />
      <circle cx={19} cy={19} r={2.5} fill="#fffcef" />
    </svg>
  );
}

export function IconExplode3x3() {
  return (
    <svg {...common} width={48} height={48}>
      {Array.from({ length: 9 }).map((_, i) => {
        const c = i % 3;
        const r = Math.floor(i / 3);
        const on = c === 1 && r === 1;
        return (
          <rect
            key={i}
            x={9 + c * 11}
            y={9 + r * 11}
            width={9}
            height={9}
            rx={2}
            fill={on ? '#ffa502' : 'rgba(255,255,255,0.12)'}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

export function IconLineClear() {
  return (
    <svg {...common} width={48} height={48}>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 8.5} y={14} width={7} height={20} rx={2} fill="rgba(255,255,255,0.1)" />
      ))}
      <rect x={4} y={21} width={40} height={6} rx={2} fill="#54a0ff" opacity={0.85} />
    </svg>
  );
}

export function IconColorClear() {
  return (
    <svg {...common} width={48} height={48}>
      <circle cx={14} cy={16} r={5} fill="#ff6b6b" />
      <circle cx={30} cy={18} r={5} fill="#ff6b6b" />
      <circle cx={22} cy={30} r={5} fill="#ff6b6b" />
      <circle cx={36} cy={30} r={5} fill="#48dbfb" />
      <path d="M8 40h32" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="3 3" />
    </svg>
  );
}

export function IconNoSwap() {
  return (
    <svg {...common} width={48} height={48}>
      <circle cx={18} cy={24} r={8} fill="#576574" stroke="#fff" strokeWidth={1.5} opacity={0.9} />
      <circle cx={30} cy={24} r={8} fill="#576574" stroke="#fff" strokeWidth={1.5} opacity={0.9} />
      <path d="M12 36L36 12" stroke="#ff6b6b" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
