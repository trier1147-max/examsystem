const CONFIGS = {
  P0: { bg: '#ef4444', label: 'P0·一期必做' },
  P1: { bg: '#eab308', label: 'P1·一期优化' },
  P2: { bg: '#3b82f6', label: 'P2·二期' },
  P3: { bg: '#9ca3af', label: 'P3·远期' },
} as const;

type Priority = keyof typeof CONFIGS;

export function PBadge({ p }: { p: Priority }) {
  const { bg, label } = CONFIGS[p];
  return (
    <span
      style={{
        background: bg,
        color: 'white',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 11,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
