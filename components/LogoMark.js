export default function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <g stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <line x1="20" y1="20" x2="20" y2="5" />
        <line x1="20" y1="20" x2="32" y2="11" />
        <line x1="20" y1="20" x2="9" y2="32" />
        <line x1="20" y1="20" x2="6" y2="17" />
      </g>
      <circle cx="20" cy="20" r="3" fill="#ffffff" />
    </svg>
  );
}
